-- Inspect Users and Profiles (Corrected Schema)
-- Columns: id, email, created_at, last_sign_in_at (from auth.users)
-- Columns: display_name, goals, is_admin (from public.profiles)

SELECT 
    au.id, 
    au.email, 
    au.created_at, 
    au.last_sign_in_at,
    p.display_name,
    p.goals,
    p.is_admin
    -- Note: is_premium might be missing if not added in a migration yet, 
    -- but usually it's there. If this fails on is_premium, remove it.
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id;
