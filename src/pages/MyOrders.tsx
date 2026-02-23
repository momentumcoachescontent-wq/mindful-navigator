import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, CreditCard, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Order {
    id: string;
    amount_total: number;
    currency: string;
    status: string;
    created_at: string;
    stripe_session_id: string;
    product?: {
        title: string;
    }
}

interface Subscription {
    id: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    product?: {
        title: string;
        description: string;
    }
}

const MyOrders = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate("/auth");
            return;
        }
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Orders
            const { data: ordersData, error: ordersError } = await (supabase
                .from("orders") as any)
                .select(`*, product:products(title)`)
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false });

            if (ordersError) throw ordersError;
            setOrders((ordersData || []) as Order[]);

            // Fetch Subscriptions
            const { data: subData, error: subError } = await (supabase
                .from("user_subscriptions") as any)
                .select(`*, product:products(title, description)`)
                .eq("user_id", user?.id)
                .neq("status", "canceled")
                .order("created_at", { ascending: false });

            if (subError) throw subError;
            setSubscriptions((subData || []) as Subscription[]);

        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                title: "Error",
                description: "No pudimos cargar tu historial.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async (subscriptionId: string) => {
        try {
            setProcessingId(subscriptionId);

            const { data, error } = await supabase.functions.invoke('cancel-subscription', {
                body: { subscriptionId }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            toast({
                title: "Suscripción cancelada",
                description: "Tu suscripción finalizará al terminar el periodo actual.",
            });

            // Refresh data to show updated status
            fetchData();

        } catch (error) {
            console.error("Cancel error:", error);
            toast({
                title: "Error al cancelar",
                description: "No pudimos cancelar la suscripción. Intenta más tarde.",
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8 pb-24">
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mt-1">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Mis Pedidos</h1>
                    <p className="text-muted-foreground">Gestiona tus compras y suscripciones activas.</p>
                </div>
            </div>

            <Tabs defaultValue="subscriptions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="subscriptions">Suscripciones Activas</TabsTrigger>
                    <TabsTrigger value="history">Historial de Compras</TabsTrigger>
                </TabsList>

                <TabsContent value="subscriptions" className="space-y-4 mt-6">
                    {subscriptions.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
                                <CreditCard className="h-10 w-10 text-muted-foreground" />
                                <p className="text-muted-foreground">No tienes suscripciones activas.</p>
                                <Button variant="outline" onClick={() => navigate("/shop")}>Ir a la Tienda</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        subscriptions.map((sub) => (
                            <Card key={sub.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{sub.product?.title || "Plan Premium"}</CardTitle>
                                            <CardDescription>{sub.product?.description}</CardDescription>
                                        </div>
                                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                            {sub.status === 'active' ? 'Activa' : sub.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Próxima renovación (o fin):</p>
                                            <p className="text-lg font-bold">
                                                {format(new Date(sub.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}
                                            </p>
                                            {sub.cancel_at_period_end && (
                                                <p className="text-xs text-yellow-600 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Se cancelará al final del periodo
                                                </p>
                                            )}
                                        </div>

                                        {!sub.cancel_at_period_end && sub.status === 'active' && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleCancelSubscription(sub.id)}
                                                disabled={!!processingId}
                                            >
                                                {processingId === sub.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Cancelar Suscripción
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4 mt-6">
                    {orders.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
                                <Package className="h-10 w-10 text-muted-foreground" />
                                <p className="text-muted-foreground">No has realizado compras aún.</p>
                                <Button variant="outline" onClick={() => navigate("/shop")}>Ir a la Tienda</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        orders.map((order) => (
                            <Card key={order.id}>
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="space-y-1">
                                        <p className="font-semibold">{order.product?.title || "Producto"}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(order.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatCurrency(order.amount_total, order.currency)}</p>
                                        <Badge variant="outline" className="mt-1 uppercase text-[10px]">
                                            {order.status}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MyOrders;
