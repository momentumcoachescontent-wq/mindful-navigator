import { ChevronRight, Lock, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: "turquoise" | "coral" | "secondary";
  onClick: () => void;
  isPremium?: boolean;
  isLocked?: boolean;
}

const colorStyles = {
  turquoise: "from-turquoise to-turquoise-light",
  coral: "from-coral to-coral-light",
  secondary: "from-secondary to-deep-blue-light",
};

export function ToolCard({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  isPremium = false,
  isLocked = false
}: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full bg-card brutal-card border-2 border-[hsl(var(--turquoise)_/_1)] shadow-[4px_4px_0px_0px_hsl(var(--primary))] p-4 text-left transition-transform duration-200 hover:-translate-y-1 active:scale-95 group mb-1",
        isLocked && "opacity-75"
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-14 h-14 rounded-none border-2 border-current shadow-[2px_2px_0px_0px_currentColor] bg-gradient-to-br flex items-center justify-center flex-shrink-0 relative",
            colorStyles[color]
          )}
        >
          <Icon className="w-7 h-7 text-white" />
          {isLocked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-semibold text-foreground truncate">
              {title}
            </h4>
            {isPremium ? (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-transparent shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                ⭐ Premium
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 text-white border-2 border-transparent shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                Gratis
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
}
