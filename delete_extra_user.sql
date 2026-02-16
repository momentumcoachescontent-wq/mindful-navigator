-- Delete the extra user 'ealvareze1@gmail.com'
-- This will cascade to public.profiles and other related tables.

DELETE FROM auth.users 
WHERE id = 'fe4b09ee-20ca-4aa0-8d60-55d7650fd48c';

-- Verification (should return 0 rows)
SELECT * FROM auth.users WHERE email = 'ealvareze1@gmail.com';
