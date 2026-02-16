-- Migration: Lovable Remediation 2026-02-16
-- Description: Fixes critical issues reported by Lovable: Scanner data loss, Admin privilege escalation, and Storage security.

BEGIN;

-- =================================================================
-- 1. Fix Scanner Data Loss (Add missing column)
-- =================================================================
-- Report: "Scanner saves to wrong database fields causing data loss"
-- Investigation: `observations` field allows saving the "What to observe" output from AI.
ALTER TABLE public.scanner_history ADD COLUMN IF NOT EXISTS observations TEXT;

-- =================================================================
-- 2. Fix Admin Privilege Escalation (Protect is_admin)
-- =================================================================
-- Report: "Admin-only content policies rely on user-modifiable is_admin field"
-- Fix: Prevent users from updating their own `is_admin` status.

CREATE OR REPLACE FUNCTION public.protect_admin_column()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user tries to change is_admin
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- Allow if it's a superuser (service_role) or if the user is ALREADY an admin (admins can promote others?)
    -- Ideally, only service_role should promote.
    -- For now, we strictly block self-promotion via RLS by raising error if auth.uid() == NEW.user_id 
    -- and they are not a service role (which bypasses RLS anyway, but good to be explicit in trigger).
    
    -- Check if the executor is the user themselves
    IF auth.uid() = NEW.user_id THEN
       -- If they are trying to change is_admin, revert it or raise error.
       -- Reverting is safer/smoother: ignore the change to is_admin.
       NEW.is_admin = OLD.is_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_profiles_admin_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_admin_column();

-- =================================================================
-- 3. Fix Storage Permissions (Avatar Bucket)
-- =================================================================
-- Report: "Avatar storage bucket is fully public without restrictions"
-- Fix: Add RLS policies to storage.objects for the 'avatars' bucket.

-- Ensure RLS is enabled on storage.objects (usually is by default in Supabase)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read (Avatars are usually public)
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
CREATE POLICY "Public Access to Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Policy: User Upload (Only to their own folder/file)
-- Assumption: Avatars are stored as `avatars/{user_id}/...` or just `{user_id}.png`
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: User Update/Delete (Own avatar)
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;
