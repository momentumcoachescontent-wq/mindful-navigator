import { useState, useEffect } from "react";
import { ArrowLeft, Search, Shield, Heart, MessageSquare, Zap, Brain, Users, Sparkles, Loader2, Lock, LucideIcon, Headphones } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SOSButton } from "@/components/layout/SOSButton";
import { ToolCard } from "@/components/tools/ToolCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const categories = [
  { id: "all", label: "Todos" },
  { id: "protection", label: "Protección" },
  { id: "communication", label: "Comunicación" },
  { id: "emotions", label: "Emociones" },
];

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Heart,
  MessageSquare,
  Zap,
  Brain,
  Users,
  Headphones,
};

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  is_premium: boolean;
}

const Tools = () => {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      const { data, error } = await supabase
        .from("tools")
        .select("id, title, description, icon, color, category, is_premium")
        .order("order_index");

      if (error) {
        console.error("Error fetching tools:", error);
      } else {
        setTools(data || []);
      }
      setIsLoading(false);
    };

    fetchTools();
  }, []);

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
            placeholder="Buscar artillería mental..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-card brutal-card focus:border-primary focus:ring-0 text-foreground placeholder:text-muted-foreground transition-all focus:translate-x-1"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1.5 px-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-none font-display font-bold uppercase tracking-wider text-xs whitespace-nowrap transition-transform active:scale-90 hover:scale-105 border-2 ${activeCategory === cat.id
                ? "bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_0px_currentColor]"
                : "bg-muted text-muted-foreground border-transparent hover:border-muted-foreground hover:text-foreground"
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Tools Grid */}
        {!isLoading && (
          <div className="space-y-3">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={iconMap[tool.icon] || Shield}
                color={tool.color as "turquoise" | "coral" | "secondary"}
                isPremium={tool.is_premium}
                isLocked={tool.is_premium && !isPremium}
                onClick={() => navigate(`/tools/${tool.id}`)}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredTools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron herramientas</p>
          </div>
        )}
      </main>

      <SOSButton />
    </div>
  );
};

export default Tools;
