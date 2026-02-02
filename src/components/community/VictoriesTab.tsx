import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trophy, Heart, Flame, Lock } from "lucide-react";
import { Loader2 } from "lucide-react";

export function VictoriesTab() {
  const { user } = useAuth();

  const { data: victories, isLoading } = useQuery({
    queryKey: ["communityVictories"],
    queryFn: async () => {
      // Fetch recent public victories from all users
      // RLS policy ensures we only see is_public=true OR our own
      const { data, error } = await supabase
        .from("daily_victories")
        .select("id, victory_text, victory_date, created_at, xp_bonus, is_public")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!victories || victories.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">
          Aún no hay victorias compartidas
        </p>
        <p className="text-sm text-muted-foreground">
          ¡Sé el primero en compartir tu victoria!
        </p>
        <div className="mt-4 p-4 bg-muted/50 rounded-xl mx-auto max-w-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Las victorias son privadas por defecto</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Puedes elegir compartir tus victorias al crearlas para inspirar a otros en la comunidad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-sm text-primary font-medium">
          🏆 Muro de Victorias
        </p>
        <p className="text-xs text-muted-foreground">
          Celebramos cada paso hacia tu bienestar
        </p>
      </div>

      {victories.map((victory, index) => (
        <VictoryCard key={victory.id} victory={victory} index={index} />
      ))}
    </div>
  );
}

interface VictoryCardProps {
  victory: {
    id: string;
    victory_text: string;
    victory_date: string;
    created_at: string;
    xp_bonus?: number | null;
    is_public?: boolean;
  };
  index: number;
}

function VictoryCard({ victory, index }: VictoryCardProps) {
  // Generate consistent anonymous alias from victory id (deterministic)
  const hashCode = victory.id.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const aliasNumber = Math.abs(hashCode % 1000);
  const alias = `Valiente${aliasNumber}`;
  
  const avatarGradients = [
    "from-coral to-coral-light",
    "from-primary to-turquoise-light",
    "from-secondary to-primary",
    "from-turquoise to-turquoise-light",
  ];
  const gradientIndex = Math.abs(hashCode % avatarGradients.length);
  const gradient = avatarGradients[gradientIndex];

  return (
    <article className="bg-card rounded-2xl p-5 shadow-soft space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-sm font-medium text-white">
              V
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">
              {alias}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(victory.created_at), "d MMM, HH:mm", { locale: es })}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-medium bg-coral/10 text-coral rounded-full flex items-center gap-1">
          <Trophy className="w-3 h-3" />
          Victoria
        </span>
      </div>

      <p className="text-foreground text-sm leading-relaxed">
        {victory.victory_text}
      </p>

      {victory.xp_bonus && victory.xp_bonus > 0 && (
        <div className="flex items-center gap-1 text-xs text-primary">
          <Flame className="w-3 h-3" />
          +{victory.xp_bonus} XP bonus
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-coral transition-colors">
          <Heart className="w-4 h-4" />
          <span className="text-xs">Apoyar</span>
        </button>
      </div>
    </article>
  );
}
