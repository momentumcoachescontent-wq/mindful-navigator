import { ArrowLeft, Check, Crown, Shield, Headphones, Users, Download, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const features = [
  { icon: Shield, label: "Escáner IA ilimitado" },
  { icon: Headphones, label: "Todas las meditaciones y audios" },
  { icon: Users, label: "Comunidad completa: publica y comenta" },
  { icon: Download, label: "Contenido descargable offline" },
  { icon: Sparkles, label: "Biblioteca de herramientas completa" },
];

const plans = [
  {
    id: "monthly",
    label: "Mensual",
    price: "$6.99",
    period: "/mes",
    savings: null,
  },
  {
    id: "yearly",
    label: "Anual",
    price: "$59.99",
    period: "/año",
    savings: "Ahorra 28%",
    popular: true,
  },
];

const Premium = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center shadow-glow-coral">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Desbloquea tu potencial
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Accede a todas las herramientas para tu bienestar emocional y crecimiento personal.
          </p>
        </div>

        {/* Features */}
        <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="font-display font-semibold text-foreground">
            Todo incluido en Premium:
          </h3>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">{feature.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "w-full p-5 rounded-2xl border-2 transition-all relative overflow-hidden",
                selectedPlan === plan.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
            >
              {plan.popular && (
                <span className="absolute top-0 right-0 px-3 py-1 text-xs font-medium bg-coral text-white rounded-bl-xl">
                  Más popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-display font-semibold text-foreground">
                    {plan.label}
                  </p>
                  {plan.savings && (
                    <p className="text-xs text-success font-medium mt-0.5">
                      {plan.savings}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold text-foreground">
                    {plan.price}
                  </p>
                  <p className="text-xs text-muted-foreground">{plan.period}</p>
                </div>
              </div>
              {selectedPlan === plan.id && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Button variant="warmth" size="xl" className="w-full">
            <Crown className="w-5 h-5" />
            Comenzar Premium
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Prueba gratis por 7 días. Cancela cuando quieras.
          </p>
        </div>

        {/* Restore purchases */}
        <Button variant="ghost" className="w-full text-muted-foreground">
          Restaurar compras
        </Button>

        {/* Terms */}
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Al suscribirte aceptas nuestros{" "}
          <a href="#" className="underline">Términos de Servicio</a> y{" "}
          <a href="#" className="underline">Política de Privacidad</a>.
          La suscripción se renueva automáticamente a menos que se cancele 
          al menos 24 horas antes del fin del período actual.
        </p>
      </main>
    </div>
  );
};

export default Premium;
