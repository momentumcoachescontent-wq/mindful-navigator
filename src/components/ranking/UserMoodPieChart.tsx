import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Smile } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface MoodCount {
    name: string;
    value: number;
    color: string;
}

export function UserMoodPieChart() {
    const { user } = useAuth();

    const { data: chartData, isLoading } = useQuery({
        queryKey: ['moodFrequency', user?.id],
        queryFn: async () => {
            if (!user) return [];

            // Get the first day of the current month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { data, error } = await supabase
                .from('journal_entries')
                .select('mood_score')
                .eq('user_id', user.id)
                .gte('created_at', startOfMonth)
                .not('mood_score', 'is', null);

            if (error) throw error;

            let d_bad = 0, d_neutral = 0, d_good = 0;
            data?.forEach(entry => {
                const s = entry.mood_score as number;
                if (s === 1) d_bad++;
                else if (s === 2) d_neutral++;
                else if (s >= 3) d_good++; // 3 in CheckIn is "Bien". 3,4,5 in Journal are Ok/Good.
            });

            const result: MoodCount[] = [];

            if (d_good > 0) result.push({ name: 'Bien (😎)', value: d_good, color: 'hsl(var(--success))' });
            if (d_neutral > 0) result.push({ name: 'Regular (😐)', value: d_neutral, color: 'hsl(var(--warning))' });
            if (d_bad > 0) result.push({ name: 'Difícil (🔥)', value: d_bad, color: 'hsl(var(--coral))' });

            return result;
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
        <Card className="brutal-card border-x-4 border-success mt-6 w-full overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Smile className="w-5 h-5 text-success" />
                    Frecuencia de Estados (Mes Actual)
                </CardTitle>
                <CardDescription>Veces que has reportado cada estado de ánimo este mes.</CardDescription>
            </CardHeader>
            <CardContent className="h-64 pb-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [`${value} reportes`, 'Frecuencia']}
                            contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "8px",
                            }}
                            itemStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
