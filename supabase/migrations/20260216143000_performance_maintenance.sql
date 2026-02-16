-- Migration: Performance Maintenance 2026-02-16
-- Description: Fixes auth_rls_initplan warnings by wrapping auth functions in subqueries, and removes duplicate policies.

BEGIN;

-- =================================================================
-- 1. Fix auth_rls_initplan (Wrap auth.uid() in selects)
-- =================================================================

-- TABLE: public.payment_configs
-- Re-create admin policies with optimization
DROP POLICY IF EXISTS "Admins can view payment configs" ON public.payment_configs;
DROP POLICY IF EXISTS "Admins can insert payment configs" ON public.payment_configs;
DROP POLICY IF EXISTS "Admins can update payment configs" ON public.payment_configs;
DROP POLICY IF EXISTS "Admins can delete payment configs" ON public.payment_configs;

CREATE POLICY "Admins can view payment configs"
ON public.payment_configs FOR SELECT
TO authenticated
USING (
  exists (
    select 1 from public.profiles
    where profiles.user_id = (select auth.uid())
    and profiles.is_admin = true
  )
);

CREATE POLICY "Admins can insert payment configs"
ON public.payment_configs FOR INSERT
TO authenticated
WITH CHECK (
  exists (
    select 1 from public.profiles
    where profiles.user_id = (select auth.uid())
    and profiles.is_admin = true
  )
);

CREATE POLICY "Admins can update payment configs"
ON public.payment_configs FOR UPDATE
TO authenticated
USING (
  exists (
    select 1 from public.profiles
    where profiles.user_id = (select auth.uid())
    and profiles.is_admin = true
  )
);

CREATE POLICY "Admins can delete payment configs"
ON public.payment_configs FOR DELETE
TO authenticated
USING (
  exists (
    select 1 from public.profiles
    where profiles.user_id = (select auth.uid())
    and profiles.is_admin = true
  )
);

-- TABLE: public.product_events
DROP POLICY IF EXISTS "Admins can view events" ON public.product_events;

CREATE POLICY "Admins can view events"
ON public.product_events FOR SELECT
TO authenticated
USING (
  exists (
    select 1 from public.profiles
    where profiles.user_id = (select auth.uid())
    and profiles.is_admin = true
  )
);

-- TABLE: public.orders
-- Fix initplan + Ensure explicit TO authenticated
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  exists (
    select 1 from public.profiles
    where profiles.user_id = (select auth.uid())
    and profiles.is_admin = true
  )
);

CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid())
);

-- TABLE: public.user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscriptions"
ON public.user_subscriptions FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid())
);


-- =================================================================
-- 2. Fix multiple_permissive_policies (Remove duplicates/legacy)
-- =================================================================

-- TABLE: public.profiles
-- Removing legacy policies that have short names and overlap with descriptive ones
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- TABLE: public.products
-- Removing legacy policies that overlap with "Everyone can view active products"
DROP POLICY IF EXISTS "products_all_admin" ON public.products;
DROP POLICY IF EXISTS "products_select_public" ON public.products;

-- TABLE: public.orders
-- (Handled above by recreating the 'standard' named ones, assumming legacy ones don't exist under different names. 
-- The warning only cited "Admins can view all orders" and "Users can view own orders" as the permissive set.
-- By setting them TO authenticated, we fix the issue of them being permissive to anon if that was the case).

COMMIT;
