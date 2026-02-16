-- Migration: Restore Policies 2026-02-16
-- Description: Restores missing RLS policies for products and stripe_customers to fix "RLS Enabled No Policy" warnings.

BEGIN;

-- =================================================================
-- 1. Restore public.products policies
-- =================================================================

-- Standard practice: "Everyone can view active products".
-- We use a simpler check for admin status if needed, or stick to the JWT claim method used previously in valid migrations.
-- Assuming standard robust pattern:

DROP POLICY IF EXISTS "Everyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Everyone can view active products"
ON public.products FOR SELECT
USING (
  is_active = true 
  OR 
  (auth.jwt() ->> 'is_admin')::boolean = true
);

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (
  (auth.jwt() ->> 'is_admin')::boolean = true
)
WITH CHECK (
  (auth.jwt() ->> 'is_admin')::boolean = true
);

-- =================================================================
-- 2. Restore public.stripe_customers policies
-- =================================================================

-- Users see their own ID (needed for billing portal links etc)
-- Service role manages the table.

DROP POLICY IF EXISTS "Users can view their own stripe customer" ON public.stripe_customers;
DROP POLICY IF EXISTS "Service can manage stripe customers" ON public.stripe_customers;

CREATE POLICY "Users can view their own stripe customer"
ON public.stripe_customers FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

CREATE POLICY "Service can manage stripe customers"
ON public.stripe_customers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;
