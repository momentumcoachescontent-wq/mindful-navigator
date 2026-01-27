-- User progress table for XP, levels, tokens
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  power_tokens INTEGER NOT NULL DEFAULT 0,
  current_level TEXT NOT NULL DEFAULT 'explorer',
  streak_rescues_used INTEGER NOT NULL DEFAULT 0,
  streak_rescues_available INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily missions completed
CREATE TABLE public.daily_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_type TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, mission_id, mission_date)
);

-- User achievements/badges
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Daily victories for the Victory Wall
CREATE TABLE public.daily_victories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  victory_text TEXT NOT NULL,
  victory_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_bonus INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SOS Cards saved by users
CREATE TABLE public.sos_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  reminder_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_victories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for daily_missions
CREATE POLICY "Users can view their own missions" ON public.daily_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own missions" ON public.daily_missions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_victories
CREATE POLICY "Users can view their own victories" ON public.daily_victories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own victories" ON public.daily_victories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own victories" ON public.daily_victories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own victories" ON public.daily_victories FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sos_cards
CREATE POLICY "Users can view their own SOS cards" ON public.sos_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own SOS cards" ON public.sos_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own SOS cards" ON public.sos_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own SOS cards" ON public.sos_cards FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();