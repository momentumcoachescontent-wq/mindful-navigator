-- Migration: Indexing Maintenance 2026-02-16
-- Description: Adds missing indexes for foreign keys to improve join performance and removes unused/redundant indexes.

BEGIN;

-- =================================================================
-- 1. Add Missing Foreign Key Indexes
-- =================================================================

-- public.daily_victories
CREATE INDEX IF NOT EXISTS idx_daily_victories_user_id ON public.daily_victories(user_id);

-- public.journal_entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);

-- public.meditation_logs
CREATE INDEX IF NOT EXISTS idx_meditation_logs_meditation_id ON public.meditation_logs(meditation_id);
CREATE INDEX IF NOT EXISTS idx_meditation_logs_user_id ON public.meditation_logs(user_id);

-- public.orders
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_subscription_id ON public.orders(subscription_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- public.product_events
CREATE INDEX IF NOT EXISTS idx_product_events_user_id ON public.product_events(user_id);

-- public.scanner_history
CREATE INDEX IF NOT EXISTS idx_scanner_history_user_id ON public.scanner_history(user_id);

-- public.trusted_contacts
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user_id ON public.trusted_contacts(user_id);

-- public.user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- public.user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_product_id ON public.user_subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- =================================================================
-- 2. Remove Unused / Redundant Indexes
-- =================================================================

-- public.profiles: idx_profiles_user_id is likely redundant if user_id is UNIQUE or PK
-- Standard setup has profiles(user_id) as specific unique key or PK, creating implicit index.
DROP INDEX IF EXISTS public.idx_profiles_user_id;

-- public.product_events: idx_product_events_created_at
-- Reported as unused. If we don't query events by strictly date often (mostly by user or product), this wastes write IO.
DROP INDEX IF EXISTS public.idx_product_events_created_at;

COMMIT;
