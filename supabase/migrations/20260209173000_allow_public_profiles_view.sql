-- Allow authenticated users to view all profiles for ranking purposes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
