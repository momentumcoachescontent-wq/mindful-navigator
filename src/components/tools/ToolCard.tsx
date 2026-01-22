import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: "turquoise" | "coral" | "secondary";
  onClick: () => void;
  isPremium?: boolean;
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
  isPremium = false 
}: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-2xl p-4 shadow-soft text-left transition-all duration-300 hover:shadow-medium hover:scale-[1.01] active:scale-[0.99] group"
    >
      <div className="flex items-center gap-4">
        <div 
          className={cn(
            "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
            colorStyles[color]
          )}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-semibold text-foreground truncate">
              {title}
            </h4>
            {isPremium && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-coral/10 text-coral rounded-full">
                Premium
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
