-- Fix: Remove overly permissive policies on daily_reflections
-- Any authenticated user should NOT be able to modify global motivational content

-- Drop the problematic policies that allow any authenticated user to manage reflections
DROP POLICY IF EXISTS "Authenticated users can create daily reflections" ON public.daily_reflections;
DROP POLICY IF EXISTS "Authenticated users can update daily reflections" ON public.daily_reflections;
DROP POLICY IF EXISTS "Authenticated users can delete daily reflections" ON public.daily_reflections;

-- Keep only the SELECT policy for viewing active reflections (already exists)
-- Management of daily_reflections should only happen through service_role (edge functions or direct admin access)