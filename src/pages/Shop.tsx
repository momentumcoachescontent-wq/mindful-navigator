import { useState } from "react";
import { ArrowLeft, ShoppingBag, BookOpen, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { ProductCard } from "@/components/shop/ProductCard";
import { PricingTier } from "@/components/shop/PricingTier";

const Shop = () => {
    const navigate = useNavigate();

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
                <section>
                    <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Suscripción Premium
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <PricingTier
                            title="Gratis"
                            price="$0"
                            period="mes"
                            description="Para empezar tu camino de autoconocimiento."
                            features={[
                                "Acceso básico al Diario",
                                "3 Escáneres de situación mensules",
                                "Comunidad de apoyo (Lectura)",
                                "Meditaciones básicas"
                            ]}
                            ctaText="Tu Plan Actual"
                            ctaLink="#"
                        />
                        <PricingTier
                            title="Mindful Pro"
                            price="$9.99"
                            period="mes"
                            description="Potencia tu transformación con herramientas ilimitadas."
                            features={[
                                "Escáner de Situaciones ILIMITADO",
                                "Simulador de Conversaciones (IA Avanzada)",
                                "Audios & Meditaciones Exclusivas",
                                "Respaldo en la Nube y Sincronización",
                                "Acceso a Talleres Mensuales"
                            ]}
                            ctaText="Inicia Prueba Gratis"
                            ctaLink="https://buy.stripe.com/test_premium_link" // Placeholder link
                            isPopular={true}
                        />
                    </div>
                </section>

                {/* Resources Section */}
                <section>
                    <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-turquoise" />
                        Libros y Recursos
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <ProductCard
                            title="Más allá del Miedo"
                            price="$19.99"
                            description="La guía definitiva para entender y transformar tus miedos en poder personal. Best-seller digital."
                            image="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"
                            ctaText="Comprar Ebook"
                            ctaLink="#"
                            tag="Best Seller"
                        />
                        <ProductCard
                            title="Pack de Meditaciones: Ansiedad"
                            price="$14.99"
                            description="10 audios guiados específicamente diseñados para desactivar ataques de pánico y ansiedad generalizada."
                            // Abstract/calm image 
                            image="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800"
                            ctaText="Obtener Acceso"
                            ctaLink="#"
                        />
                    </div>
                </section>

                {/* Mentorship Section */}
                <section>
                    <div className="bg-gradient-to-br from-primary/10 to-turquoise/10 rounded-3xl p-8 text-center space-y-4 border border-primary/20">
                        <h2 className="text-2xl font-display font-bold text-foreground">
                            ¿Necesitas apoyo personalizado?
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Agenda una sesión 1:1 con nuestros coaches certificados para trabajar en profundidad tus bloqueos.
                        </p>
                        <Button
                            size="lg"
                            className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 mt-4"
                            onClick={() => window.location.href = "mailto:soporte@mindfulnavigator.app?subject=Consulta Mentoría"}
                        >
                            Consultar Disponibilidad
                        </Button>
                    </div>
                </section>
            </main>

            <MobileNav />
            <SOSButton />
        </div>
    );
};

export default Shop;
