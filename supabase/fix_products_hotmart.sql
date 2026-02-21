-- ================================================================
-- FIX: Agregar campo order_index + insertar productos con Hotmart
-- ================================================================

-- 1. Agregar columna order_index si no existe
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MXN';

-- 2. Limpiar productos existentes con links incorrectos de Amazon
DELETE FROM public.products WHERE cta_link LIKE '%amazon.com%';

-- 3. Insertar productos completos
INSERT INTO public.products (title, description, price, currency, category, cta_link, is_featured, image_url, is_active, order_index) VALUES
('Plan Gratuito', 'Acceso básico al Diario, 3 Escáneres mensuales y comunidad de apoyo.', 0, 'MXN', 'subscription', NULL, false, NULL, true, 1),
('Suscripción Brave Path Pro', 'Acceso ilimitado a todas las herramientas, contenido premium y meditaciones exclusivas.', 199, 'MXN', 'subscription', NULL, true, NULL, true, 2),
('Más allá del Miedo — El Libro', 'La guía definitiva para transformar el miedo en poder. Disponible en formato digital.', 399, 'MXN', 'ebook', 'https://go.hotmart.com/W100827848Q', true, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800', true, 3),
('Pack Herramientas del Libro', 'Recursos complementarios del libro: plantillas, ejercicios y audios exclusivos.', 299, 'MXN', 'pack', NULL, false, 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800', true, 4),
('Pack Meditaciones Premium', 'Colección completa: Abundancia, Eliminar Bloqueos, Ansiedad y Depresión.', 499, 'MXN', 'meditation', NULL, true, 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800', true, 5),
('Mentoría 1:1 con Coach', 'Sesión personalizada de 60 min con coach certificado en psicología aplicada.', 1999, 'MXN', 'service', 'mailto:soporte@bravepath.app', false, NULL, true, 6)
ON CONFLICT DO NOTHING;

-- 4. Verificar
SELECT title, category, price, order_index, cta_link, is_active FROM public.products ORDER BY order_index;
