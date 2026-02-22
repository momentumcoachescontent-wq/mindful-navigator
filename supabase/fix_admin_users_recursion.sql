-- 1. FIX INFINITE RECURSION IN PROFILES RLS
-- Querying public.profiles inside a policy for public.profiles causes an infinite loop.
-- When Postgres hits this loop, the policy fails and returns 0 rows for everyone (even admins).
-- To fix this, we create a helper function that runs with elevated privileges (SECURITY DEFINER)
-- to check the admin status without triggering the RLS policy again.

-- Create the helper function
CREATE OR REPLACE FUNCTION public.custom_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This makes it bypass RLS
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT is_admin INTO v_is_admin 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- Drop the broken recursive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone authenticated" ON public.profiles;

-- Create the new safe policy
CREATE POLICY "Profiles are viewable by everyone authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.custom_is_admin() = true
);

-- 2. Ensure the Lovable trigger is dropped (just in case they didn't run the second half previously)
DROP TRIGGER IF EXISTS trg_protect_admin_fields ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_admin_fields();
