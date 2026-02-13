import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users, Crown, Brain, Zap, Activity,
    BarChart3, ArrowLeft, Shield, Music
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AdminStats {
    total_users: number;
    premium_users: number;
    total_ai_scans: number;
    avg_scans_per_user: number;
    total_audio_hours: number;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, loading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdminAndFetchStats = async () => {
            if (!user) {
                if (!isAuthLoading) navigate("/auth");
                return;
            }

            try {
                // 1. Verify Admin Status
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("is_admin")
                    .eq("user_id", user.id)
                    .single();

                if (!profile?.is_admin) {
                    toast({
                        title: "Acceso denegado",
                        description: "No tienes permisos de administrador.",
                        variant: "destructive",
                    });
                    navigate("/");
                    return;
                }

                setIsAdmin(true);

                // 2. Fetch Stats via RPC
                const { data, error } = await supabase.rpc("get_admin_stats");

                if (error) throw error;
                setStats(data as unknown as AdminStats);

            } catch (error) {
                console.error("Error fetching admin stats:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las estadísticas.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (!isAuthLoading) {
            checkAdminAndFetchStats();
        }
    }, [user, isAuthLoading, navigate, toast]);

    if (isLoading || isAuthLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
                <div className="container flex items-center gap-3 py-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold font-display flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Panel de Administración
                        </h1>
                    </div>
                </div>
            </div>

            <main className="container py-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Users */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Comunidad activa
                            </p>
                        </CardContent>
                    </Card>

                    {/* Premium */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Usuarios Premium</CardTitle>
                            <Crown className="h-4 w-4 text-warning" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.premium_users || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.total_users ? Math.round((stats.premium_users / stats.total_users) * 100) : 0}% conversión
                            </p>
                        </CardContent>
                    </Card>

                    {/* Audio Hours */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Horas de Meditación</CardTitle>
                            <Music className="h-4 w-4 text-turquoise" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_audio_hours || 0}h</div>
                            <p className="text-xs text-muted-foreground">
                                Tiempo total escuchado
                            </p>
                        </CardContent>
                    </Card>

                    {/* AI Scans */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Consultas IA</CardTitle>
                            <Brain className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_ai_scans || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                ~{stats?.avg_scans_per_user || 0} por usuario
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Charts / Sections */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Impacto del Escáner
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                Gráfico de tendencias (Próximamente)
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Actividad Reciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                Feed de actividad (Próximamente)
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
