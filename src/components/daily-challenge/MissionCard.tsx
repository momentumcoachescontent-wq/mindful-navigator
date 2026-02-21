import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, Wind, MessageSquare, Heart, Users, Shield,
  MessageCircle, AlertTriangle, Headphones, Check, Crown, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Mission } from '@/lib/daily-challenge-config';

const iconMap: Record<string, React.ElementType> = {
  Search,
  Wind,
  MessageSquare,
  Heart,
  Users,
  Shield,
  MessageCircle,
  AlertTriangle,
  Headphones,
};

interface MissionCardProps {
  mission: Mission;
  isCompleted: boolean;
  isPremiumUser: boolean;
  xpMultiplier: number;
  onStart: () => void;
}

export function MissionCard({
  mission,
  isCompleted,
  isPremiumUser,
  xpMultiplier,
  onStart
}: MissionCardProps) {
  const Icon = iconMap[mission.icon] || Search;
  const adjustedXP = Math.floor(mission.xp * xpMultiplier);
  const isLocked = mission.isPremium && !isPremiumUser;

  return (
    <Card
      className={cn(
        "brutal-card relative overflow-hidden transition-all duration-300",
        isCompleted && "bg-success/10 border-success/60",
        isLocked && "opacity-60"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-12 h-12 rounded-none border-2 border-current shadow-[2px_2px_0px_0px_currentColor] flex items-center justify-center shrink-0",
            isCompleted
              ? "bg-success/20 text-success"
              : mission.isPremium
                ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500"
                : "bg-primary/10 text-primary"
          )}>
            {isCompleted ? (
              <Check className="w-6 h-6" />
            ) : (
              <Icon className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={cn(
                "font-medium text-sm",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {mission.title}
              </h4>
              {mission.isPremium && (
                <Crown className="w-4 h-4 text-amber-500" />
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-2">
              {mission.description}
            </p>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {mission.duration}
              </Badge>
              <Badge
                className={cn(
                  "text-xs",
                  isCompleted
                    ? "bg-success/20 text-success border-success/30"
                    : "bg-primary/10 text-primary border-primary/30"
                )}
              >
                +{adjustedXP} XP
              </Badge>
              {xpMultiplier > 1 && !isCompleted && (
                <span className="text-[10px] text-amber-500">
                  ×{xpMultiplier.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant={isCompleted ? "outline" : isLocked ? "secondary" : "default"}
            onClick={onStart}
            disabled={isCompleted || isLocked}
            className="brutal-btn shrink-0"
          >
            {isCompleted ? "Hecho" : isLocked ? "Premium" : "Iniciar"}
          </Button>
        </div>
      </CardContent>

      {isLocked && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <Crown className="w-3 h-3 mr-1" />
            Desbloquear Premium
          </Badge>
        </div>
      )}
    </Card>
  );
}
