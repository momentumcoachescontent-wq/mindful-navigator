-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  cta_link TEXT,
  category TEXT NOT NULL CHECK (category IN ('subscription', 'ebook', 'meditation', 'service', 'pack')),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active products
CREATE POLICY "Everyone can view active products"
ON public.products FOR SELECT
USING (is_active = true OR (auth.jwt() ->> 'is_admin')::boolean = true);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING ((auth.jwt() ->> 'is_admin')::boolean = true)
WITH CHECK ((auth.jwt() ->> 'is_admin')::boolean = true);

-- Add initial data requested by user
INSERT INTO public.products (title, description, price, category, cta_link, is_featured, image_url) VALUES
('Suscripción Mindful Pro', 'Acceso ilimitado a todas las herramientas y contenido premium.', 9.99, 'subscription', 'https://buy.stripe.com/test_premium', true, NULL),
('Más allá del Miedo', 'La guía definitiva para transformar el miedo en poder.', 19.99, 'ebook', 'https://amazon.com/dp/B0DJPL1C4D', true, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'),
('Pack Herramientas Complementarias', 'Recursos extra del libro "Más allá del Miedo".', 14.99, 'pack', '#', false, 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800'),
('Pack Meditaciones Premium', 'Abundancia, Eliminar Bloqueos, Ansiedad y Depresión.', 24.99, 'meditation', '#', true, 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800'),
('Mentoría 1:1', 'Sesión personalizada con coach certificado.', 99.00, 'service', 'mailto:soporte@mindfulnavigator.app', false, NULL);
