-- Configuración de Comercio V2 (Moneda y Credenciales)

-- 1. Añadir columna de moneda a la tabla de productos (si no existe)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'MXN';

-- 2. Crear tabla de configuraciones de pago (Credenciales)
CREATE TABLE IF NOT EXISTS public.payment_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider text NOT NULL, -- 'stripe', 'paypal', 'mercadopago'
    public_key text,
    secret_key text, -- Nota: Idealmente encriptado o en Edge Functions secrets
    is_active boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(provider)
);

-- 3. Políticas RLS para payment_configs (Seguridad)
ALTER TABLE public.payment_configs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver y editar configuraciones de pago
CREATE POLICY "Admins can view payment configs" 
ON public.payment_configs FOR SELECT 
TO authenticated 
USING (
  exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid()
    and profiles.is_admin = true
  )
);

CREATE POLICY "Admins can insert payment configs" 
ON public.payment_configs FOR INSERT 
TO authenticated 
WITH CHECK (
  exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid()
    and profiles.is_admin = true
  )
);

CREATE POLICY "Admins can update payment configs" 
ON public.payment_configs FOR UPDATE 
TO authenticated 
USING (
  exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid()
    and profiles.is_admin = true
  )
);

CREATE POLICY "Admins can delete payment configs" 
ON public.payment_configs FOR DELETE 
TO authenticated 
USING (
  exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid()
    and profiles.is_admin = true
  )
);

-- 4. Actualizar productos existentes a MXN (por seguridad)
UPDATE public.products SET currency = 'MXN' WHERE currency IS NULL;
