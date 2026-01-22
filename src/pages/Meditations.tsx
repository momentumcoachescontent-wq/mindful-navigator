import { useState } from "react";
import { ArrowLeft, Headphones, Play, Clock, Heart, Download, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "Todas" },
  { id: "calm", label: "Calma" },
  { id: "clarity", label: "Claridad" },
  { id: "limits", label: "Límites" },
  { id: "selfesteem", label: "Autoestima" },
];

const meditations = [
  {
    id: "1",
    title: "Respiración para la calma",
    description: "Reduce la ansiedad en 5 minutos",
    duration: "5 min",
    category: "calm",
    isFree: true,
    isFavorite: true,
  },
  {
    id: "2",
    title: "Reconoce tu valor",
    description: "Afirmaciones para fortalecer tu autoestima",
    duration: "10 min",
    category: "selfesteem",
    isFree: false,
  },
  {
    id: "3",
    title: "Visualización de límites",
    description: "Practica mentalmente poner fronteras",
    duration: "12 min",
    category: "limits",
    isFree: false,
  },
  {
    id: "4",
    title: "Claridad antes de dormir",
    description: "Libera el día y prepara un descanso reparador",
    duration: "15 min",
    category: "clarity",
    isFree: true,
  },
  {
    id: "5",
    title: "Grounding de emergencia",
    description: "Para momentos de mucha ansiedad",
    duration: "3 min",
    category: "calm",
    isFree: true,
  },
];

const Meditations = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredMeditations = meditations.filter(
    (m) => activeCategory === "all" || m.category === activeCategory
  );

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
              Meditaciones
            </h1>
            <p className="text-xs text-muted-foreground">
              Guiadas por Ernesto
            </p>
          </div>
          <Headphones className="w-8 h-8 text-primary" />
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Featured */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-primary p-6">
          <div className="relative z-10 space-y-3">
            <span className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wider">
              Recomendado para ti
            </span>
            <h3 className="text-xl font-display font-bold text-primary-foreground">
              Calma antes de una conversación difícil
            </h3>
            <p className="text-sm text-primary-foreground/70">
              7 min • Prepárate mentalmente
            </p>
            <Button variant="glass" size="sm" className="mt-2">
              <Play className="w-4 h-4 fill-current" />
              <span>Reproducir</span>
            </Button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 animate-pulse-soft" />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1.5 px-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Meditations List */}
        <div className="space-y-3">
          {filteredMeditations.map((meditation) => (
            <button
              key={meditation.id}
              className="w-full bg-card rounded-2xl p-4 shadow-soft flex items-center gap-4 text-left transition-all hover:shadow-medium"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-turquoise to-turquoise-light flex items-center justify-center flex-shrink-0">
                {meditation.isFree ? (
                  <Play className="w-6 h-6 text-white fill-current" />
                ) : (
                  <Lock className="w-5 h-5 text-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-semibold text-foreground truncate">
                    {meditation.title}
                  </h4>
                  {!meditation.isFree && (
                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-coral/10 text-coral rounded">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {meditation.description}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {meditation.duration}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                {meditation.isFavorite && (
                  <Heart className="w-4 h-4 text-coral fill-coral" />
                )}
                {!meditation.isFree && (
                  <Download className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      </main>

      <MobileNav />
      <SOSButton />
    </div>
  );
};

export default Meditations;
