import { Button } from "@/components/ui/button";
import { Check, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingTierProps {
    title: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    ctaText: string;
    ctaLink: string;
    isPopular?: boolean;
    savingsBadge?: string;
    onSelect?: () => void;
}

export function PricingTier({
    title,
    price,
    period,
    description,
    features,
    ctaText,
    ctaLink,
    isPopular,
    savingsBadge,
    onSelect
}: PricingTierProps) {
    return (
        <div className={cn(
            "relative bg-card rounded-3xl p-6 border-2 flex flex-col h-full transition-all duration-300",
            isPopular
                ? "border-primary shadow-elevated scale-105 z-10"
                : "border-border/50 shadow-soft hover:border-primary/30"
        )}>
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Más Popular
                </div>
            )}

            {savingsBadge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    {savingsBadge}
                </div>
            )}

            <div className="text-center mb-6 pt-2">
                <h3 className="text-lg font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {title}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-display font-bold text-foreground">{price}</span>
                    <span className="text-muted-foreground">/{period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 px-4">
                    {description}
                </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-success" />
                        </div>
                        {feature}
                    </li>
                ))}
            </ul>

            <Button
                onClick={() => onSelect ? onSelect() : window.open(ctaLink, '_blank')}
                variant={isPopular ? "default" : "outline"}
                className={cn(
                    "w-full h-12 text-base font-semibold",
                    isPopular && "shadow-lg shadow-primary/20"
                )}
            >
                {ctaText}
            </Button>
        </div>
    );
}
