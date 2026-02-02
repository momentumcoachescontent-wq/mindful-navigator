-- Add RLS policies for stripe_customers table
-- This table has RLS enabled but no policies, which blocks all access

-- Allow users to view their own Stripe customer record
CREATE POLICY "Users can view their own stripe customer"
  ON public.stripe_customers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to insert (for edge functions creating customer records)
-- Note: Authenticated users should not directly insert - only edge functions with service_role
CREATE POLICY "Service can manage stripe customers"
  ON public.stripe_customers
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');