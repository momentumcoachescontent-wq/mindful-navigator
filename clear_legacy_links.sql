-- Clear legacy CTA links to enable Stripe checkout
UPDATE public.products
SET cta_link = NULL
WHERE cta_link LIKE '%test%' OR cta_link LIKE '%gumroad%';

-- Verify changes
SELECT id, title, cta_link FROM public.products ORDER BY title;
