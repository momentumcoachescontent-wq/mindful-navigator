import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Activity } from 'lucide-react';
import {
    Line,
    LineChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend
} from 'recharts';

export function UserHealthChart() {
    const { user } = useAuth();

    const { data: chartData, isLoading } = useQuery({
        queryKey: ['healthTrends', user?.id],
        queryFn: async () => {
            if (!user) return [];

            // Calculate the date 14 days ago
            const date14DaysAgo = new Date();
            date14DaysAgo.setDate(date14DaysAgo.getDate() - 13);
            const minDateStr = date14DaysAgo.toISOString();

            // Fetch journal entries with scores
            const { data: journalData, error } = await supabase
                .from('journal_entries')
                .select('created_at, energy_score, stress_score')
                .eq('user_id', user.id)
                .gte('created_at', minDateStr)
                .not('energy_score', 'is', null) // Avoid empty scans
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Group by day to get daily averages if there are multiple entries
            const dailyMap: Record<string, { energyTotal: number, stressTotal: number, count: number }> = {};

            // Initialize last 14 days to preserve timeline
            for (let i = 13; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                dailyMap[dateString] = { energyTotal: 0, stressTotal: 0, count: 0 };
            }

            journalData?.forEach(entry => {
                const dateObj = new Date(entry.created_at);
                const dateString = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

                if (dailyMap[dateString] !== undefined && entry.energy_score !== null && entry.stress_score !== null) {
                    dailyMap[dateString].energyTotal += entry.energy_score;
                    dailyMap[dateString].stressTotal += entry.stress_score;
                    dailyMap[dateString].count += 1;
                }
            });

            return Object.keys(dailyMap).sort().map(dateStr => {
                const [yyyy, mm, dd] = dateStr.split('-');
                const metrics = dailyMap[dateStr];

                // Si no hubo registro ese día, se interpolará visualmente a nulo.
                const hasData = metrics.count > 0;

                return {
                    date: `${dd}/${mm}`,
                    // Calcular promedio si hay múltiples diarios, si no dejar null para que la gráfica salte o quiebre si preferimos
                    energia: hasData ? Math.round((metrics.energyTotal / metrics.count) * 10) / 10 : null,
                    estres: hasData ? Math.round((metrics.stressTotal / metrics.count) * 10) / 10 : null
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

    // Verificar si el usuario al menos ha llenado un diario con datos
    const hasAnyData = chartData.some(d => d.energia !== null || d.estres !== null);
    if (!hasAnyData) return null;

    return (
        <Card className="brutal-card border-x-4 border-primary mt-6 w-full overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Biometría Emocional
                </CardTitle>
                <CardDescription>Fluctuación de Energía (1-10) vs Estrés (1-10) en tus diarios.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0 pt-0 pb-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.2)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            dy={10}
                        />
                        <YAxis
                            domain={[0, 10]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            ticks={[2, 4, 6, 8, 10]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                            }}
                            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "4px" }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />

                        <Line
                            type="monotone"
                            name="Energía"
                            dataKey="energia"
                            stroke="hsl(var(--success))"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "hsl(var(--success))", strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            connectNulls={true}
                        />
                        <Line
                            type="monotone"
                            name="Estrés"
                            dataKey="estres"
                            stroke="hsl(var(--destructive))"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "hsl(var(--destructive))", strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            connectNulls={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
