import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const INACTIVITY_DAYS = 3;

export function useAdaptiveNudges() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Fetch user's last activity date + streak info
    const { data: activityData } = useQuery({
        queryKey: ['nudge-activity', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const [progressRes, lastMissionRes, profileRes] = await Promise.all([
                supabase.from('user_progress').select('total_xp').eq('user_id', user.id).single(),
                supabase.from('daily_missions').select('created_at').eq('user_id', user.id)
                    .order('created_at', { ascending: false }).limit(1).maybeSingle(),
                supabase.from('profiles').select('streak_count').eq('user_id', user.id).single(),
            ]);
            return {
                xp: progressRes.data?.total_xp || 0,
                lastMission: lastMissionRes.data?.created_at || null,
                streak: profileRes.data?.streak_count || 0,
            };
        },
        enabled: !!user,
        staleTime: 10 * 60 * 1000, // 10 min — only check once per session
    });

    // Recent journal for sentiment detection
    const { data: recentJournal } = useQuery({
        queryKey: ['nudge-journal', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data } = await supabase
                .from('journal_entries')
                .select('category, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);
            return data || [];
        },
        enabled: !!user,
        staleTime: 10 * 60 * 1000,
    });

    useEffect(() => {
        if (!activityData || !user) return;

        const now = new Date();
        const nudgeKey = `nudge_shown_${user.id}_${now.toISOString().split('T')[0]}`;
        if (sessionStorage.getItem(nudgeKey)) return; // max 1 nudge per day

        // NUDGE 1: Streak about to break (streak > 0, no mission today)
        if (activityData.streak > 0 && activityData.lastMission) {
            const lastDate = new Date(activityData.lastMission);
            const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
            const hour = now.getHours();

            // Only nudge after 18:00 if no mission today
            if (diffHours > 20 && hour >= 18) {
                sessionStorage.setItem(nudgeKey, '1');
                // Track nudge shown
                supabase.from('nudge_events').insert([{ user_id: user.id, nudge_type: 'streak_danger', action_taken: false }] as never).then(() => { });
                toast.warning(`🔥 Tu racha de ${activityData.streak} días está en peligro`, {
                    description: 'Completa una misión antes de medianoche',
                    action: {
                        label: 'Ir ahora',
                        onClick: () => {
                            supabase.from('nudge_events').update({ action_taken: true } as never).eq('user_id', user.id).eq('nudge_type', 'streak_danger').order('created_at', { ascending: false }).limit(1).then(() => { });
                            navigate('/');
                        },
                    },
                    duration: 8000,
                });
                return;
            }
        }

        // NUDGE 2: Inactivity (no missions in N days)
        if (activityData.lastMission) {
            const lastDate = new Date(activityData.lastMission);
            const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays >= INACTIVITY_DAYS) {
                sessionStorage.setItem(nudgeKey, '1');
                const dayWord = Math.floor(diffDays) === 1 ? 'día' : 'días';
                // Track nudge shown
                supabase.from('nudge_events').insert([{ user_id: user.id, nudge_type: 'inactivity', action_taken: false }] as never).then(() => { });
                toast.info(`Han pasado ${Math.floor(diffDays)} ${dayWord} sin practicar`, {
                    description: '¿Cómo estás? El Coach está aquí para ti',
                    action: {
                        label: 'Hablar con Coach',
                        onClick: () => {
                            supabase.from('nudge_events').update({ action_taken: true } as never).eq('user_id', user.id).eq('nudge_type', 'inactivity').order('created_at', { ascending: false }).limit(1).then(() => { });
                            navigate('/coach');
                        },
                    },
                    duration: 8000,
                });
                return;
            }
        }

        // NUDGE 3: Recurring negative sentiment in journal
        const negativeTags = ['miedo', 'ansiedad', 'tristeza', 'bloqueo', 'dolor'];
        const negativeCount = (recentJournal || []).filter(e =>
            negativeTags.some(tag => e.category?.toLowerCase().includes(tag))
        ).length;

        if (negativeCount >= 3) {
            sessionStorage.setItem(nudgeKey, '1');
            // Track nudge shown
            supabase.from('nudge_events').insert([{ user_id: user.id, nudge_type: 'negative_sentiment', action_taken: false }] as never).then(() => { });
            toast.info('Tu diario muestra algo que merece atención', {
                description: 'Tienes una meditación recomendada para ti',
                action: {
                    label: 'Ver recomendación',
                    onClick: () => {
                        supabase.from('nudge_events').update({ action_taken: true } as never).eq('user_id', user.id).eq('nudge_type', 'negative_sentiment').order('created_at', { ascending: false }).limit(1).then(() => { });
                        navigate('/coach');
                    },
                },
                duration: 6000,
            });
        }
    }, [activityData, recentJournal, user, navigate]);
}
