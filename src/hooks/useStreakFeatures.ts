import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek } from 'date-fns';

interface StreakFeatures {
    shieldUsedAt: string | null;       // ISO date of last shield use
    shieldAvailableThisWeek: boolean;  // can the user use the shield?
    wagerActive: boolean;              // did user place a wager today?
    wagerAmount: number;               // seeds wagered today
}

/** Fetch streak shield + wager state for current user */
export function useStreakFeatures() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['streak-features', user?.id],
        queryFn: async (): Promise<StreakFeatures> => {
            if (!user) return { shieldUsedAt: null, shieldAvailableThisWeek: true, wagerActive: false, wagerAmount: 0 };

            const { data } = await supabase
                .from('user_progress')
                .select('shield_used_at, wager_active, wager_amount')
                .eq('user_id', user.id)
                .maybeSingle();

            const shieldUsedAt = data?.shield_used_at || null;
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
            const shieldAvailableThisWeek = !shieldUsedAt || shieldUsedAt < weekStart;

            return {
                shieldUsedAt,
                shieldAvailableThisWeek,
                wagerActive: data?.wager_active || false,
                wagerAmount: data?.wager_amount || 0,
            };
        },
        enabled: !!user,
    });
}

/** Use the streak shield — freezes streak for today (premium only) */
export function useActivateStreakShield() {
    const { user } = useAuth();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Not authenticated');

            const today = new Date().toISOString().split('T')[0];
            const { error } = await supabase
                .from('user_progress')
                .update({ shield_used_at: today } as any)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['streak-features'] });
            toast.success('🛡️ Escudo activado — tu racha está protegida hoy');
        },
        onError: () => {
            toast.error('No se pudo activar el escudo');
        },
    });
}

/** Place a streak wager: bet X seeds for 1.5× if streak maintained today */
export function usePlaceWager() {
    const { user } = useAuth();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (seedAmount: number) => {
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('user_progress')
                .update({ wager_active: true, wager_amount: seedAmount } as any)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: (_, seedAmount) => {
            qc.invalidateQueries({ queryKey: ['streak-features'] });
            toast.success(`🎲 Apuesta de ${seedAmount} semillas colocada — mantén la racha hoy`);
        },
        onError: () => {
            toast.error('No se pudo colocar la apuesta');
        },
    });
}

/** Resolve wager at end of day (call when missions completed) */
export function useResolveWager() {
    const { user } = useAuth();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ won }: { won: boolean }) => {
            if (!user) throw new Error('Not authenticated');

            const { data: progress } = await supabase
                .from('user_progress')
                .select('power_tokens, wager_amount')
                .eq('user_id', user.id)
                .single();

            if (!progress?.wager_amount) return { won, reward: 0 };

            const tokens = progress.power_tokens || 0;
            const wager = progress.wager_amount;
            const newTokens = won
                ? tokens + Math.floor(wager * 0.5) // win: +50% bonus
                : tokens - wager;                  // lose: deduct wager

            await supabase.from('user_progress')
                .update({
                    power_tokens: Math.max(0, newTokens),
                    wager_active: false,
                    wager_amount: 0,
                } as any)
                .eq('user_id', user.id);

            return { won, reward: won ? Math.floor(wager * 0.5) : -wager };
        },
        onSuccess: ({ won, reward }) => {
            if (won) {
                toast.success(`🎲 ¡Apuesta ganada! +${reward} semillas`);
            } else {
                toast.error(`🎲 Apuesta perdida — ${Math.abs(reward)} semillas deducidas`);
            }
            qc.invalidateQueries({ queryKey: ['streak-features'] });
        },
    });
}
