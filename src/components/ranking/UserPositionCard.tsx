import { ArrowUp, ArrowDown, Minus, Flame, Eye, EyeOff, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { RankedUser, getLevelName, getNextLevel, getXpForNextLevel } from "@/hooks/useRanking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

interface UserPositionCardProps {
  userRanking: RankedUser | null;
  totalXp: number;
  isPublic: boolean;
  onTogglePrivacy: () => void;
}

const AVATAR_GRADIENTS = [
  "from-coral to-coral-light",
  "from-primary to-turquoise-light",
  "from-secondary to-primary",
  "from-turquoise to-turquoise-light",
  "from-deep-blue-light to-secondary",
];

export function UserPositionCard({
  userRanking,
  totalXp,
  isPublic,
  onTogglePrivacy
}: UserPositionCardProps) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const nextLevel = userRanking ? getNextLevel(userRanking.level) : null;
  const xpProgress = userRanking ? getXpForNextLevel(userRanking.level, totalXp) : null;

  const handleTogglePrivacy = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_ranking_public: !isPublic } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      onTogglePrivacy();
      toast.success(!isPublic ? "Ahora apareces en el ranking" : "Modo privado activado");
    } catch (error) {
      toast.error("Error al actualizar preferencia");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!userRanking) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-soft border border-border/50">
        <div className="flex items-center gap-4">
          {/* Placeholder Avatar */}
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xl">Op</span>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Tu posición</h3>
            <p className="text-xs text-muted-foreground">Aún no has clasificado</p>
          </div>

          <div className="text-right">
            <Badge variant="outline">Explorador/a</Badge>
            <p className="text-xs text-muted-foreground mt-1">0 XP</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 text-center">
          <p className="text-sm text-primary font-medium">
            ¡Completa tu primera misión para entrar al ranking!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-turquoise/10 rounded-2xl p-4 space-y-4 border border-primary/20">
      {/* Header with privacy toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Tu posición</h3>
        <div className="flex items-center gap-2">
          {!isPublic ? (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Eye className="w-4 h-4 text-primary" />
          )}
          <Switch
            checked={isPublic}
            onCheckedChange={handleTogglePrivacy}
            disabled={isUpdating}
          />
        </div>
      </div>

      {!isPublic && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
          Modo privado: solo tú ves tu progreso. Activa la casilla para participar en la comunidad.
        </p>
      )}

      {/* User info row */}
      <div className="flex items-center gap-3">
        {/* Position */}
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold text-primary">
            #{userRanking.position}
          </span>
          <PositionChange change={userRanking.positionChange} />
        </div>

        {/* Avatar */}
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground bg-gradient-to-br",
            AVATAR_GRADIENTS[userRanking.avatarId % AVATAR_GRADIENTS.length]
          )}
        >
          {userRanking.alias[0]}
        </div>

        {/* Stats */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{userRanking.alias}</span>
            <Badge variant="secondary" className="text-[10px]">
              {getLevelName(userRanking.level)}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm">
            <span className="text-primary font-medium">{userRanking.xp} XP</span>
            <span className="flex items-center gap-0.5 text-coral">
              <Flame className="w-3 h-3" />
              {userRanking.streak}
            </span>
          </div>
        </div>
      </div>

      {/* Level progress */}
      {nextLevel && xpProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Te faltan <span className="font-semibold text-foreground">{xpProgress.needed} XP</span> para{" "}
              <span className="text-primary">{getLevelName(nextLevel)}</span>
            </span>
          </div>
          <Progress
            value={(xpProgress.current / (xpProgress.current + xpProgress.needed)) * 100}
            className="h-2"
          />
        </div>
      )}

      {/* CTA */}
      <Button variant="ghost" size="sm" className="w-full justify-between text-primary">
        <span>Ver retos que dan más XP</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
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
