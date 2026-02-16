import { cn } from "@/lib/utils";

interface XPBarProps {
    currentXP: number;
    level: number;
    className?: string;
}

export const XPBar = ({ currentXP, level, className }: XPBarProps) => {
    // Calculate thresholds based on the formula: Level = floor(sqrt(XP) / 10) + 1
    // Inverse: XP = ((Level - 1) * 10)^2

    const currentLevelBaseXP = Math.pow((level - 1) * 10, 2);
    const nextLevelBaseXP = Math.pow((level) * 10, 2);

    const xpInCurrentLevel = currentXP - currentLevelBaseXP;
    const xpRequiredForNextLevel = nextLevelBaseXP - currentLevelBaseXP;

    const progress = Math.min(100, Math.max(0, (xpInCurrentLevel / xpRequiredForNextLevel) * 100));

    return (
        <div className={cn("w-full space-y-1.5", className)}>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>XP {currentXP}</span>
                <span>Sif. Nivel: {nextLevelBaseXP - currentXP} XP</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};
