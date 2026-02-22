-- 1. FIX SCANNER DATA LOSS
ALTER TABLE public.scanner_history ADD COLUMN IF NOT EXISTS observations TEXT;

-- 2. ADD RANKING CONSENT COLUMN
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_ranking_public BOOLEAN DEFAULT false;

-- 3. SECURE PROFILES RLS
DROP POLICY IF EXISTS "Profiles are viewable by everyone authenticated" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_ranking_public = true);

-- 4. PROTECT ADMIN/PREMIUM FIELDS
-- Trigger to prevent non-admins from promoting themselves
CREATE OR REPLACE FUNCTION public.protect_admin_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user attempting the update is NOT an admin, prevent changing is_admin or is_premium
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    -- If trying to change is_admin to true
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin AND NEW.is_admin = true THEN
      RAISE EXCEPTION 'Only current admins can promote other users to admin.';
    END IF;
    
    -- If trying to change is_premium (unless it is through the system logic, but here we protect it from manual client updates)
    -- Note: This might be tricky if the frontend updates profiles regularly. 
    -- We specifically want to prevent users from bypassing payment.
    IF NEW.is_premium IS DISTINCT FROM OLD.is_premium AND NEW.is_premium = true AND (OLD.is_premium = false OR OLD.is_premium IS NULL) THEN
        RAISE EXCEPTION 'Premium status can only be updated by the system or an admin.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_admin_fields ON public.profiles;
CREATE TRIGGER trg_protect_admin_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_admin_fields();

-- 5. SECURE ADMIN STATS FUNCTION
DROP FUNCTION IF EXISTS public.get_admin_stats();

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users INTEGER;
  premium_users INTEGER;
  total_scans INTEGER;
  avg_scans NUMERIC;
  total_audio_seconds INTEGER;
  v_is_admin BOOLEAN;
BEGIN
  -- AUTH CHECK
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE user_id = auth.uid();
  
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO premium_users FROM public.profiles WHERE is_premium = true;
  
  SELECT COUNT(*) INTO total_scans FROM public.journal_entries WHERE entry_type = 'scanner_result';
  
  IF total_users > 0 THEN
    avg_scans := ROUND(total_scans::NUMERIC / total_users::NUMERIC, 2);
  ELSE
    avg_scans := 0;
  END IF;

  SELECT COALESCE(SUM(duration_seconds), 0) INTO total_audio_seconds FROM public.meditation_logs;

  RETURN json_build_object(
    'total_users', total_users,
    'premium_users', premium_users,
    'total_ai_scans', total_scans,
    'avg_scans_per_user', avg_scans,
    'total_audio_hours', ROUND(total_audio_seconds::NUMERIC / 3600.0, 1)
  );
END;
$$;

-- 6. ADD MISSING POLICIES FOR MEDITATION LOGS
DROP POLICY IF EXISTS "Users can update their own logs" ON public.meditation_logs;
CREATE POLICY "Users can update their own logs"
ON public.meditation_logs FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own logs" ON public.meditation_logs;
CREATE POLICY "Users can delete their own logs"
ON public.meditation_logs FOR DELETE
USING (auth.uid() = user_id);
