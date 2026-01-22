import { Flame, Trophy, Calendar } from "lucide-react";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  thisWeek: boolean[];
}

export function StreakCard({ currentStreak, longestStreak, thisWeek }: StreakCardProps) {
  const days = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
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

      <div className="flex justify-between gap-1">
        {thisWeek.map((completed, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                completed
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {completed ? "✓" : days[index]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
