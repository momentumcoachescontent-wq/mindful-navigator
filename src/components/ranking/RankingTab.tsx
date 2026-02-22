import { useState } from "react";
import { useRanking, RankingPeriod, RankingScope, RankingMetric } from "@/hooks/useRanking";
import { RankingFilters } from "./RankingFilters";
import { RankingPodium } from "./RankingPodium";
import { RankingList } from "./RankingList";
import { UserPositionCard } from "./UserPositionCard";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RankingTrendsChart } from "./RankingTrendsChart";

export function RankingTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [period, setPeriod] = useState<RankingPeriod>("weekly");
  const [scope, setScope] = useState<RankingScope>("global");
  const [metric, setMetric] = useState<RankingMetric>("xp");
  const [levelFilter, setLevelFilter] = useState("all");

  const { data: ranking, isLoading } = useRanking(period, scope, metric, levelFilter);

  // Get user's profile for privacy setting and total XP
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("is_ranking_public")
        .eq("user_id", user.id)
        .single();
      return data as any;
    },
    enabled: !!user,
  });

  const { data: userProgress } = useQuery({
    queryKey: ["userProgress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_progress")
        .select("total_xp")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const currentUserRanking = ranking?.find((r) => r.userId === user?.id) || null;

  const handleTogglePrivacy = () => {
    queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    queryClient.invalidateQueries({ queryKey: ["ranking"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const topThree = ranking?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Header quote */}
      <div className="text-center space-y-1">
        <p className="text-sm text-primary font-medium italic">
          "Compite contigo. Celebra con otros."
        </p>
        <p className="text-xs text-muted-foreground">
          Ranking de esta semana: constancia {">"} intensidad
        </p>
      </div>

      {/* Filters */}
      <RankingFilters
        period={period}
        setPeriod={setPeriod}
        scope={scope}
        setScope={setScope}
        metric={metric}
        setMetric={setMetric}
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
      />

      {/* Trends Chart */}
      <RankingTrendsChart />

      {/* User's position card (sticky) */}
      <UserPositionCard
        userRanking={currentUserRanking}
        totalXp={userProgress?.total_xp || 0}
        isPublic={userProfile?.is_ranking_public || false}
        onTogglePrivacy={handleTogglePrivacy}
      />

      {/* Podium - Top 3 */}
      <RankingPodium topThree={topThree} />

      {/* Full list */}
      <RankingList users={ranking || []} metric={metric} />

      {/* Participation message */}
      <div className="bg-turquoise-soft rounded-xl p-4 text-center">
        <p className="text-sm text-secondary">
          🎯 Tu nivel sube con práctica, no con perfección
        </p>
      </div>
    </div>
  );
}
