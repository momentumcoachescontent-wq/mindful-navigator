import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, Zap, Coins, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type LEVELS } from '@/lib/daily-challenge-config';

interface ProgressHeaderProps {
  level: typeof LEVELS[0];
  totalXP: number;
  todaysXP: number;
  streak: number;
  powerTokens: number;
  progressToNextLevel: number;
}

export function ProgressHeader({
  level,
  totalXP,
  todaysXP,
  streak,
  powerTokens,
  progressToNextLevel,
}: ProgressHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Level and XP */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Nivel actual
          </p>
          <h3 className="text-lg font-display font-bold text-foreground">
            {level.label}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total XP</p>
          <p className="text-lg font-bold text-primary">{totalXP.toLocaleString()}</p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progressToNextLevel} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {progressToNextLevel}% hacia el siguiente nivel
        </p>
      </div>
      
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Today's XP */}
        <div className="bg-primary/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-primary">+{todaysXP}</p>
          <p className="text-[10px] text-muted-foreground uppercase">XP Hoy</p>
        </div>
        
        {/* Streak */}
        <div className={cn(
          "rounded-xl p-3 text-center",
          streak >= 7 ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20" : "bg-coral/10"
        )}>
          <div className="flex items-center justify-center gap-1 text-coral mb-1">
            <Flame className={cn("w-4 h-4", streak >= 7 && "text-amber-500")} />
          </div>
          <p className={cn("text-lg font-bold", streak >= 7 ? "text-amber-500" : "text-coral")}>
            {streak}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase">Racha</p>
        </div>
        
        {/* Tokens */}
        <div className="bg-secondary/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-secondary mb-1">
            <Coins className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-secondary">{powerTokens}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Tokens</p>
        </div>
      </div>
      
      {/* Streak multiplier badge */}
      {streak >= 3 && (
        <div className="text-center">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <Zap className="w-3 h-3 mr-1" />
            Bonus racha: +{streak >= 21 ? 30 : streak >= 7 ? 20 : 10}% XP
          </Badge>
        </div>
      )}
    </div>
  );
}
