import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { ArrowLeft, ShoppingBag, BookOpen, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { ProductCard } from "@/components/shop/ProductCard";
import { PricingTier } from "@/components/shop/PricingTier";
import { useToast } from "@/hooks/use-toast";

interface Product {
    id: string;
    title: string;
    description: string | null;
    price: number;
    currency: string; // New field
    category: 'subscription' | 'ebook' | 'meditation' | 'service' | 'pack';
    cta_link: string | null;
    is_active: boolean;
    is_featured: boolean;
    image_url: string | null;
}

const Shop = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const { data: products, isLoading } = useQuery({
        queryKey: ['shop-products'],
        queryFn: async () => {
            // @ts-ignore
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('price', { ascending: true }); // Free/Cheap first

            if (error) throw error;
            return data as unknown as Product[];
        }
    });

    // Metrics Tracking
    const trackProductEventMutation = useMutation({
        mutationFn: async (productId: string) => {
            // @ts-ignore
            await supabase.from('product_events').insert([{
                product_id: productId,
                event_type: 'click_cta'
            }]);
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleProductClick = async (product: Product) => {
        trackProductEventMutation.mutate(product.id);

        if (product.cta_link) {
            window.open(product.cta_link, '_blank');
            return;
        }

        // Automatic Stripe Checkout
        try {
            setIsCheckingOut(true);
            toast({
                title: "Iniciando pago...",
                description: "Te estamos redirigiendo a la pasarela segura.",
            });

            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: { productId: product.id }
            });

            if (error) throw error;
            if (!data?.url) throw new Error("No checkout URL returned");

            window.location.href = data.url;

        } catch (error) {
            console.error('Checkout error:', error);
            setIsCheckingOut(false);
            toast({
                title: "Error al iniciar pago",
                description: "Por favor intenta más tarde o contacta soporte.",
                variant: "destructive"
            });
        }
    };

    const subscriptionProducts = products?.filter(p => p.category === 'subscription') || [];
    const resourcesProducts = products?.filter(p => ['ebook', 'meditation', 'pack'].includes(p.category)) || [];
    // Mentorship handled separately as static block with coming soon


    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-border/50">
                <div className="container flex items-center gap-4 py-4">
                    <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-lg font-display font-bold text-foreground">
                            Tienda de Bienestar
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Invierte en tu crecimiento personal
                        </p>
                    </div>
                    <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
            </header>

            <main className="container py-8 space-y-12">
                {/* Subscription Section */}
                {subscriptionProducts.length > 0 && (
                    <section>
                        <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Suscripción Premium
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            {subscriptionProducts.map(product => (
                                <PricingTier
                                    key={product.id}
                                    title={product.title}
                                    price={new Intl.NumberFormat('es-MX', { style: 'currency', currency: product.currency || 'MXN' }).format(product.price)}
                                    period="mes"
                                    description={product.description || ""}
                                    features={product.description?.includes("Tools") ? [
                                        "Escáner de Situaciones ILIMITADO",
                                        "Simulador de Conversaciones",
                                        "Audios & Meditaciones Exclusivas"
                                    ] : [
                                        "Acceso básico al Diario",
                                        "3 Escáneres mensuales",
                                        "Comunidad de apoyo"
                                    ]}
                                    ctaText={product.price === 0 ? "Tu Plan Actual" : "Inicia Prueba Gratis"}
                                    ctaLink={product.cta_link || "#"}
                                    isPopular={product.is_featured}
                                    onSelect={() => handleProductClick(product)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Resources Section - Ebooks, Packs, Meditations */}
                {(resourcesProducts.length > 0) && (
                    <section>
                        <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-turquoise" />
                            Libros y Recursos
                        </h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resourcesProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    title={product.title}
                                    price={new Intl.NumberFormat('es-MX', { style: 'currency', currency: product.currency || 'MXN' }).format(product.price)}
                                    description={product.description || ""}
                                    image={product.image_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"} // Fallback image
                                    ctaText="Obtener Acceso"
                                    ctaLink={product.cta_link || "#"}
                                    tag={product.category === 'pack' ? "Pack Ahorro" : product.is_featured ? "Destacado" : undefined}
                                    onAdd={() => handleProductClick(product)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Services / Mentorship Section - Dynamic */}
                {(() => {
                    const serviceProducts = products?.filter(p => p.category === 'service') || [];

                    if (serviceProducts.length > 0) {
                        return (
                            <section>
                                <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    Mentoría y Servicios
                                </h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {serviceProducts.map(product => (
                                        <div key={product.id} className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-turquoise/5 rounded-3xl p-6 border border-primary/10 flex flex-col md:flex-row gap-6 items-center">
                                            {product.image_url && (
                                                <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden shrink-0">
                                                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 text-center md:text-left space-y-4">
                                                {product.is_featured && (
                                                    <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-600 text-xs font-bold rounded-full mb-2">
                                                        Recomendado
                                                    </span>
                                                )}
                                                <h3 className="text-2xl font-display font-bold text-foreground">
                                                    {product.title}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {product.description}
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
                                                    <span className="text-2xl font-bold text-primary">
                                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: product.currency || 'MXN' }).format(product.price)}
                                                    </span>
                                                    <Button size="lg" className="w-full sm:w-auto" onClick={() => handleProductClick(product)}>
                                                        Reservar Ahora
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    }

                    // Fallback to "Coming Soon" if no services are defined
                    return (
                        <section>
                            <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-turquoise/10 rounded-3xl p-8 text-center space-y-4 border border-primary/20">
                                <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-yellow-500/30">
                                    Próximamente
                                </div>

                                <h2 className="text-2xl font-display font-bold text-foreground">
                                    ¿Necesitas apoyo personalizado?
                                </h2>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Agenda una sesión 1:1 con nuestros coaches certificados para trabajar en profundidad tus bloqueos.
                                </p>
                                <Button
                                    size="lg"
                                    className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 mt-4 opacity-75 cursor-not-allowed"
                                >
                                    Consultar Disponibilidad
                                </Button>
                            </div>
                        </section>
                    );
                })()}
            </main>

            <MobileNav />
            <SOSButton />

            {isCheckingOut && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium text-foreground">Preparando tu compra segura...</p>
                </div>
            )}
        </div>
    );
};

export default Shop;
