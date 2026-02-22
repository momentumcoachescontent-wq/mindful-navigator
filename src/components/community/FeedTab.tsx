import { Users, MessageCircle, Heart, Shield, ExternalLink, Sparkles, BookOpen, Trophy, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISCORD_INVITE = "https://discord.gg/DmDZbNGX";

const communityBenefits = [
  {
    icon: Shield,
    title: "Espacio Seguro",
    description: "Comunidad moderada con reglas de respeto y confidencialidad."
  },
  {
    icon: MessageCircle,
    title: "Apoyo en Tiempo Real",
    description: "Conecta con personas que entienden tu proceso de transformación."
  },
  {
    icon: BookOpen,
    title: "Discusión del Libro",
    description: "Canal dedicado a 'Más allá del Miedo' con ejercicios grupales."
  },
  {
    icon: Mic,
    title: "Sesiones en Vivo",
    description: "Participa en sesiones de coaching grupal y Q&A."
  },
];

const discordChannels = [
  { name: "🔥 victorias-del-día", description: "Comparte tus logros diarios" },
  { name: "💬 pide-consejo", description: "La comunidad te apoya" },
  { name: "📖 más-allá-del-miedo", description: "Discusión del libro" },
  { name: "🛡️ herramientas", description: "Tips del Escáner, Simulador y más" },
  { name: "🏆 retos-semanales", description: "Desafíos para crecer juntos" },
  { name: "🎧 sesiones-en-vivo", description: "Coaching grupal y Q&A" },
];

export function FeedTab() {
  const openDiscord = () => window.open(DISCORD_INVITE, "_blank");

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5865F2] via-[#4752C4] to-[#3C45A5] p-6 text-white space-y-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold">Círculo de Empoderamiento</h3>
              <p className="text-white/70 text-sm">Comunidad en Discord</p>
            </div>
          </div>

          <p className="text-white/80 text-sm leading-relaxed mb-4">
            Únete a personas reales que están transformando su miedo en poder.
            Comparte victorias, pide consejo y crece con nosotros.
          </p>

          <Button
            onClick={openDiscord}
            className="w-full bg-white text-[#5865F2] hover:bg-white/90 font-bold text-base py-5 shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Unirse al Círculo en Discord
          </Button>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-2 gap-3">
        {communityBenefits.map((benefit, i) => {
          const Icon = benefit.icon;
          return (
            <div key={i} className="bg-card rounded-xl p-4 border border-border/50 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold text-sm text-foreground">{benefit.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
            </div>
          );
        })}
      </div>

      {/* Channels Preview */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Canales del Círculo
          </h4>
          <span className="text-xs text-muted-foreground">Vista previa</span>
        </div>
        <div className="divide-y divide-border/30">
          {discordChannels.map((channel, i) => (
            <button
              key={i}
              onClick={openDiscord}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{channel.name}</p>
                <p className="text-xs text-muted-foreground">{channel.description}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center space-y-2 py-4">
        <p className="text-sm text-muted-foreground">
          ¿Ya eres parte del Círculo? Accede directamente:
        </p>
        <Button variant="outline" onClick={openDiscord} className="gap-2">
          <ExternalLink className="w-4 h-4" />
          Abrir Discord
        </Button>
      </div>
    </div>
  );
}

