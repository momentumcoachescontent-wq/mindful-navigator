import { Search, BookOpen, Headphones, PenLine, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    icon: Search,
    label: "Escáner",
    description: "Analiza una situación",
    path: "/scanner",
    gradient: "from-secondary to-primary",
  },
  {
    icon: PenLine,
    label: "Diario",
    description: "Escribe tu día",
    path: "/journal",
    gradient: "from-coral to-coral-light",
  },
  {
    icon: BookOpen,
    label: "Herramientas",
    description: "H.E.R.O., C.A.L.M.",
    path: "/tools",
    gradient: "from-turquoise to-turquoise-light",
  },
  {
    icon: Headphones,
    label: "Voz Interior",
    description: "Audio guiado",
    path: "/library",
    gradient: "from-deep-blue-light to-secondary",
  },
  {
    icon: Users,
    label: "Comunidad",
    description: "Victorias y conexiones",
    path: "/community",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Users,
    label: "C. Sombras",
    description: "Próximamente...",
    path: "#",
    gradient: "from-zinc-800 to-zinc-950",
    disabled: true,
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => (
        <button
          key={action.path}
          onClick={() => !action.disabled && navigate(action.path)}
          disabled={action.disabled}
          className={`group relative overflow-hidden brutal-card p-5 text-left ${action.disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {/* Gradient background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-90 group-hover:opacity-100 transition-opacity`}
          />

          {/* Content */}
          <div className="relative z-10 space-y-3">
            <div className={`w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center ${action.disabled ? 'grayscale' : ''}`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-white leading-tight">
                {action.label}
              </h4>
              <p className="text-[10px] text-white/70 mt-1">{action.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
