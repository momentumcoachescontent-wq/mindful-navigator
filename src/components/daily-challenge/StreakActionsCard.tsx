import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Lock } from 'lucide-react';
import { useStreakFeatures, useActivateStreakShield, usePlaceWager } from '@/hooks/useStreakFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface StreakActionsCardProps {
    currentStreak: number;
    seedsAvailable: number;
}

const WAGER_OPTIONS = [10, 25, 50];

export function StreakActionsCard({ currentStreak, seedsAvailable }: StreakActionsCardProps) {
    const { isPremium } = useAuth();
    const { data: features } = useStreakFeatures();
    const activateShield = useActivateStreakShield();
    const placeWager = usePlaceWager();
    const [selectedWager, setSelectedWager] = useState<number | null>(null);

    if (currentStreak === 0) return null;

    return (
        <Card className="border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Acciones de Racha
                    <Badge variant="outline" className="text-xs font-normal">
                        {currentStreak} días 🔥
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Streak Shield */}
                <div className={cn(
                    'p-3 rounded-xl border',
                    features?.shieldAvailableThisWeek && isPremium
                        ? 'border-blue-500/30 bg-blue-500/5'
                        : 'border-border/50 opacity-60'
                )}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className={cn(
                                'w-5 h-5',
                                features?.shieldAvailableThisWeek && isPremium ? 'text-blue-500' : 'text-muted-foreground'
                            )} />
                            <div>
                                <p className="text-sm font-medium">Escudo de Racha</p>
                                <p className="text-xs text-muted-foreground">Protege tu racha 1 día esta semana</p>
                            </div>
                        </div>

                        {!isPremium ? (
                            <Badge variant="outline" className="text-xs gap-1">
                                <Lock className="w-3 h-3" /> Premium
                            </Badge>
                        ) : features?.shieldAvailableThisWeek ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
                                onClick={() => activateShield.mutate()}
                                disabled={activateShield.isPending}
                            >
                                🛡️ Activar
                            </Button>
                        ) : (
                            <Badge variant="secondary" className="text-xs">Usado esta semana</Badge>
                        )}
                    </div>
                </div>

                {/* Streak Wager */}
                <div className={cn(
                    'p-3 rounded-xl border',
                    !features?.wagerActive ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/30 bg-green-500/5'
                )}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🎲</span>
                        <div>
                            <p className="text-sm font-medium">
                                {features?.wagerActive ? 'Apuesta activa' : 'Apostar semillas'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {features?.wagerActive
                                    ? `${features.wagerAmount} semillas apostadas — mantén la racha hoy`
                                    : 'Gana ×1.5 semillas si completas tus misiones hoy'}
                            </p>
                        </div>
                    </div>

                    {!features?.wagerActive && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                {WAGER_OPTIONS.map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => setSelectedWager(amount === selectedWager ? null : amount)}
                                        disabled={amount > seedsAvailable}
                                        className={cn(
                                            'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                                            selectedWager === amount
                                                ? 'bg-amber-500 border-amber-500 text-white'
                                                : amount > seedsAvailable
                                                    ? 'border-border text-muted-foreground opacity-40 cursor-not-allowed'
                                                    : 'border-amber-500/40 text-amber-700 hover:bg-amber-500/10'
                                        )}
                                    >
                                        {amount} 🌱
                                    </button>
                                ))}
                            </div>

                            {selectedWager && (
                                <Button
                                    size="sm"
                                    className="w-full text-xs bg-amber-500 hover:bg-amber-600 text-white"
                                    onClick={() => {
                                        placeWager.mutate(selectedWager);
                                        setSelectedWager(null);
                                    }}
                                    disabled={placeWager.isPending}
                                >
                                    Apostar {selectedWager} semillas
                                </Button>
                            )}
                        </div>
                    )}

                    {features?.wagerActive && (
                        <Badge className="bg-green-500/20 text-green-700 border-green-500/30 text-xs">
                            ✓ Apuesta en juego
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
