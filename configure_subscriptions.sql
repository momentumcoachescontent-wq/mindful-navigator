-- Configure Subscription Products
-- Mark "Suscripción" products as 'month' interval

UPDATE public.products
SET interval = 'month'
WHERE title ILIKE '%Suscripción%' OR title ILIKE '%Mindful Pro%';

-- Verify
SELECT id, title, price, interval FROM public.products ORDER BY title;
