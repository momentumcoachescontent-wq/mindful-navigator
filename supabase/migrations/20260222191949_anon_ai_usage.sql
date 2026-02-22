-- Create table for tracking anonymous AI usage by IP
CREATE TABLE IF NOT EXISTS public.anon_ai_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast IP lookups
CREATE INDEX IF NOT EXISTS idx_anon_ai_usage_ip ON public.anon_ai_usage (ip_address);

-- Enable RLS but allow everything since we only use Service Role on edge functions
ALTER TABLE public.anon_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all actions for Service Role" ON public.anon_ai_usage
    AS PERMISSIVE FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
