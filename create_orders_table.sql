-- Create Orders Table for Stripe Integration
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for guest checkout
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    stripe_session_id TEXT UNIQUE NOT NULL,
    amount_total NUMERIC,
    currency TEXT,
    status TEXT DEFAULT 'pending', -- 'completed', 'refunded', 'failed'
    customer_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'service_role' OR is_super_admin = true)); 
    -- Adjust admin check based on your actual admin logic, usually service_role is enough for webhooks.

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service Role (Edge Function) has full access
-- (Implicitly true for service_role, but good to keep in mind)
