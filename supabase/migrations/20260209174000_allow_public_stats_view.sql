-- 1. Unlock User Progress (Safe summary data)
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
CREATE POLICY "User progress is viewable by everyone authenticated"
ON public.user_progress FOR SELECT
TO authenticated
USING (true);

-- 2. Unlock Daily Missions (System generated achievements)
DROP POLICY IF EXISTS "Users can view their own missions" ON public.daily_missions;
CREATE POLICY "Daily missions are viewable by everyone authenticated"
ON public.daily_missions FOR SELECT
TO authenticated
USING (true);

-- 3. Unlock User Achievements (Badges)
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "User achievements are viewable by everyone authenticated"
ON public.user_achievements FOR SELECT
TO authenticated
USING (true);

-- 4. Update Daily Victories Policy (Respect privacy flag)
DROP POLICY IF EXISTS "Users can view their own victories" ON public.daily_victories;
CREATE POLICY "Users can view their own or public victories"
ON public.daily_victories FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_public = true);
