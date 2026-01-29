import { Crown, Flame, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { RankedUser, getLevelName } from "@/hooks/useRanking";
import { Badge } from "@/components/ui/badge";

interface RankingPodiumProps {
  topThree: RankedUser[];
}

const AVATAR_GRADIENTS = [
  "from-coral to-coral-light",
  "from-primary to-turquoise-light",
  "from-secondary to-primary",
  "from-turquoise to-turquoise-light",
  "from-deep-blue-light to-secondary",
];

export function RankingPodium({ topThree }: RankingPodiumProps) {
  if (topThree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay datos de ranking aún</p>
      </div>
    );
  }

  const [first, second, third] = topThree;

  return (
    <div className="flex items-end justify-center gap-2 py-6">
      {/* Second Place */}
      {second && (
        <PodiumCard user={second} position={2} size="medium" />
      )}

      {/* First Place */}
      {first && (
        <PodiumCard user={first} position={1} size="large" />
      )}

      {/* Third Place */}
      {third && (
        <PodiumCard user={third} position={3} size="small" />
      )}
    </div>
  );
}

interface PodiumCardProps {
  user: RankedUser;
  position: 1 | 2 | 3;
  size: "large" | "medium" | "small";
}

function PodiumCard({ user, position, size }: PodiumCardProps) {
  const sizeClasses = {
    large: "w-28 pb-4",
    medium: "w-24 pb-2",
    small: "w-22 pb-1",
  };

  const avatarSizes = {
    large: "w-16 h-16",
    medium: "w-14 h-14",
    small: "w-12 h-12",
  };

  const positionColors = {
    1: "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-900",
    2: "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-800",
    3: "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100",
  };

  const crownColors = {
    1: "text-amber-400",
    2: "text-slate-400",
    3: "text-amber-700",
  };

  return (
    <div className={cn("flex flex-col items-center", sizeClasses[size])}>
      {/* Crown for first place */}
      {position === 1 && (
        <Crown className="w-6 h-6 text-amber-400 mb-1 animate-pulse" />
      )}

      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-bold text-primary-foreground bg-gradient-to-br",
            avatarSizes[size],
            AVATAR_GRADIENTS[user.avatarId % AVATAR_GRADIENTS.length]
          )}
        >
          <span className={size === "large" ? "text-xl" : "text-lg"}>
            {user.alias[0]}
          </span>
        </div>

        {/* Premium badge */}
        {user.isPremium && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Position badge */}
        <div
          className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md",
            positionColors[position]
          )}
        >
          {position}
        </div>
      </div>

      {/* User info */}
      <div className="mt-4 text-center space-y-1">
        <p className="text-sm font-semibold text-foreground truncate max-w-full">
          {user.alias}
        </p>
        
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {getLevelName(user.level)}
        </Badge>

        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="text-primary font-medium">{user.xp} XP</span>
          <span className="flex items-center gap-0.5 text-coral">
            <Flame className="w-3 h-3" />
            {user.streak}
          </span>
        </div>
      </div>
    </div>
  );
}
