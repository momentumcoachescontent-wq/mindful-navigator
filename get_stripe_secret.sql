-- Retrieve Stripe Secret Key for Edge Function Configuration
SELECT secret_key 
FROM public.payment_configs 
WHERE provider = 'stripe';
