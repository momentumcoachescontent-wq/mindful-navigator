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

-- ========================================================================================
-- Phase 11: Database Schema Updates para Rankings Regionales y Círculos
-- ========================================================================================

-- 1. Añadir columna 'country' a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- 2. Crear tabla de Conexiones de Usuario (para "Mi Círculo")
CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- 3. RLS para user_connections
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections"
    ON public.user_connections FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their own connections"
    ON public.user_connections FOR ALL
    USING (auth.uid() = user_id);

-- ========================================================================================
-- Phase 12: Mantenimiento, Seguridad y Optimización (CRÍTICO)
-- ========================================================================================

-- 1. Eliminar columna de secretos de pago (Migración a Supabase Vault / Entorno Deno)
-- ADVERTENCIA: Antes de ejecutar esto, asegúrate de haber configurado STRIPE_SECRET_KEY en Deno.
ALTER TABLE public.payment_configs DROP COLUMN IF EXISTS secret_key;
