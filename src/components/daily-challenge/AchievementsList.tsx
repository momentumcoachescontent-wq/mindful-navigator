import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, Wind, MessageSquare, Heart, Users, Shield, 
  Target, Flame, Trophy, Lock, Crown 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACHIEVEMENTS } from '@/lib/daily-challenge-config';

const iconMap: Record<string, React.ElementType> = {
  Search,
  Wind,
  MessageSquare,
  Heart,
  Users,
  Shield,
  Target,
  Flame,
  Trophy,
};

interface AchievementsListProps {
  unlockedAchievements: string[];
  missionCounts?: Record<string, number>;
  streak?: number;
}

export function AchievementsList({ 
  unlockedAchievements, 
  missionCounts = {}, 
  streak = 0 
}: AchievementsListProps) {
  const getProgress = (achievement: typeof ACHIEVEMENTS[0]) => {
    const { type, count } = achievement.requirement;
    
    if (type === 'streak') {
      return Math.min(streak, count);
    }
    
    return Math.min(missionCounts[type] || 0, count);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Logros
          <Badge variant="outline" className="font-normal">
            {unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            const Icon = iconMap[achievement.icon] || Target;
            const progress = getProgress(achievement);
            const progressPercent = (progress / achievement.requirement.count) * 100;

            return (
              <div
                key={achievement.id}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all",
                  isUnlocked 
                    ? "border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10"
                    : "border-border bg-muted/30"
                )}
              >
                {/* Premium badge */}
                {achievement.isPremium && !isUnlocked && (
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5">
                    <Crown className="w-2.5 h-2.5" />
                  </Badge>
                )}

                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-2",
                  isUnlocked 
                    ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}>
                  {isUnlocked ? (
                    <Icon className="w-5 h-5" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>

                <h4 className={cn(
                  "font-medium text-sm mb-0.5",
                  !isUnlocked && "text-muted-foreground"
                )}>
                  {achievement.label}
                </h4>
                
                <p className="text-[10px] text-muted-foreground mb-2">
                  {achievement.description}
                </p>

                {!isUnlocked && (
                  <div className="space-y-1">
                    <Progress value={progressPercent} className="h-1" />
                    <p className="text-[10px] text-muted-foreground">
                      {progress}/{achievement.requirement.count}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
