-- Fix get_admin_stats to count from public.profiles instead of auth.users
-- This ensures the dashboard number matches the actual users visible in the table.

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users INTEGER;
  v_premium_users INTEGER;
  v_total_scans INTEGER;
  v_avg_scans NUMERIC;
  v_total_audio_seconds INTEGER;
  v_is_admin BOOLEAN;
BEGIN
  -- AUTH CHECK
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE user_id = auth.uid();
  
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Change from auth.users to public.profiles to match the list array
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  SELECT COUNT(*) INTO v_premium_users FROM public.profiles WHERE is_premium = true;
  
  SELECT COUNT(*) INTO v_total_scans FROM public.journal_entries WHERE entry_type = 'scanner_result';
  
  IF v_total_users > 0 THEN
    v_avg_scans := ROUND(v_total_scans::NUMERIC / v_total_users::NUMERIC, 2);
  ELSE
    v_avg_scans := 0;
  END IF;

  SELECT COALESCE(SUM(duration_seconds), 0) INTO v_total_audio_seconds FROM public.meditation_logs;

  RETURN json_build_object(
    'total_users', v_total_users,
    'premium_users', v_premium_users,
    'total_ai_scans', v_total_scans,
    'avg_scans_per_user', v_avg_scans,
    'total_audio_hours', ROUND(v_total_audio_seconds::NUMERIC / 3600.0, 1)
  );
END;
$$;
