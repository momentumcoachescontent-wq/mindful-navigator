import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Wallet, ShieldCheck, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface PaymentConfig {
    id: string;
    provider: 'stripe' | 'paypal' | 'mercadopago';
    public_key: string | null;
    secret_key: string | null;
    is_active: boolean;
}

export function PaymentSettingsDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch configs
    const { data: configs, isLoading } = useQuery({
        queryKey: ['payment-configs'],
        queryFn: async () => {
            // @ts-ignore
            const { data, error } = await supabase.from('payment_configs').select('*');
            if (error) throw error;
            return data as PaymentConfig[];
        },
        enabled: isOpen,
    });

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (config: Partial<PaymentConfig>) => {
            // Check if exists
            const existing = configs?.find(c => c.provider === config.provider);

            if (existing) {
                // @ts-ignore
                const { error } = await supabase
                    .from('payment_configs')
                    .update(config)
                    .eq('id', existing.id);
                if (error) throw error;
            } else {
                // @ts-ignore
                const { error } = await supabase
                    .from('payment_configs')
                    .insert([config]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-configs'] });
            toast.success("Configuración guardada correctamente");
        },
        onError: (error) => {
            toast.error(`Error al guardar: ${error.message}`);
        }
    });

    const handleSave = (e: React.FormEvent, provider: string) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        saveMutation.mutate({
            provider: provider as any,
            public_key: formData.get('public_key') as string,
            secret_key: formData.get('secret_key') as string,
            is_active: formData.get('is_active') === 'on',
        });
    };

    const getConfig = (provider: string) => configs?.find(c => c.provider === provider);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <CreditCard className="w-4 h-4" /> Configurar Pagos
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Pasarelas de Pago</DialogTitle>
                    <DialogDescription>
                        Configura las credenciales API para procesar pagos. Estas claves se usarán para generar enlaces seguros.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <Tabs defaultValue="stripe" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="stripe">Stripe</TabsTrigger>
                            <TabsTrigger value="paypal">PayPal</TabsTrigger>
                            <TabsTrigger value="mercadopago">MercadoPago</TabsTrigger>
                        </TabsList>

                        {/* STRIPE */}
                        <TabsContent value="stripe">
                            <form onSubmit={(e) => handleSave(e, 'stripe')} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="stripe_pk">Public Key (Publishable)</Label>
                                    <Input id="stripe_pk" name="public_key" defaultValue={getConfig('stripe')?.public_key || ''} placeholder="pk_test_..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stripe_sk">Secret Key</Label>
                                    <Input id="stripe_sk" name="secret_key" type="password" defaultValue={getConfig('stripe')?.secret_key || ''} placeholder="sk_test_..." />
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch id="stripe_active" name="is_active" defaultChecked={getConfig('stripe')?.is_active} />
                                    <Label htmlFor="stripe_active">Activar Stripe como método principal</Label>
                                </div>
                                <Button type="submit" className="w-full">
                                    <Save className="w-4 h-4 mr-2" /> Guardar Stripe
                                </Button>
                            </form>
                        </TabsContent>

                        {/* PAYPAL */}
                        <TabsContent value="paypal">
                            <form onSubmit={(e) => handleSave(e, 'paypal')} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="paypal_client">Client ID</Label>
                                    <Input id="paypal_client" name="public_key" defaultValue={getConfig('paypal')?.public_key || ''} placeholder="Client ID..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paypal_secret">Client Secret</Label>
                                    <Input id="paypal_secret" name="secret_key" type="password" defaultValue={getConfig('paypal')?.secret_key || ''} placeholder="Secret..." />
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch id="paypal_active" name="is_active" defaultChecked={getConfig('paypal')?.is_active} />
                                    <Label htmlFor="paypal_active">Activar PayPal</Label>
                                </div>
                                <Button type="submit" className="w-full">
                                    <Save className="w-4 h-4 mr-2" /> Guardar PayPal
                                </Button>
                            </form>
                        </TabsContent>

                        {/* MERCADOPAGO */}
                        <TabsContent value="mercadopago">
                            <form onSubmit={(e) => handleSave(e, 'mercadopago')} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mp_key">Public Key</Label>
                                    <Input id="mp_key" name="public_key" defaultValue={getConfig('mercadopago')?.public_key || ''} placeholder="TEST-..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mp_token">Access Token</Label>
                                    <Input id="mp_token" name="secret_key" type="password" defaultValue={getConfig('mercadopago')?.secret_key || ''} placeholder="TEST-..." />
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch id="mp_active" name="is_active" defaultChecked={getConfig('mercadopago')?.is_active} />
                                    <Label htmlFor="mp_active">Activar MercadoPago</Label>
                                </div>
                                <Button type="submit" className="w-full">
                                    <Save className="w-4 h-4 mr-2" /> Guardar MercadoPago
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}
