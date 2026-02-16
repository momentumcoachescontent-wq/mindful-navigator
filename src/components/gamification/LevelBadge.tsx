import { Trophy, Star, Shield, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
    level: number;
    className?: string;
    showLabel?: boolean;
}

export const LevelBadge = ({ level, className, showLabel = true }: LevelBadgeProps) => {
    // Determine badge color and icon based on level tier
    const getBadgeStyle = (lvl: number) => {
        if (lvl >= 50) return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Crown }; // Legado
        if (lvl >= 30) return { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Trophy }; // Maestro
        if (lvl >= 10) return { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Shield }; // Guardián
        return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Star }; // Explorador
    };

    const style = getBadgeStyle(level);
    const Icon = style.icon;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn("relative flex items-center justify-center w-12 h-12 rounded-full border-2", style.bg, style.border)}>
                <Icon className={cn("w-6 h-6", style.color)} />
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full border border-border px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
                    Lv.{level}
                </div>
            </div>
            {showLabel && (
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Nivel {level}</span>
                    <span className={cn("text-sm font-bold", style.color)}>
                        {level >= 50 ? "Legado" : level >= 30 ? "Maestro" : level >= 10 ? "Guardián" : "Explorador"}
                    </span>
                </div>
            )}
        </div>
    );
};
