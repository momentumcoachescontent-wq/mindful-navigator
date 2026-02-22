import { useNavigate } from "react-router-dom";
import { Trophy, ArrowUp, ArrowDown, Minus, ChevronRight } from "lucide-react";
import { useRanking } from "@/hooks/useRanking";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const AVATAR_GRADIENTS = [
  "from-coral to-coral-light",
  "from-primary to-turquoise-light",
  "from-secondary to-primary",
  "from-turquoise to-turquoise-light",
];

export function RankingPreviewCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: ranking, isLoading } = useRanking("weekly", "global", "xp");

  const currentUserRanking = ranking?.find((r) => r.userId === user?.id);

  if (isLoading || !currentUserRanking) {
    return null;
  }

  return (
    <button
      onClick={() => navigate("/profile")}
      className="w-full bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-coral/10 rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-500/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">
            Tu posición esta semana
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex items-center gap-3">
        {/* Position */}
        <div className="flex items-center gap-1">
          <span className="text-3xl font-bold text-amber-600">
            #{currentUserRanking.position}
          </span>
          <PositionChange change={currentUserRanking.positionChange} />
        </div>

        {/* Avatar */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br",
            AVATAR_GRADIENTS[currentUserRanking.avatarId % AVATAR_GRADIENTS.length]
          )}
        >
          {currentUserRanking.alias[0]}
        </div>

        {/* Stats */}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {currentUserRanking.xp} XP
          </p>
          <p className="text-xs text-muted-foreground">
            Ranking semanal global
          </p>
        </div>
      </div>
    </button>
  );
}

function PositionChange({ change }: { change: number }) {
  if (change > 0) {
    return (
      <div className="flex items-center text-green-500 text-xs">
        <ArrowUp className="w-3 h-3" />
        <span>{change}</span>
      </div>
    );
  }
  if (change < 0) {
    return (
      <div className="flex items-center text-red-500 text-xs">
        <ArrowDown className="w-3 h-3" />
        <span>{Math.abs(change)}</span>
      </div>
    );
  }
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}
