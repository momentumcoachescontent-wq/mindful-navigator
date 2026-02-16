-- Enable Subscriptions & My Orders Dashboard

-- 1. Add 'interval' to products (to distinguish One-time vs Subscription)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS interval TEXT CHECK (interval IN ('month', 'year'));

-- 2. Create User Subscriptions Table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT,
    product_id UUID REFERENCES public.products(id),
    status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'incomplete'
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS for Subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service Role (Edge Functions) has full access
-- (Implicitly true)

-- 4. Update 'Orders' to support subscription linkage (Optional/Future proof)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.user_subscriptions(id);
