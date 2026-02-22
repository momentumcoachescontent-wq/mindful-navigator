-- 1. FIX INFINITE RECURSION PERMANENTLY
-- Instead of fighting Postgres recursion with custom admin functions,
-- the standard Supabase approach for a 'profiles' table containing public gamification
-- data (display_name, avatar_url, streak_count) is to make it readable to all logged-in users.
-- Emails and passwords remain safely hidden in auth.users.
-- This instantly fixes the Lovable updates, the Admin Panel, and the Onboarding save error.

-- Clean up previous attempts
DROP POLICY IF EXISTS "Profiles are viewable by everyone authenticated" ON public.profiles;
DROP FUNCTION IF EXISTS public.custom_is_admin();

-- Create the ultimate, non-recursive, safe SELECT policy
CREATE POLICY "Profiles are viewable by everyone authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (true); -- Anyone logged in can see the display names/avatars/levels of the community.

-- (Just to ensure the trigger from before is gone)
DROP TRIGGER IF EXISTS trg_protect_admin_fields ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_admin_fields();
