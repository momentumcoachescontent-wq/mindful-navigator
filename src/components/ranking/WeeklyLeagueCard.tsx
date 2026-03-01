import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Flame, Sparkles } from 'lucide-react';
import { useMyLeague, getTierLabel, getTierColors } from '@/hooks/useLeague';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function WeeklyLeagueCard() {
    const { user } = useAuth();
    const { data: league, isLoading } = useMyLeague();

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!league) return null;

    const tierColors = getTierColors(league.tier);
    const userEntry = league.members.find(m => m.isCurrentUser);
    const promotionZone = Math.ceil(league.members.length * 0.3); // top 30% promote
    const demotionZone = Math.floor(league.members.length * 0.7); // bottom 30% demote

    return (
        <Card className="overflow-hidden">
            {/* Tier header */}
            <div className={cn('bg-gradient-to-r p-4 text-white', tierColors)}>
                <div className="flex items-center justify-between">
                    <div>
                        <Trophy className="w-5 h-5 mb-1 opacity-80" />
                        <h3 className="font-bold text-lg">{getTierLabel(league.tier)}</h3>
                        <p className="text-xs opacity-80">Liga semanal · {league.members.length} participantes</p>
                    </div>
                    {userEntry && (
                        <div className="text-right">
                            <p className="text-2xl font-bold">#{userEntry.position}</p>
                            <p className="text-xs opacity-80">{userEntry.xpThisWeek} XP esta semana</p>
                        </div>
                    )}
                </div>
            </div>

            <CardContent className="p-0">
                <div className="divide-y divide-border/50 max-h-64 overflow-y-auto">
                    {league.members.map((member) => {
                        const isPromotion = member.position <= promotionZone;
                        const isDemotion = member.position > demotionZone;

                        return (
                            <div
                                key={member.userId}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-2.5 transition-colors',
                                    member.isCurrentUser && 'bg-primary/5 border-l-2 border-primary'
                                )}
                            >
                                {/* Position */}
                                <div className="w-7 text-center">
                                    <span className={cn(
                                        'text-sm font-bold',
                                        member.position === 1 ? 'text-amber-500' :
                                            member.position === 2 ? 'text-slate-400' :
                                                member.position === 3 ? 'text-amber-700' :
                                                    'text-muted-foreground'
                                    )}>
                                        {member.position === 1 ? '🥇' :
                                            member.position === 2 ? '🥈' :
                                                member.position === 3 ? '🥉' :
                                                    `#${member.position}`}
                                    </span>
                                </div>

                                {/* Promotion/demotion indicator */}
                                <div className="w-2">
                                    {isPromotion && <div className="w-2 h-2 rounded-full bg-green-500" title="Zona de ascenso" />}
                                    {isDemotion && <div className="w-2 h-2 rounded-full bg-red-400" title="Zona de descenso" />}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <span className={cn(
                                        'text-sm truncate',
                                        member.isCurrentUser ? 'font-semibold text-primary' : 'font-medium'
                                    )}>
                                        {member.isCurrentUser ? 'Tú' : member.alias}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-0.5">
                                        <Flame className="w-3 h-3 text-coral" />
                                        {member.streak}
                                    </span>
                                    <span className="font-semibold text-primary">{member.xpThisWeek} XP</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 px-4 py-2 bg-muted/30 text-xs text-muted-foreground border-t">
                    <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" /> Asciende
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400" /> Desciende
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
