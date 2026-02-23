import { ArrowUp, ArrowDown, Minus, Flame, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { RankedUser, getLevelName, RankingMetric } from "@/hooks/useRanking";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface RankingListProps {
  users: RankedUser[];
  metric: RankingMetric;
}

const AVATAR_GRADIENTS = [
  "from-coral to-coral-light",
  "from-primary to-turquoise-light",
  "from-secondary to-primary",
  "from-turquoise to-turquoise-light",
  "from-deep-blue-light to-secondary",
];

export function RankingList({ users, metric }: RankingListProps) {
  const { user } = useAuth();
  const listUsers = users.slice(3); // Skip top 3, they're in podium

  if (listUsers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground px-1">
        Clasificación de la Comunidad
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
        {listUsers.map((rankedUser) => {
          const isCurrentUser = rankedUser.userId === user?.id;

          return (
            <div
              key={rankedUser.userId}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all",
                isCurrentUser
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-card hover:bg-muted/50"
              )}
            >
              {/* Position */}
              <div className="w-8 text-center">
                <span className="text-sm font-bold text-muted-foreground">
                  #{rankedUser.position}
                </span>
              </div>

              {/* Position Change */}
              <div className="w-6">
                <PositionChange change={rankedUser.positionChange} />
              </div>

              {/* Avatar */}
              <div className="relative">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground bg-gradient-to-br",
                    AVATAR_GRADIENTS[rankedUser.avatarId % AVATAR_GRADIENTS.length]
                  )}
                >
                  {rankedUser.alias[0]}
                </div>
                {rankedUser.isPremium && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {isCurrentUser ? "Tú" : rankedUser.alias}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                    {getLevelName(rankedUser.level)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5 text-xs text-coral">
                    <Flame className="w-3 h-3" />
                    {rankedUser.streak} días
                  </span>
                  {metric === "victories" && (
                    <span className="flex items-center gap-0.5 text-xs text-amber-600">
                      <Trophy className="w-3 h-3" />
                      {rankedUser.victoriesCount}
                    </span>
                  )}
                </div>
              </div>

              {/* XP */}
              <div className="text-right">
                <span className="text-sm font-semibold text-primary">
                  {metric === "xp" && `${rankedUser.xp} XP`}
                  {metric === "streak" && `${rankedUser.streak} días`}
                  {metric === "victories" && `${rankedUser.victoriesCount} victorias`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PositionChange({ change }: { change: number }) {
  if (change > 0) {
    return (
      <div className="flex items-center text-green-500">
        <ArrowUp className="w-3 h-3" />
        <span className="text-xs">{change}</span>
      </div>
    );
  }
  if (change < 0) {
    return (
      <div className="flex items-center text-red-500">
        <ArrowDown className="w-3 h-3" />
        <span className="text-xs">{Math.abs(change)}</span>
      </div>
    );
  }
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}
