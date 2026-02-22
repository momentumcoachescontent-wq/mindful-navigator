-- Drop restrictive select policies that hide premium meditations from regular users
DROP POLICY IF EXISTS "All users can view free meditations" ON public.meditations;
DROP POLICY IF EXISTS "Premium users can view premium meditations" ON public.meditations;
DROP POLICY IF EXISTS "Meditations are viewable by everyone" ON public.meditations;

-- Create a single, open policy for SELECTing meditations.
-- The application frontend (`Meditations.tsx`) handles the locking mechanism for playback,
-- so all users need to be able to FETCH the metadata for all meditations.
CREATE POLICY "Meditations are viewable by everyone" 
ON public.meditations FOR SELECT 
USING (true);
