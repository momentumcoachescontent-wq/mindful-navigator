import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface ProductCardProps {
    title: string;
    description: string;
    price: string;
    image?: string;
    ctaText: string;
    ctaLink: string;
    tag?: string;
    onAdd?: () => void;
}

export function ProductCard({
    title,
    description,
    price,
    image,
    ctaText,
    ctaLink,
    tag,
    onAdd
}: ProductCardProps) {
    return (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 flex flex-col h-full group">
            {image && (
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {tag && (
                        <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            {tag}
                        </div>
                    )}
                </div>
            )}

            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display font-semibold text-lg text-foreground leading-tight">
                        {title}
                    </h3>
                    <p className="font-display font-medium text-primary shrink-0 ml-2">
                        {price}
                    </p>
                </div>

                <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">
                    {description}
                </p>

                <Button
                    onClick={() => onAdd ? onAdd() : window.open(ctaLink, '_blank')}
                    className="w-full gap-2 group/btn"
                    variant="outline"
                >
                    {ctaText}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
            </div>
        </div>
    );
}
