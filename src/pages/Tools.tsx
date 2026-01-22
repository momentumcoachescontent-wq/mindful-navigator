import { useState } from "react";
import { ArrowLeft, Search, Shield, Heart, MessageSquare, Zap, Brain, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { ToolCard } from "@/components/tools/ToolCard";

const categories = [
  { id: "all", label: "Todos" },
  { id: "protection", label: "Protección" },
  { id: "communication", label: "Comunicación" },
  { id: "emotions", label: "Emociones" },
];

const tools = [
  {
    id: "hero",
    title: "H.E.R.O. Framework",
    description: "Reconoce patrones de manipulación: Humillación, Exigencias, Rechazo, Órdenes",
    icon: Shield,
    color: "turquoise" as const,
    category: "protection",
  },
  {
    id: "calm",
    title: "C.A.L.M. Technique",
    description: "Regula tus emociones: Calma, Analiza, Libera, Muévete",
    icon: Brain,
    color: "coral" as const,
    category: "emotions",
  },
  {
    id: "limits-scripts",
    title: "Scripts de Límites",
    description: "Frases claras para establecer fronteras saludables",
    icon: MessageSquare,
    color: "secondary" as const,
    category: "communication",
  },
  {
    id: "sos-phrases",
    title: "Tarjetas SOS",
    description: "Qué decir, qué no decir, qué hacer en momentos difíciles",
    icon: Zap,
    color: "coral" as const,
    category: "protection",
    isPremium: true,
  },
  {
    id: "self-care",
    title: "Plan de Autocuidado",
    description: "Construye tu rutina de bienestar emocional personalizada",
    icon: Heart,
    color: "turquoise" as const,
    category: "emotions",
  },
  {
    id: "support-network",
    title: "Red de Apoyo",
    description: "Identifica y organiza tus contactos de confianza",
    icon: Users,
    color: "secondary" as const,
    category: "communication",
  },
];

const Tools = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = tools.filter((tool) => {
    const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
              Biblioteca de Herramientas
            </h1>
          </div>
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar herramientas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-card rounded-xl border border-border focus:border-primary focus:ring-0 text-foreground placeholder:text-muted-foreground transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1.5 px-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="space-y-3">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              color={tool.color}
              isPremium={tool.isPremium}
              onClick={() => navigate(`/tools/${tool.id}`)}
            />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron herramientas</p>
          </div>
        )}
      </main>

      <MobileNav />
      <SOSButton />
    </div>
  );
};

export default Tools;
