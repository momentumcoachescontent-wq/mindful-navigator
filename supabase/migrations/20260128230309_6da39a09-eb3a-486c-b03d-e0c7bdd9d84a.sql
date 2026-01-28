-- Create table for daily reflection messages
CREATE TABLE IF NOT EXISTS public.daily_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  author TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_date DATE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS - public read, admin-only write
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

-- Everyone can read active reflections
CREATE POLICY "Daily reflections are viewable by everyone"
ON public.daily_reflections
FOR SELECT
USING (is_active = true);

-- Create index for faster lookups
CREATE INDEX idx_daily_reflections_date ON public.daily_reflections(display_date);
CREATE INDEX idx_daily_reflections_active ON public.daily_reflections(is_active) WHERE is_active = true;