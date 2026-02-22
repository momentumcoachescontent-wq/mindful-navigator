import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

export function RankingTrendsChart() {
    const { user } = useAuth();

    const { data: chartData, isLoading } = useQuery({
        queryKey: ['xpTrends', user?.id],
        queryFn: async () => {
            if (!user) return [];

            // Calculate the date 14 days ago
            const date14DaysAgo = new Date();
            date14DaysAgo.setDate(date14DaysAgo.getDate() - 13);
            const minDateStr = `${date14DaysAgo.getFullYear()}-${String(date14DaysAgo.getMonth() + 1).padStart(2, '0')}-${String(date14DaysAgo.getDate()).padStart(2, '0')}`;

            // Fetch daily missions XP
            const { data: missionsData, error: missionsError } = await supabase
                .from('daily_missions')
                .select('mission_date, xp_earned')
                .eq('user_id', user.id)
                .gte('mission_date', minDateStr);

            if (missionsError) throw missionsError;

            // Also get journal entries as check-ins to make sure we show activity even if 0 XP was earned?
            // For now, let's just use daily_missions XP. But we also have daily_victories if they give XP, 
            // though victories are also tracked in user_progress. Wait, daily_missions is great for standard XP.
            // And daily_victories has xp_bonus. Let's fetch them too.
            const { data: victoriesData, error: victError } = await supabase
                .from('daily_victories')
                .select('victory_date, xp_bonus')
                .eq('user_id', user.id)
                .gte('victory_date', minDateStr);

            if (victError) throw victError;

            // Process and Group into standard last 14 days array (to show 0s optionally)
            const dailyMap: Record<string, number> = {};

            // Initialize map with last 14 days to have continuous lines
            for (let i = 13; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                dailyMap[dateString] = 0;
            }

            missionsData?.forEach(m => {
                if (dailyMap[m.mission_date] !== undefined) {
                    dailyMap[m.mission_date] += m.xp_earned;
                }
            });

            victoriesData?.forEach(v => {
                if (dailyMap[v.victory_date] !== undefined) {
                    dailyMap[v.victory_date] += v.xp_bonus;
                }
            });

            return Object.keys(dailyMap).sort().map(dateStr => {
                // Format date string purely for display like DD/MM
                const [yyyy, mm, dd] = dateStr.split('-');
                return {
                    date: `${dd}/${mm}`,
                    xp: dailyMap[dateStr]
                };
            });
        },
        enabled: !!user,
    });

    if (isLoading) {
        return (
            <Card className="brutal-card mt-6">
                <CardContent className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    if (!chartData || chartData.length === 0) return null;

    return (
        <Card className="brutal-card border-x-4 border-coral mt-6 w-full overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-coral" />
                    Tu Constancia Reciente
                </CardTitle>
                <CardDescription>Experiencia (XP) obtenida los últimos 14 días.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0 pt-0 pb-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--coral))" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="hsl(var(--coral))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.2)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                            }}
                            formatter={(value: number) => [`${value} XP`, "Experiencia"]}
                            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "4px" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="xp"
                            stroke="hsl(var(--coral))"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorXp)"
                            activeDot={{ r: 6, fill: "hsl(var(--coral))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
