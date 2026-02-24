import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, startOfMonth, subWeeks, subMonths } from "date-fns";

export type RankingPeriod = "weekly" | "monthly" | "historical";
export type RankingScope = "global" | "circle" | "country";
export type RankingMetric = "xp" | "streak" | "victories";

export interface RankedUser {
  userId: string;
  alias: string;
  avatarId: number;
  level: string;
  xp: number;
  streak: number;
  victoriesCount: number;
  isPremium: boolean;
  position: number;
  positionChange: number;
}

const LEVEL_ORDER = [
  "explorer",
  "observer",
  "regulator",
  "guardian",
  "strategist",
  "mentor",
];

const LEVEL_NAMES: Record<string, string> = {
  explorer: "Explorador/a",
  observer: "Observador/a",
  regulator: "Regulador/a",
  guardian: "Guardián/a de Límites",
  strategist: "Estratega",
  mentor: "Mentor/a",
};

const LEVEL_XP_THRESHOLDS: Record<string, number> = {
  explorer: 0,
  observer: 500,
  regulator: 1500,
  guardian: 3000,
  strategist: 5000,
  mentor: 8000,
};

export function getLevelName(level: string): string {
  return LEVEL_NAMES[level] || level;
}

export function getNextLevel(currentLevel: string): string | null {
  const idx = LEVEL_ORDER.indexOf(currentLevel);
  if (idx === -1 || idx === LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1];
}

export function getXpForNextLevel(currentLevel: string, totalXp: number): { needed: number; current: number } | null {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return null;
  const threshold = LEVEL_XP_THRESHOLDS[nextLevel];
  return {
    needed: threshold - totalXp,
    current: totalXp - LEVEL_XP_THRESHOLDS[currentLevel],
  };
}

function generateAlias(userId: string): string {
  const adjectives = ["Valiente", "Fuerte", "Sereno", "Brillante", "Sabio", "Noble"];
  const nouns = ["Guerrero", "Guardián", "Estratega", "Mentor", "Explorador", "Líder"];
  const hash = userId.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return `${adjectives[hash % adjectives.length]}${nouns[(hash * 7) % nouns.length]}`;
}

export function useRanking(
  period: RankingPeriod,
  scope: RankingScope,
  metric: RankingMetric,
  levelFilter?: string
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ranking", period, scope, metric, levelFilter, user?.id],
    queryFn: async () => {
      // Get date ranges for period
      const now = new Date();
      let startDate: Date | null = null;

      if (period === "weekly") {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
      } else if (period === "monthly") {
        startDate = startOfMonth(now);
      }

      // Fetch user progress with profiles
      const { data: progressData, error: progressError } = await supabase
        .from("user_progress")
        .select(`
          user_id,
          total_xp,
          current_level,
          power_tokens
        `);

      if (progressError) throw progressError;

      // Fetch profiles
      let { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`*`);

      // Si hay error en profiles (ej. country no existe), logueamos pero no crasheamos. 
      // Sin embargo, si profiles falla, el ranking no puede construirse bien.
      if (profilesError) {
        console.error("Error fetching profiles for ranking (posible error de schema):", profilesError);
        // Fallback a un select sin country
        const { data: fallbackProfiles, error: fallbackError } = await supabase
          .from("profiles")
          .select(`user_id, display_name, streak_count, is_premium, is_ranking_private`);

        if (fallbackError) throw fallbackError;
        profilesData = fallbackProfiles as typeof profilesData;
      }

      // If scope is 'circle', fetch user connections
      let circleFriendIds: string[] = [];
      if (scope === "circle" && user) {
        const { data: connections } = await supabase
          .from("user_connections")
          .select("friend_id")
          .eq("user_id", user.id)
          .eq("status", "accepted");

        if (connections) {
          circleFriendIds = connections.map(c => c.friend_id);
        }
      }

      // Fetch missions for XP in period
      let missionsQuery = supabase.from("daily_missions").select("user_id, xp_earned, mission_date");

      if (startDate) {
        missionsQuery = missionsQuery.gte("mission_date", startDate.toISOString().split("T")[0]);
      }

      const { data: missionsData, error: missionsError } = await missionsQuery;
      if (missionsError) throw missionsError;

      // Fetch victories for period
      let victoriesQuery = supabase.from("daily_victories").select("user_id, victory_date");

      if (startDate) {
        victoriesQuery = victoriesQuery.gte("victory_date", startDate.toISOString().split("T")[0]);
      }

      const { data: victoriesData, error: victoriesError } = await victoriesQuery;
      if (victoriesError) throw victoriesError;

      // Aggregate XP per user for the period
      const periodXpByUser: Record<string, number> = {};
      missionsData?.forEach((m) => {
        periodXpByUser[m.user_id] = (periodXpByUser[m.user_id] || 0) + (m.xp_earned || 0);
      });

      // Aggregate victories per user for the period
      const victoriesByUser: Record<string, number> = {};
      victoriesData?.forEach((v) => {
        victoriesByUser[v.user_id] = (victoriesByUser[v.user_id] || 0) + 1;
      });

      // Create profiles map
      const profilesMap: Record<string, typeof profilesData[0]> = {};
      profilesData?.forEach((p) => {
        profilesMap[p.user_id] = p;
      });

      // Build ranked users
      const rankedUsers: RankedUser[] = progressData
        .filter((p) => {
          const profile = profilesMap[p.user_id];
          const currentUserProfile = profilesMap[user?.id || ""];

          // REGLA 1: Si el usuario visualizado es privado (is_ranking_private = true), ocultarlo.
          // REGLA 2: EXCEPCIÓN: Si el usuario visualizado es el propio usuario activo, mostrarlo SIEMPRE (para que él vea su propio ranking).
          if (profile?.is_ranking_private && p.user_id !== user?.id) {
            return false;
          }

          // Filter by level if specified
          if (levelFilter && levelFilter !== "all" && p.current_level !== levelFilter) {
            return false;
          }

          // Filter by scope
          if (scope === "country") {
            // Only show users from the same country as the current user
            if (!currentUserProfile?.country || profile?.country !== currentUserProfile.country) {
              return false;
            }
          } else if (scope === "circle") {
            // Only show user and their accepted friends
            if (p.user_id !== user?.id && !circleFriendIds.includes(p.user_id)) {
              return false;
            }
          }

          return true;
        })
        .map((p) => {
          const profile = profilesMap[p.user_id];
          const periodXp = period === "historical" ? p.total_xp : (periodXpByUser[p.user_id] || 0);

          return {
            userId: p.user_id,
            alias: profile?.display_name || generateAlias(p.user_id),
            avatarId: Math.abs(p.user_id.charCodeAt(0) % 10),
            level: p.current_level,
            xp: periodXp,
            streak: profile?.streak_count || 0,
            victoriesCount: victoriesByUser[p.user_id] || 0,
            isPremium: profile?.is_premium || false,
            position: 0,
            positionChange: 0,
          };
        }) || [];

      // Sort by selected metric
      rankedUsers.sort((a, b) => {
        if (metric === "xp") return b.xp - a.xp;
        if (metric === "streak") return b.streak - a.streak;
        return b.victoriesCount - a.victoriesCount;
      });

      // Assign positions
      rankedUsers.forEach((u, idx) => {
        u.position = idx + 1;
        // Random position change for demo (would be calculated from previous period in production)
        u.positionChange = Math.floor(Math.random() * 5) - 2;
      });

      return rankedUsers;
    },
    enabled: !!user,
  });
}

export function useUserRankingPosition(
  period: RankingPeriod,
  metric: RankingMetric
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userRankingPosition", period, metric, user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user's progress
      const { data: progress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Get user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!progress) return null;

      // Count users with higher score
      const now = new Date();
      let startDate: Date | null = null;

      if (period === "weekly") {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
      } else if (period === "monthly") {
        startDate = startOfMonth(now);
      }

      // For position calculation, we'd need the full ranking
      // This is simplified - in production use a database function

      return {
        userId: user.id,
        level: progress.current_level,
        totalXp: progress.total_xp,
        streak: profile?.streak_count || 0,
        isPremium: profile?.is_premium || false,
        isPublic: !(profile?.is_ranking_private ?? false),
      };
    },
    enabled: !!user,
  });
}
