-- Create a separate secure table for Stripe customer IDs
-- This table is ONLY accessible via service_role (edge functions)
-- No client-side access is allowed

CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but with NO user-accessible policies
-- Only service_role can access this table
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- No SELECT, INSERT, UPDATE, DELETE policies for authenticated users
-- This means only service_role key (used in edge functions) can access

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_stripe_customers_updated_at
BEFORE UPDATE ON public.stripe_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Remove stripe_customer_id from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_customer_id;

-- Create index for fast lookups
CREATE INDEX idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);