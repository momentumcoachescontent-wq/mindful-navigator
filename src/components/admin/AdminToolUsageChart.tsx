import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, PieChart as PieChartIcon } from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from "recharts";

const COLORS = ['#00F5D4', '#2B2B2B', '#FF3B30', '#FFD166', '#118AB2', '#06D6A0'];

export function AdminToolUsageChart() {
    const { data: chartData, isLoading } = useQuery({
        queryKey: ["adminToolUsage"],
        queryFn: async () => {
            // Calculate 30 days ago
            const date30DaysAgo = new Date();
            date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
            const minDateStr = `${date30DaysAgo.getFullYear()}-${String(date30DaysAgo.getMonth() + 1).padStart(2, '0')}-${String(date30DaysAgo.getDate()).padStart(2, '0')}`;

            const { data, error } = await supabase
                .from('daily_missions')
                .select('mission_type')
                .gte('mission_date', minDateStr);

            if (error) throw error;

            const typeCounts: Record<string, number> = {};
            data?.forEach(row => {
                const type = row.mission_type || 'Unknown';
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });

            return Object.keys(typeCounts)
                .map(key => ({
                    name: key.toUpperCase(),
                    value: typeCounts[key]
                }))
                .sort((a, b) => b.value - a.value); // Sort descending
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
                        <PieChartIcon className="w-5 h-5 text-turquoise" />
                        Uso de Herramientas (30 Días)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No hay suficientes datos de misiones recientes.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-turquoise" />
                    Distribución de Uso de Herramientas
                </CardTitle>
                <CardDescription>
                    Basado en interacciones confirmadas del Reto Diario (Últimos 30 días)
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
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
                        >
                            {chartData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                                color: "hsl(var(--foreground))"
                            }}
                            formatter={(value: number) => [`${value} usos`, "Interacciones"]}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px", color: "hsl(var(--foreground))" }} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
