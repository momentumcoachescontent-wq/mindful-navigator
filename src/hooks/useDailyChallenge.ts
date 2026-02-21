import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { xpEventBus } from '@/lib/xpEventBus';
import { streakEventBus } from '@/lib/streakEventBus';
import {
  getTodaysMissions,
  getLevelFromXP,
  calculateXP,
  PERFECT_DAY_BONUS,
  ACHIEVEMENTS,
  type Mission
} from '@/lib/daily-challenge-config';

interface UserProgress {
  totalXP: number;
  powerTokens: number;
  currentLevel: string;
  streakRescuesAvailable: number;
}

interface CompletedMission {
  missionId: string;
  xpEarned: number;
}


// Helper function to get local date string (YYYY-MM-DD)
// Uses local timezone instead of UTC to properly handle daily resets
const getLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function useDailyChallenge() {
  const { user, isPremium } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress>({
    totalXP: 0,
    powerTokens: 0,
    currentLevel: 'explorer',
    streakRescuesAvailable: 1,
  });
  const [completedToday, setCompletedToday] = useState<CompletedMission[]>([]);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);

  const todaysMissions = getTodaysMissions();
  const level = getLevelFromXP(progress.totalXP);

  // Load user progress and today's completed missions
  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (progressData) {
        setProgress({
          totalXP: progressData.total_xp,
          powerTokens: progressData.power_tokens,
          currentLevel: progressData.current_level,
          streakRescuesAvailable: progressData.streak_rescues_available,
        });
      } else {
        // Create initial progress record
        const { error: insertError } = await supabase.from('user_progress').insert([{
          user_id: user.id,
          total_xp: 0,
          power_tokens: 0,
          current_level: 'explorer',
          streak_rescues_available: isPremium ? 3 : 1,
        }] as never);

        if (insertError) {
          console.error('Error creating initial progress:', insertError);
        } else {
          // Retry loading data after successful insert
          await loadData();
        }
      }

      // Get today's completed missions
      const today = getLocalDateString();
      const { data: missionsData } = await supabase
        .from('daily_missions')
        .select('mission_id, xp_earned')
        .eq('user_id', user.id)
        .eq('mission_date', today);

      if (missionsData) {
        setCompletedToday(missionsData.map(m => ({
          missionId: m.mission_id,
          xpEarned: m.xp_earned,
        })));
      }

      // Get streak from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('streak_count')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setStreak(profileData.streak_count || 0);
      }

      // Get achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      if (achievementsData) {
        setAchievements(achievementsData.map(a => a.achievement_id));
      }

    } catch (error) {
      console.error('Error loading daily challenge data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isPremium]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data whenever the user returns to this tab/page (from a tool detail, etc.)
  // This ensures "+XP HOY" reflects any contracts completed in other routes.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadData]);

  // Subscribe to external XP events (e.g. from ToolChallenge)
  // so the Dashboard updates in real-time without a page reload.
  useEffect(() => {
    const unsubscribe = xpEventBus.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  // Subscribe to streak updates from Index.tsx check-in
  // so the RACHA card reflects the new count immediately without a full reload.
  useEffect(() => {
    const unsubscribe = streakEventBus.subscribe((newStreak: number) => {
      setStreak(newStreak);
    });
    return unsubscribe;
  }, []);

  // Complete a mission
  const completeMission = useCallback(async (mission: Mission, metadata?: Record<string, unknown>) => {
    if (!user) return { success: false, error: 'Not logged in' };

    const today = getLocalDateString();
    const xpEarned = calculateXP(mission.xp, streak);

    try {
      // Record mission completion
      const { error: missionError } = await supabase
        .from('daily_missions')
        .insert([{
          user_id: user.id,
          mission_type: mission.type,
          mission_id: mission.id,
          xp_earned: xpEarned,
          mission_date: today,
          metadata: metadata || {},
        }] as never);

      if (missionError) {
        if (missionError.code === '23505') {
          return { success: false, error: 'Mission already completed today' };
        }
        throw missionError;
      }

      // Update total XP
      const newTotalXP = progress.totalXP + xpEarned;
      const newLevel = getLevelFromXP(newTotalXP);

      await supabase
        .from('user_progress')
        .update({
          total_xp: newTotalXP,
          current_level: newLevel.name,
        })
        .eq('user_id', user.id);

      // Check for perfect day bonus
      const newCompleted = [...completedToday, { missionId: mission.id, xpEarned }];
      const allFreeMissionsCompleted = todaysMissions.freeMissions.every(
        m => newCompleted.some(c => c.missionId === m.id)
      );

      if (allFreeMissionsCompleted && newCompleted.length === todaysMissions.freeMissions.length) {
        // Award perfect day bonus
        await supabase
          .from('user_progress')
          .update({ total_xp: newTotalXP + PERFECT_DAY_BONUS })
          .eq('user_id', user.id);
      }

      // Update local state
      setCompletedToday(newCompleted);
      setProgress(prev => ({
        ...prev,
        totalXP: newTotalXP + (allFreeMissionsCompleted ? PERFECT_DAY_BONUS : 0),
        currentLevel: newLevel.name,
      }));

      // Check for new achievements
      await checkAchievements(mission.type);

      return { success: true, xpEarned };
    } catch (error) {
      console.error('Error completing mission:', error);
      return { success: false, error: 'Failed to complete mission' };
    }
  }, [user, streak, progress.totalXP, completedToday, todaysMissions.freeMissions]);

  // Check and award achievements
  const checkAchievements = useCallback(async (missionType: string) => {
    if (!user) return;

    // Count completed missions by type
    const { data: counts } = await supabase
      .from('daily_missions')
      .select('mission_type')
      .eq('user_id', user.id);

    if (!counts) return;

    const typeCounts: Record<string, number> = {};
    counts.forEach(m => {
      typeCounts[m.mission_type] = (typeCounts[m.mission_type] || 0) + 1;
    });

    // Check each achievement
    for (const achievement of ACHIEVEMENTS) {
      if (achievements.includes(achievement.id)) continue;

      const { type, count } = achievement.requirement;

      if (type === 'streak') {
        if (streak >= count) {
          await awardAchievement(achievement.id);
        }
      } else if (typeCounts[type] && typeCounts[type] >= count) {
        await awardAchievement(achievement.id);
      }
    }
  }, [user, achievements, streak]);

  // Award an achievement
  const awardAchievement = useCallback(async (achievementId: string) => {
    if (!user || achievements.includes(achievementId)) return;

    try {
      await supabase
        .from('user_achievements')
        .insert([{
          user_id: user.id,
          achievement_id: achievementId,
        }] as never);

      // Award token
      await supabase
        .from('user_progress')
        .update({ power_tokens: progress.powerTokens + 1 })
        .eq('user_id', user.id);

      setAchievements(prev => [...prev, achievementId]);
      setProgress(prev => ({ ...prev, powerTokens: prev.powerTokens + 1 }));
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }, [user, achievements, progress.powerTokens]);

  // Save daily victory
  const saveVictory = useCallback(async (victoryText: string) => {
    if (!user) return { success: false, error: 'Inicia sesión para guardar' };

    try {
      const today = getLocalDateString();

      // 1. Save to daily_victories table
      const { error: victoryError } = await supabase.from('daily_victories').insert([{
        user_id: user.id,
        victory_text: victoryText,
        content: victoryText, // Added to satisfy NOT NULL constraint
        victory_date: today,
        xp_bonus: 10,
      }] as never);

      if (victoryError) {
        console.error('Error in daily_victories:', victoryError);
        toast({ title: "Error", description: "No se pudo guardar en victorias: " + victoryError.message, variant: "destructive" });
        return { success: false, error: victoryError.message };
      }

      // 2. Save to journal_entries table
      const journalContent = {
        title: "Victoria: " + victoryText.substring(0, 30) + (victoryText.length > 30 ? "..." : ""),
        text: victoryText,
        tags: ["Victoria"]
      };

      const { error: journalError } = await supabase.from('journal_entries').insert([{
        user_id: user.id,
        content: JSON.stringify(journalContent),
        entry_type: 'victory',
        tags: ['Victoria']
      }] as never);

      if (journalError) {
        console.error('Error saving victory to journal:', journalError);
        // We don't throw here to avoid blocking the XP flow if journal fails
      }

      // 3. Add XP bonus
      const newXP = progress.totalXP + 10;
      const { error: progressError } = await supabase
        .from('user_progress')
        .update({ total_xp: newXP })
        .eq('user_id', user.id);

      if (progressError) {
        console.error('Error updating progress XP:', progressError);
        toast({ title: "Aviso", description: "Victoria guardada, pero hubo un problema al actualizar tu XP.", variant: "default" });
      } else {
        setProgress(prev => ({ ...prev, totalXP: newXP }));
      }

      toast({ title: "¡Victoria registrada!", description: "Se ha guardado en tu diario y has ganado 10 XP." });
      return { success: true };
    } catch (error) {
      console.error('Unexpected error saving victory:', error);
      toast({ title: "Error inesperado", description: "Hubo un error al procesar tu victoria.", variant: "destructive" });
      return { success: false, error: (error as Error).message };
    }
  }, [user, progress.totalXP]);

  // Use streak rescue
  const useStreakRescue = useCallback(async () => {
    if (!user || progress.streakRescuesAvailable <= 0) return false;

    try {
      await supabase
        .from('user_progress')
        .update({
          streak_rescues_available: progress.streakRescuesAvailable - 1,
        })
        .eq('user_id', user.id);

      setProgress(prev => ({
        ...prev,
        streakRescuesAvailable: prev.streakRescuesAvailable - 1,
      }));

      return true;
    } catch (error) {
      console.error('Error using streak rescue:', error);
      return false;
    }
  }, [user, progress.streakRescuesAvailable]);

  // Check if mission is completed
  const isMissionCompleted = useCallback((missionId: string) => {
    return completedToday.some(m => m.missionId === missionId);
  }, [completedToday]);

  // Calculate today's earned XP
  const todaysXP = completedToday.reduce((sum, m) => sum + m.xpEarned, 0);

  // Calculate progress to next level
  const progressToNextLevel = () => {
    const currentLevelData = getLevelFromXP(progress.totalXP);
    const nextLevelIndex = ACHIEVEMENTS.findIndex(l => l.id === currentLevelData.name) + 1;

    if (currentLevelData.maxXP === Infinity) return 100;

    const xpInLevel = progress.totalXP - currentLevelData.minXP;
    const levelRange = currentLevelData.maxXP - currentLevelData.minXP + 1;

    return Math.floor((xpInLevel / levelRange) * 100);
  };

  return {
    loading,
    progress,
    level,
    streak,
    todaysMissions,
    completedToday,
    todaysXP,
    achievements,
    isMissionCompleted,
    completeMission,
    saveVictory,
    useStreakRescue,
    progressToNextLevel: progressToNextLevel(),
    reload: loadData,
  };
}
