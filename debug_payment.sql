-- Debug Payment Configuration and Products
-- 1. Check if Stripe config exists and is active (Masking secret)
SELECT 
    provider, 
    is_active, 
    CASE WHEN secret_key IS NOT NULL AND length(secret_key) > 10 THEN 'Yes (Masked)' ELSE 'MISSING/SHORT' END as secret_key_status,
    updated_at
FROM public.payment_configs 
WHERE provider = 'stripe';

-- 2. Check 5 products to see if they have valid prices and no legacy links
SELECT id, title, price, currency, cta_link 
FROM public.products 
WHERE is_active = true 
LIMIT 5;
