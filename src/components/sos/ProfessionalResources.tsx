import { useState, useEffect } from "react";
import { ArrowLeft, Phone, Globe, MessageCircle, Heart, AlertTriangle, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface ProfessionalResourcesProps {
  onBack: () => void;
  onClose: () => void;
}

interface ResourceItem {
  id: string;
  category: string;
  name: string;
  description: string | null;
  phone: string | null;
  url: string | null;
  country: string | null;
}

interface CategoryGroup {
  category: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  items: ResourceItem[];
}

const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  "Líneas de Crisis 24/7": {
    icon: Phone,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  "Violencia de Género": {
    icon: Heart,
    color: "text-coral",
    bgColor: "bg-coral/10",
  },
  "Recursos en Línea": {
    icon: Globe,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  // Default fallback
  "default": {
    icon: MessageCircle,
    color: "text-primary",
    bgColor: "bg-primary/10",
  }
};

const tips = [
  "Hablar de lo que sientes no es debilidad, es valentía.",
  "Buscar ayuda profesional es un acto de amor propio.",
  "No tienes que enfrentar esto solo/a.",
  "Los profesionales están capacitados para ayudarte sin juzgarte.",
];

export function ProfessionalResources({ onBack, onClose }: ProfessionalResourcesProps) {
  const [resources, setResources] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      // Hardcoded resources since sos_resources table doesn't exist yet
      const hardcodedResources: ResourceItem[] = [
        { id: "1", category: "Líneas de Crisis 24/7", name: "Línea de la Vida", description: "Atención 24 horas para personas en crisis emocional", phone: "800 911 2000", url: null, country: "México" },
        { id: "2", category: "Líneas de Crisis 24/7", name: "Teléfono de la Esperanza", description: "Línea de atención emocional 24/7", phone: "717 003 717", url: null, country: "España" },
        { id: "3", category: "Violencia de Género", name: "Línea Nacional contra la Violencia", description: "Asesoría jurídica y psicológica 24/7", phone: "800 108 4053", url: null, country: "México" },
        { id: "4", category: "Violencia de Género", name: "016 - Violencia de Género", description: "Información y asesoramiento jurídico", phone: "016", url: null, country: "España" },
        { id: "5", category: "Recursos en Línea", name: "Crisis Text Line", description: "Envía un mensaje para hablar con un consejero", phone: null, url: "https://www.crisistextline.org", country: null },
      ];

      const groups: Record<string, ResourceItem[]> = {};
      const categoryOrder: string[] = [];

      hardcodedResources.forEach((item) => {
        if (!groups[item.category]) {
          groups[item.category] = [];
          categoryOrder.push(item.category);
        }
        groups[item.category].push(item);
      });

      const displayData: CategoryGroup[] = categoryOrder.map(catName => {
        const config = CATEGORY_CONFIG[catName] || CATEGORY_CONFIG["default"];
        return {
          category: catName,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor,
          items: groups[catName]
        };
      });

      setResources(displayData);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-display font-semibold text-foreground">
              Recursos de Ayuda Profesional
            </h1>
            <p className="text-xs text-muted-foreground">
              Líneas de apoyo y servicios disponibles
            </p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-24">
          {/* Emergency Banner */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive mb-1">
                ¿Es una emergencia?
              </p>
              <p className="text-muted-foreground">
                Si tú o alguien está en peligro inmediato, llama al número de emergencias de tu país (911, 112, etc.)
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Resources by Category */}
          {!loading && resources.map((category) => (
            <section key={category.category} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${category.bgColor} flex items-center justify-center`}>
                  <category.icon className={`w-4 h-4 ${category.color}`} />
                </div>
                <h2 className="font-display font-semibold text-foreground">
                  {category.category}
                </h2>
              </div>

              <div className="space-y-2">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card border border-border rounded-xl p-4 space-y-2"
                  >
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>

                    {item.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center gap-2 mt-2"
                        asChild
                      >
                        <a href={`tel:${item.phone.replace(/\s/g, "")}`}>
                          <Phone className="w-4 h-4" />
                          {item.phone}
                        </a>
                      </Button>
                    )}

                    {item.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center gap-2 mt-2"
                        asChild
                      >
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-4 h-4" />
                          Visitar sitio web
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {!loading && resources.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No se encontraron recursos disponibles en este momento.</p>
            </div>
          )}

          {/* Tips Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-turquoise/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-turquoise" />
              </div>
              <h2 className="font-display font-semibold text-foreground">
                Recuerda
              </h2>
            </div>

            <div className="bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl p-4 space-y-3">
              {tips.map((tip, index) => (
                <p key={index} className="text-sm text-foreground flex gap-2">
                  <span className="text-primary">✦</span>
                  {tip}
                </p>
              ))}
            </div>
          </section>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center px-4">
            Esta información es orientativa. Los servicios pueden variar según tu ubicación.
            Esta app es un apoyo, no reemplaza ayuda profesional.
          </p>
        </div>
      </ScrollArea>

      {/* Bottom Action */}
      <div className="sticky bottom-0 p-4 bg-background border-t border-border">
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
