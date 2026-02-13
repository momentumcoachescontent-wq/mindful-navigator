import { Flame, Trophy, Calendar } from "lucide-react";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  thisWeek: boolean[];
}

export function StreakCard({ currentStreak, longestStreak, thisWeek }: StreakCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-foreground">
              {currentStreak}
            </p>
            <p className="text-xs text-muted-foreground">días seguidos</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">{longestStreak} mejor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
