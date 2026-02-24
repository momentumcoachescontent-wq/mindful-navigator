-- Phase 9: Database Schema Updates para Suscripciones, Perfiles y S.O.S.

-- 1. Añadir phone_number a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 2. Añadir hide_sos a profiles (por defecto false)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hide_sos BOOLEAN DEFAULT FALSE;

-- 3. Establecer is_ranking_public con valor por defecto true y actualizar existentes
ALTER TABLE public.profiles ALTER COLUMN is_ranking_public SET DEFAULT TRUE;
UPDATE public.profiles SET is_ranking_public = TRUE WHERE is_ranking_public IS NULL;

-- 4. Opcional: Eliminar "perfiles fantasma"
-- DELETE FROM public.profiles WHERE display_name IS NULL AND user_id NOT IN (SELECT id FROM auth.users);
