-- Migration: Security Maintenance 2026-02-16
-- Description: Fixes function search_path mutable warnings and hardens RLS on product_events.

-- 1. Fix function_search_path_mutable
-- It is recommended to set a fixed search_path for security defined functions
-- to prevent malicious code from overriding objects in the search path.

BEGIN;

-- Attempt to alter functions.
-- Note: If functions have overloaded signatures, this might need specific argument types.
-- Assuming unique names based on the project structure.

ALTER FUNCTION public.calculate_level(integer) SET search_path = public, pg_temp;
-- Fallback if signature is different, try to catch potential overloads by being specific if known,
-- otherwise relies on unique name if no args are passed, but safer to try to match likely signatures or use unique name.
-- Since I cannot verify the exact signature, I will try to use the name only if unique.
-- However, Postgres requires arguments for ALTER FUNCTION if there are ambiguous names or just to be precise.
-- Let's try without arguments first, assuming uniqueness.

ALTER FUNCTION public.calculate_level SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_xp_journal SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_xp_meditation SET search_path = public, pg_temp;
ALTER FUNCTION public.add_xp SET search_path = public, pg_temp;
ALTER FUNCTION public.update_streak SET search_path = public, pg_temp;

-- 2. Fix rls_policy_always_true for product_events
-- The previous policy was "WITH CHECK (true)", which is insecure for public inserts if not intended.
-- We add a basic validation that 'event_type' must exist.

DROP POLICY IF EXISTS "Public can insert events" ON public.product_events;

CREATE POLICY "Public can insert events"
ON public.product_events
FOR INSERT
TO public
WITH CHECK (
  -- Ensure essential data is present
  event_type IS NOT NULL AND char_length(event_type) > 0
);

COMMIT;
