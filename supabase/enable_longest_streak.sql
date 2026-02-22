-- Add longest_streak column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- Sync longest_streak with current streak_count for existing users
UPDATE public.profiles 
SET longest_streak = streak_count 
WHERE longest_streak < streak_count;
