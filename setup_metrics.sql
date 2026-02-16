-- Configuración de Métricas de Productos (Fase 1.2)

-- 1. Tabla de Eventos de Productos
CREATE TABLE IF NOT EXISTS public.product_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    event_type text NOT NULL, -- 'click_cta', 'view_details'
    metadata jsonb DEFAULT '{}', -- Para guardar info extra (user_agent, campaña, etc)
    user_id uuid REFERENCES auth.users(id), -- Opcional, si el usuario está logueado
    created_at timestamptz DEFAULT now()
);

-- Índices para búsquedas rápidas en el dashboard
CREATE INDEX IF NOT EXISTS idx_product_events_product_id ON public.product_events(product_id);
CREATE INDEX IF NOT EXISTS idx_product_events_created_at ON public.product_events(created_at);

-- 2. Políticas RLS (Seguridad)
ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

-- Cualquiera (incluso anónimos convertidos a leads) puede insertar eventos (registrar clicks)
CREATE POLICY "Public can insert events" 
ON public.product_events FOR INSERT 
TO public, anon, authenticated
WITH CHECK (true);

-- Solo admins pueden ver los eventos (Analytics)
CREATE POLICY "Admins can view events" 
ON public.product_events FOR SELECT 
TO authenticated 
USING (
  exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid()
    and profiles.is_admin = true
  )
);
