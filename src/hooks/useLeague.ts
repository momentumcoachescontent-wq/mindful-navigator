import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek } from 'date-fns';
import { toast } from 'sonner';

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface LeagueMember {
    userId: string;
    alias: string;
    xpThisWeek: number;
    streak: number;
    position: number;
    isCurrentUser: boolean;
}

export interface League {
    id: string;
    tier: LeagueTier;
    weekStart: string;
    members: LeagueMember[];
}

const TIER_LABELS: Record<LeagueTier, string> = {
    bronze: 'Bronce 🥉',
    silver: 'Plata 🥈',
    gold: 'Oro 🥇',
    diamond: 'Diamante 💎',
};

const TIER_COLORS: Record<LeagueTier, string> = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-slate-400 to-slate-600',
    gold: 'from-amber-400 to-amber-600',
    diamond: 'from-cyan-400 to-blue-600',
};

export function getTierLabel(tier: LeagueTier) { return TIER_LABELS[tier]; }
export function getTierColors(tier: LeagueTier) { return TIER_COLORS[tier]; }

/** Fetch the current user's league for this week */
export function useMyLeague() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['my-league', user?.id],
        queryFn: async (): Promise<League | null> => {
            if (!user) return null;

            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
                .toISOString().split('T')[0];

            // Find the league this user belongs to this week
            const { data: membership } = await supabase
                .from('league_members')
                .select('league_id')
                .eq('user_id', user.id)
                .gte('joined_at', weekStart)
                .maybeSingle();

            if (!membership) {
                // Auto-assign to a league
                return assignToLeague(user.id, weekStart);
            }

            return fetchLeagueDetails(membership.league_id, user.id);
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5 min
    });
}

async function fetchLeagueDetails(leagueId: string, currentUserId: string): Promise<League | null> {
    const { data: league } = await supabase
        .from('leagues')
        .select('id, tier, week_start')
        .eq('id', leagueId)
        .single();

    if (!league) return null;

    const { data: members } = await supabase
        .from('league_members')
        .select('user_id, xp_earned')
        .eq('league_id', leagueId)
        .order('xp_earned', { ascending: false });

    // Fetch profiles for aliases
    const memberIds = (members || []).map(m => m.user_id);
    const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, streak_count')
        .in('user_id', memberIds);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));

    const rankedMembers: LeagueMember[] = (members || []).map((m, idx) => {
        const profile = profileMap[m.user_id];
        return {
            userId: m.user_id,
            alias: profile?.display_name || `Guerrero${idx + 1}`,
            xpThisWeek: m.xp_earned || 0,
            streak: profile?.streak_count || 0,
            position: idx + 1,
            isCurrentUser: m.user_id === currentUserId,
        };
    });

    return {
        id: league.id,
        tier: league.tier as LeagueTier,
        weekStart: league.week_start,
        members: rankedMembers,
    };
}

async function assignToLeague(userId: string, weekStart: string): Promise<League | null> {
    // Get user's current XP to determine tier
    const { data: progress } = await supabase
        .from('user_progress')
        .select('total_xp')
        .eq('user_id', userId)
        .single();

    const xp = progress?.total_xp || 0;
    const tier: LeagueTier =
        xp >= 8000 ? 'diamond' :
            xp >= 3000 ? 'gold' :
                xp >= 500 ? 'silver' :
                    'bronze';

    // Find an existing league for this week/tier with < 20 members
    const { data: existing } = await supabase
        .from('leagues')
        .select('id')
        .eq('tier', tier)
        .eq('week_start', weekStart)
        .limit(1)
        .maybeSingle();

    let leagueId: string;

    if (existing) {
        // Check if there's room
        const { count } = await supabase
            .from('league_members')
            .select('id', { count: 'exact', head: true })
            .eq('league_id', existing.id);

        if ((count || 0) < 20) {
            leagueId = existing.id;
        } else {
            // Create a new league
            const { data: newLeague } = await supabase
                .from('leagues')
                .insert({ tier, week_start: weekStart })
                .select('id')
                .single();
            leagueId = newLeague?.id || '';
        }
    } else {
        const { data: newLeague } = await supabase
            .from('leagues')
            .insert({ tier, week_start: weekStart })
            .select('id')
            .single();
        leagueId = newLeague?.id || '';
    }

    if (!leagueId) return null;

    await supabase.from('league_members')
        .upsert({ league_id: leagueId, user_id: userId, xp_earned: 0 });

    return fetchLeagueDetails(leagueId, userId);
}

/** Update XP earned this week for the current user in their league */
export function useUpdateLeagueXP() {
    const { user } = useAuth();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (xpToAdd: number) => {
            if (!user) return;
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
                .toISOString().split('T')[0];

            const { data: membership } = await supabase
                .from('league_members')
                .select('id, xp_earned')
                .eq('user_id', user.id)
                .gte('joined_at', weekStart)
                .maybeSingle();

            if (!membership) return;

            await supabase.from('league_members')
                .update({ xp_earned: (membership.xp_earned || 0) + xpToAdd })
                .eq('id', membership.id);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['my-league'] });
        },
    });
}
