import { Users, MessageCircle, Heart, Share2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const mockPosts = [
  {
    id: "1",
    author: "Valiente2024",
    timeAgo: "2h",
    content: "Hoy puse mi primer límite con mi jefe. Usé el script 'Entiendo tu urgencia, pero necesito respetar mi hora de salida.' ¡Funcionó!",
    likes: 24,
    comments: 8,
    isVictory: true,
  },
  {
    id: "2",
    author: "CaminandoFuerte",
    timeAgo: "5h",
    content: "¿Alguien tiene consejos para mantener la calma cuando alguien usa el tratamiento silencioso? Me cuesta mucho no ceder.",
    likes: 15,
    comments: 12,
  },
  {
    id: "3",
    author: "NuevoCapitulo",
    timeAgo: "1d",
    content: "Llevo 30 días usando la técnica C.A.L.M. y noto una diferencia enorme en cómo respondo a situaciones estresantes. ¡Gracias comunidad!",
    likes: 67,
    comments: 23,
    isVictory: true,
  },
];

export function FeedTab() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Community Guidelines */}
      <div className="bg-turquoise-soft rounded-2xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-secondary font-medium">Espacio seguro</p>
          <p className="text-xs text-secondary/70 mt-0.5">
            Aquí nos apoyamos con respeto. Comparte victorias, preguntas y aprendizajes.
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {mockPosts.map((post) => (
          <article
            key={post.id}
            className="bg-card brutal-card border-l-4 border-l-primary p-5 space-y-4 transition-transform hover:translate-x-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center border-2 border-primary-foreground shadow-[2px_2px_0px_0px_currentColor]">
                  <span className="text-sm font-medium text-white">
                    {post.author[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {post.author}
                  </p>
                  <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
                </div>
              </div>
              {post.isVictory && (
                <span className="px-2.5 py-1 text-xs font-medium bg-coral/10 text-coral rounded-full">
                  🏆 Victoria
                </span>
              )}
            </div>

            <p className="text-foreground text-sm leading-relaxed">
              {post.content}
            </p>

            <div className="flex items-center gap-4 pt-4 border-t-2 border-border/50">
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-coral transition-transform active:scale-90 hover:scale-110">
                <Heart className="w-5 h-5" />
                <span className="text-xs font-bold">{post.likes}</span>
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-transform active:scale-90 hover:scale-110">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-bold">{post.comments}</span>
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-transform active:scale-90 hover:scale-110 ml-auto">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Premium CTA for full access */}
      <div className="bg-gradient-to-br from-secondary to-primary rounded-2xl p-6 text-center space-y-3">
        <h3 className="text-lg font-display font-semibold text-primary-foreground">
          Únete a la conversación
        </h3>
        <p className="text-sm text-primary-foreground/70">
          Con Premium puedes publicar, comentar y conectar con la comunidad.
        </p>
        <Button variant="glass" onClick={() => navigate("/premium")}>
          Desbloquear Premium
        </Button>
      </div>
    </div>
  );
}
