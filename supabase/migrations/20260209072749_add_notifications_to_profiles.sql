-- Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notifications_push BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT false;
