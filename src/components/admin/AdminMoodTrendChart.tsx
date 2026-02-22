import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, LineChart as LineChartIcon } from "lucide-react";
import {
    LineChart,
    Line,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

export function AdminMoodTrendChart() {
    const { data: chartData, isLoading } = useQuery({
        queryKey: ["adminMoodTrends"],
        queryFn: async () => {
            // Calculate 30 days ago
            const date30DaysAgo = new Date();
            date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('journal_entries')
                .select('created_at, mood_score')
                .gte('created_at', date30DaysAgo.toISOString())
                .not('mood_score', 'is', null);

            if (error) throw error;

            // Group by date to find daily averages
            const dailyMap: Record<string, { total: number, count: number }> = {};

            data?.forEach(row => {
                const dateStr = new Date(row.created_at).toISOString().split('T')[0];
                if (!dailyMap[dateStr]) dailyMap[dateStr] = { total: 0, count: 0 };
                dailyMap[dateStr].total += row.mood_score as number;
                dailyMap[dateStr].count += 1;
            });

            return Object.keys(dailyMap).sort().map(dateStr => {
                const [yyyy, mm, dd] = dateStr.split('-');
                const avg = dailyMap[dateStr].total / dailyMap[dateStr].count;
                return {
                    date: `${dd}/${mm}`,
                    mood: Number(avg.toFixed(1)) // Keep one decimal
                };
            });
        },
    });

    if (isLoading) {
        return (
            <Card className="col-span-1 h-full flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    if (!chartData || chartData.length === 0) {
        return (
            <Card className="col-span-1 border-dashed">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <LineChartIcon className="w-5 h-5 text-coral" />
                        Tendencia Global de Mood
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No hay suficientes check-ins recientes para graficar.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 border-x-4 border-coral">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <LineChartIcon className="w-5 h-5 text-coral" />
                    Sentimiento de la Comunidad
                </CardTitle>
                <CardDescription>
                    Promedio global del estado de ánimo (mood score 1-10) en Check-ins Anónimos
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                            }}
                            formatter={(value: number) => [`${value} / 10`, "Esfuerzo/Estado Promedio"]}
                            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "4px" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="mood"
                            stroke="hsl(var(--coral))"
                            strokeWidth={3}
                            activeDot={{ r: 6, fill: "hsl(var(--coral))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
