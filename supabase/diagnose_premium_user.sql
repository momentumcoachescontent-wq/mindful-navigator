-- SCRIPT DE DIAGNÓSTICO DE INTEGRIDAD DE CUENTA PREMIUM
-- Ejecuta esto en tu SQL Editor de Supabase para ver qué está pasando con este usuario

-- 1. Verificar si existen múltiples cuentas con el mismo correo en auth.users
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'multistan.143.general@gmail.com';

-- 2. Verificar el estado exacto de su perfil público
SELECT p.id as profile_id, p.user_id, u.email, p.display_name, p.is_premium, p.premium_until, p.is_admin
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'multistan.143.general@gmail.com' 
   OR p.user_id = '93748739-9596-49ed-b4e7-e57a040e20f8';

-- Si la bandera is_premium es TRUE en la tabla profiles y el user_id coincide perfectamente
-- con el session.user.id que recibe el frontend, entonces el problema es exclusivamente
-- caché del navegador del usuario (LocalStorage persiste la sesión vieja).

-- FUERZA LA ACTUALIZACIÓN SEGURA:
UPDATE public.profiles
SET is_premium = true,
    premium_until = '2099-12-31 23:59:59+00'
WHERE user_id = '93748739-9596-49ed-b4e7-e57a040e20f8';
