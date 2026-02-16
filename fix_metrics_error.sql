-- Fix for Admin Dashboard Stats Error
-- Re-creates the get_admin_stats function to ensure it exists and is accessible.

-- 1. Ensure meditation_logs exists (dependency for stats)
CREATE TABLE IF NOT EXISTS public.meditation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meditation_id UUID NOT NULL REFERENCES public.meditations(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS just in case
ALTER TABLE public.meditation_logs ENABLE ROW LEVEL SECURITY;

-- 2. Re-create the RPC function
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB
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
BEGIN
  -- Stats queries
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO premium_users FROM public.profiles WHERE is_premium = true;
  
  -- Check if journal_entries exists before querying, otherwise return 0 for scans
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'journal_entries') THEN
    SELECT COUNT(*) INTO total_scans FROM public.journal_entries WHERE entry_type = 'scanner_result';
  ELSE
    total_scans := 0;
  END IF;
  
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
