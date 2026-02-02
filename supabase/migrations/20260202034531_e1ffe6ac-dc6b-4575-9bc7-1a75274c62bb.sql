-- =================================================================
-- SECURITY FIXES MIGRATION
-- =================================================================

-- 1. Add is_public column to daily_victories for consent-based sharing
ALTER TABLE public.daily_victories 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Drop existing RLS policies on daily_victories
DROP POLICY IF EXISTS "Users can view their own victories" ON public.daily_victories;
DROP POLICY IF EXISTS "Users can create their own victories" ON public.daily_victories;
DROP POLICY IF EXISTS "Users can update their own victories" ON public.daily_victories;
DROP POLICY IF EXISTS "Users can delete their own victories" ON public.daily_victories;

-- Create new RLS policies for daily_victories with is_public support
CREATE POLICY "Users can view own victories or public ones"
ON public.daily_victories FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_public = true
);

CREATE POLICY "Users can create their own victories"
ON public.daily_victories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own victories"
ON public.daily_victories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own victories"
ON public.daily_victories FOR DELETE
USING (auth.uid() = user_id);

-- 2. Create premium check helper function (SECURITY DEFINER to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_user_premium(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  premium_status BOOLEAN;
  premium_end TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT is_premium, premium_until
  INTO premium_status, premium_end
  FROM profiles
  WHERE user_id = check_user_id;
  
  RETURN COALESCE(premium_status, false) AND premium_end > now();
END;
$$;

-- 3. Update meditations RLS - restrict premium content at database level
-- Drop existing policy
DROP POLICY IF EXISTS "Meditations are viewable by everyone" ON public.meditations;
DROP POLICY IF EXISTS "Free meditations viewable by all" ON public.meditations;
DROP POLICY IF EXISTS "Premium meditations require subscription" ON public.meditations;
DROP POLICY IF EXISTS "All users can view free meditations" ON public.meditations;
DROP POLICY IF EXISTS "Premium users can view premium meditations" ON public.meditations;

-- Create separate policies for free and premium meditations
CREATE POLICY "All users can view free meditations"
ON public.meditations FOR SELECT
USING (is_free = true);

CREATE POLICY "Premium users can view premium meditations"
ON public.meditations FOR SELECT
USING (
  is_free = false 
  AND public.is_user_premium(auth.uid())
);

-- 4. Make meditations storage bucket private and add proper policies
UPDATE storage.buckets 
SET public = false 
WHERE id = 'meditations';

-- Drop old storage policy
DROP POLICY IF EXISTS "Meditation audio is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Free meditation audio accessible to all" ON storage.objects;
DROP POLICY IF EXISTS "Premium meditation audio for subscribers" ON storage.objects;

-- Create storage policies for meditations based on premium status
-- Free meditations accessible to authenticated users
CREATE POLICY "Free meditation audio accessible to authenticated users"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meditations'
  AND EXISTS (
    SELECT 1 FROM public.meditations m
    WHERE m.audio_url LIKE '%' || storage.objects.name
    AND m.is_free = true
  )
);

-- Premium meditations only for premium users
CREATE POLICY "Premium meditation audio for premium users"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meditations'
  AND public.is_user_premium(auth.uid())
);

-- 5. Add index for faster victory queries
CREATE INDEX IF NOT EXISTS idx_daily_victories_public 
ON public.daily_victories(is_public, created_at DESC) 
WHERE is_public = true;