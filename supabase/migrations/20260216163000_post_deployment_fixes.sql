-- Migration: Post-Deployment Fixes 2026-02-16
-- Description: Fixes persistent performance warnings (auth_rls_initplan, multiple_permissive_policies) 
-- by consolidating overlapping policies and optimizing auth function calls.

BEGIN;

-- =================================================================
-- 1. Optimize Products Policies (Consolidate Overlap)
-- =================================================================
-- Warning: "multiple_permissive_policies" (Admins manage + Everyone view)
-- Warning: "auth_rls_initplan" (Recalculating auth.jwt())

DROP POLICY IF EXISTS "Everyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Unified SELECT policy (One policy for all reads)
CREATE POLICY "Unified view products"
ON public.products FOR SELECT
USING (
  -- Public can see active ones
  is_active = true 
  OR 
  -- Admins can see everything (optimized check)
  (select (auth.jwt() ->> 'is_admin')::boolean) = true
);

-- Admin Write Policies (Split to avoid overlap with SELECT)
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK ( (select (auth.jwt() ->> 'is_admin')::boolean) = true );

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING ( (select (auth.jwt() ->> 'is_admin')::boolean) = true );

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING ( (select (auth.jwt() ->> 'is_admin')::boolean) = true );

-- =================================================================
-- 2. Optimize Orders Policies (Consolidate Overlap)
-- =================================================================
-- Warning: "multiple_permissive_policies" (Users own + Admins all)

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Unified SELECT policy
CREATE POLICY "Unified view orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  -- User is owner
  user_id = (select auth.uid())
  OR
  -- User is admin (via profile lookup)
  exists (
    select 1 from public.profiles
    where profiles.user_id = (select auth.uid())
    and profiles.is_admin = true
  )
);

-- Ensure write policies are optimized (from performance_maintenance.sql)
-- We won't touch them if they don't overlap on SELECT, but let's check legacy.
-- We already fixed write policies in previous migration, so usually they are separated by action.
-- If "Users can insert own orders" and "Admins can insert" exist, they might overlap, but usually we just want to fix READ for now as per warning.

-- =================================================================
-- 3. Optimize Stripe Customers (InitPlan)
-- =================================================================
-- Warning: "auth_rls_initplan"

DROP POLICY IF EXISTS "Users can view their own stripe customer" ON public.stripe_customers;

CREATE POLICY "Users can view their own stripe customer"
ON public.stripe_customers FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid()) -- Wrapped in select
);

COMMIT;
