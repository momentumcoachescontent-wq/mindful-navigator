import { ArrowLeft, Phone, Globe, MessageCircle, Heart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProfessionalResourcesProps {
  onBack: () => void;
  onClose: () => void;
}

const resources = [
  {
    category: "Líneas de Crisis 24/7",
    icon: Phone,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    items: [
      {
        name: "Línea de la Vida (México)",
        phone: "800 911 2000",
        description: "Atención gratuita las 24 horas",
      },
      {
        name: "SAPTEL (México)",
        phone: "55 5259 8121",
        description: "Apoyo emocional y prevención del suicidio",
      },
      {
        name: "Teléfono de la Esperanza (España)",
        phone: "717 003 717",
        description: "Línea de atención a la conducta suicida",
      },
      {
        name: "Centro de Asistencia al Suicida (Argentina)",
        phone: "135",
        description: "Atención gratuita las 24 horas",
      },
    ],
  },
  {
    category: "Violencia de Género",
    icon: Heart,
    color: "text-coral",
    bgColor: "bg-coral/10",
    items: [
      {
        name: "Línea Mujeres (México)",
        phone: "800 108 4053",
        description: "Atención a víctimas de violencia",
      },
      {
        name: "016 (España)",
        phone: "016",
        description: "Violencia de género - No deja rastro en la factura",
      },
      {
        name: "Línea 144 (Argentina)",
        phone: "144",
        description: "Atención a víctimas de violencia de género",
      },
    ],
  },
  {
    category: "Recursos en Línea",
    icon: Globe,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    items: [
      {
        name: "OMS - Salud Mental",
        url: "https://www.who.int/es/health-topics/mental-health",
        description: "Recursos y guías de la Organización Mundial de la Salud",
      },
      {
        name: "IASP - Prevención del Suicidio",
        url: "https://www.iasp.info/resources/Crisis_Centres/",
        description: "Directorio internacional de centros de crisis",
      },
    ],
  },
];

const tips = [
  "Hablar de lo que sientes no es debilidad, es valentía.",
  "Buscar ayuda profesional es un acto de amor propio.",
  "No tienes que enfrentar esto solo/a.",
  "Los profesionales están capacitados para ayudarte sin juzgarte.",
];

export function ProfessionalResources({ onBack, onClose }: ProfessionalResourcesProps) {
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

          {/* Resources by Category */}
          {resources.map((category) => (
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
                {category.items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-card border border-border rounded-xl p-4 space-y-2"
                  >
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                    
                    {"phone" in item && item.phone && (
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
                    
                    {"url" in item && item.url && (
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
