-- Add privacy toggle for ranking visibility
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_ranking_private BOOLEAN DEFAULT false;

-- Create index for efficient ranking queries
CREATE INDEX IF NOT EXISTS idx_profiles_ranking_private ON public.profiles(is_ranking_private) WHERE is_ranking_private = false;