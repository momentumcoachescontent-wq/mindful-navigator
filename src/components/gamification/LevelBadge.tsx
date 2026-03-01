import { Trophy, Star, Shield, Crown, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVELS } from "@/lib/daily-challenge-config";

interface LevelBadgeProps {
    levelName: string;
    className?: string;
    showLabel?: boolean;
}

export const LevelBadge = ({ levelName, className, showLabel = true }: LevelBadgeProps) => {
    const levelIndex = Math.max(0, LEVELS.findIndex(l => l.name === levelName));
    const levelData = LEVELS[levelIndex] || LEVELS[0];
    const levelNum = levelIndex + 1;

    // Determine badge color and icon based on levelName
    const getBadgeStyle = (name: string) => {
        if (name === 'mentor') return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Crown };
        if (name === 'strategist') return { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Target };
        if (name === 'guardian') return { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Shield };
        if (name === 'regulator') return { color: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/20", icon: Zap };
        if (name === 'observer') return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Star };
        return { color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Star }; // explorer
    };

    const style = getBadgeStyle(levelData.name);
    const Icon = style.icon;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn("relative flex items-center justify-center w-12 h-12 rounded-full border-2", style.bg, style.border)}>
                <Icon className={cn("w-6 h-6", style.color)} />
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full border border-border px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
                    Lv.{levelNum}
                </div>
            </div>
            {showLabel && (
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Nivel {levelNum}</span>
                    <span className={cn("text-sm font-bold", style.color)}>
                        {levelData.label}
                    </span>
                </div>
            )}
        </div>
    );
};
