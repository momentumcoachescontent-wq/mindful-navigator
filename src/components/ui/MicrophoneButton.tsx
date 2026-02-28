import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';

interface MicrophoneButtonProps {
    onTextReceived: (text: string) => void;
    className?: string;
    size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "calm";
    placeholder?: string;
}

export const MicrophoneButton = ({
    onTextReceived,
    className,
    size = "icon",
    variant = "ghost",
    placeholder
}: MicrophoneButtonProps) => {
    const {
        isListening,
        isSupported,
        startListening,
        stopListening,
    } = useSpeechRecognition({
        onResult: (text) => {
            onTextReceived(text);
        },
        continuous: true,
    });

    if (!isSupported) return null;

    /**
     * Push-to-talk behavior:
     * - onPointerDown → start listening (works for mouse & touch)
     * - onPointerUp / onPointerLeave → stop listening
     *   onPointerLeave covers the case where the user drags finger off the button
     */
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault(); // prevent focus/blur stealing on mobile
        startListening();
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.preventDefault();
        stopListening();
    };

    return (
        <Button
            type="button"
            variant={isListening ? "destructive" : variant}
            size={size}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={cn(
                "transition-all duration-200 touch-none select-none",
                isListening && "animate-pulse ring-2 ring-destructive/40 scale-110",
                className
            )}
            title={isListening ? "Suelta para detener" : "Mantén presionado para hablar"}
        >
            {isListening ? (
                <span className="flex items-center gap-2">
                    <MicOff className="w-4 h-4" />
                    {placeholder && <span className="text-xs">Escuchando...</span>}
                </span>
            ) : (
                <Mic className="w-4 h-4" />
            )}
        </Button>
    );
};
