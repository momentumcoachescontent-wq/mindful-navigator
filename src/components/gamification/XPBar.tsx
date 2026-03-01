import { cn } from "@/lib/utils";
import { LEVELS } from "@/lib/daily-challenge-config";

interface XPBarProps {
    currentXP: number;
    levelName: string;
    className?: string;
}

export const XPBar = ({ currentXP, levelName, className }: XPBarProps) => {
    const levelIndex = Math.max(0, LEVELS.findIndex(l => l.name === levelName));
    const levelData = LEVELS[levelIndex] || LEVELS[0];

    let xpInCurrentLevel = 0;
    let xpRequiredForNextLevel = 1;
    let nextLevelBaseXP = 0;

    if (levelData.maxXP === Infinity) {
        xpInCurrentLevel = currentXP - levelData.minXP;
        xpRequiredForNextLevel = 1000; // Arbitrary for infinite level
        nextLevelBaseXP = levelData.minXP;
    } else {
        xpInCurrentLevel = currentXP - levelData.minXP;
        xpRequiredForNextLevel = levelData.maxXP - levelData.minXP + 1;
        nextLevelBaseXP = levelData.maxXP + 1;
    }

    const progress = levelData.maxXP === Infinity ? 100 : Math.min(100, Math.max(0, (xpInCurrentLevel / xpRequiredForNextLevel) * 100));
    const nextLimitStr = levelData.maxXP === Infinity ? "MAX" : `${nextLevelBaseXP - currentXP} XP`;

    return (
        <div className={cn("w-full space-y-1.5", className)}>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>XP {currentXP}</span>
                <span>Sif. Nivel: {nextLimitStr}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                    className={cn(
                        "h-full bg-gradient-to-r transition-all duration-500 ease-out",
                        levelData.maxXP === Infinity ? "from-amber-400 to-yellow-500" : "from-emerald-500 to-teal-400"
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};
