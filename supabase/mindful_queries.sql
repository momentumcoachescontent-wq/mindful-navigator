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

-- 4. Depuración (Fix XP Phantom): Eliminar progreso de usuarios inexistentes
DELETE FROM public.user_progress WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 5. Tabla de Reflexiones del Día
CREATE TABLE IF NOT EXISTS public.system_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Mindful Navigator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para system_reflections
ALTER TABLE public.system_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.system_reflections FOR SELECT USING (true);

-- Función RPC para Random Selection (usado en Index.tsx)
CREATE OR REPLACE FUNCTION get_random_reflection()
RETURNS SETOF public.system_reflections
LANGUAGE sql
AS $$
  SELECT * FROM public.system_reflections ORDER BY random() LIMIT 1;
$$;

-- Insertar Reflexiones Iniciales
INSERT INTO public.system_reflections (content, author) VALUES
('El miedo no es tu enemigo, es un mapa hacia tu poder oculto.', 'Más allá del Miedo'),
('La ansiedad es solo emoción contenida que pide movimiento.', 'Mindful Navigator'),
('No necesitas "arreglarte", solo necesitas observarte sin juicio.', 'Ernesto'),
('Tu oscuridad contiene la energía necesaria para tu propia iluminación.', 'Carl Jung'),
('Lo que resistes, persiste. Lo que aceptas, se transforma.', 'Carl Jung'),
('Hoy, sé el adulto que necesitabas cuando eras niño.', 'Inner Child'),
('Poner límites es un acto de amor propio, no de agresión.', 'Más allá del Miedo'),
('La incomodidad es el precio de la admisión para una vida significativa.', 'Susan David'),
('No eres tus pensamientos. Eres el cielo donde tus pensamientos son las nubes.', 'Eckhart Tolle'),
('Si te da paz, es el camino correcto. Si te da confusión, es una lección.', 'Anónimo'),
('La vulnerabilidad no es debilidad, es nuestra medida más precisa de valor.', 'Brené Brown'),
('Respira. Este momento es el único que tienes seguro.', 'Mindful Navigator'),
('Confía en la incertidumbre. Ahí es donde ocurre la magia.', 'Más allá del Miedo'),
('Perdonar no es liberar al otro, es liberarte a ti mismo del veneno.', 'Anónimo'),
('Tu cuerpo lleva la cuenta. Escucha lo que te dice tu tensión.', 'Bessel van der Kolk'),
('La disciplina es el puente entre metas y logros.', 'Jim Rohn'),
('No busques que el mundo cambie, cambia tu forma de verlo y el mundo cambiará.', 'Wayne Dyer'),
('El fracaso es solo información. No una sentencia.', 'Mindful Navigator'),
('Date permiso para descansar. No eres una máquina.', 'Self Care'),
('La felicidad no es la ausencia de problemas, es la habilidad de tratar con ellos.', 'Steve Maraboli'),
('Sé amable contigo mismo. Estás haciendo lo mejor que puedes.', 'Auto-compasión'),
('El primer paso para sanar es reconocer que te duele.', 'Más allá del Miedo'),
('No tienes que creer todo lo que piensas.', 'Byron Katie'),
('La paz viene de adentro. No la busques fuera.', 'Buda'),
('Cada vez que eliges lo difícil sobre lo fácil, ganas poder personal.', 'Stoicism'),
('Obsérvate a ti mismo como si fueras otra persona.', 'Distanciamiento'),
('El dolor es inevitable, el sufrimiento es opcional.', 'Haruki Murakami'),
('Hoy es un buen día para empezar de nuevo.', 'Esperanza'),
('Tus emociones son mensajeros, no dictadores.', 'Emotional Intelligence'),
('La libertad está al otro lado de tu miedo.', 'Más allá del Miedo');

-- 6. Políticas RLS para Administración
-- Permitir que los administradores inserten en el diario de cualquier usuario
CREATE POLICY "Admins can insert journal entries for any user"
    ON public.journal_entries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Permitir que los administradores vean todos los diarios (Opcional, pero útil para coherencia)
CREATE POLICY "Admins can view all journal entries"
    ON public.journal_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );


-- ========================================================================================
-- Phase 12: Mantenimiento, Seguridad y Optimización (CRÍTICO)
-- ========================================================================================

-- 1. Eliminar columna de secretos de pago (Migración a Supabase Vault / Entorno Deno)
-- ADVERTENCIA: Antes de ejecutar esto, asegúrate de haber configurado STRIPE_SECRET_KEY en Deno.
ALTER TABLE public.payment_configs DROP COLUMN IF EXISTS secret_key;
