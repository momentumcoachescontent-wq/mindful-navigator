-- Fix Premium Status for User
-- Corre este script en el SQL Editor de tu Supabase

UPDATE public.profiles
SET is_premium = true, premium_until = NULL  -- NULL si es premium de por vida, o cámbialo a una fecha si es temporal
WHERE user_id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'multistan.143.general@gmail.com'
);

-- Si la aplicación valida tokens u otra tabla para membresías, agrégalo aquí. Por lo pronto, profiles es la fuente estándar de la app.
