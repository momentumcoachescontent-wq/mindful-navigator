import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface MicrophoneButtonProps {
    onTextReceived: (text: string) => void;
    className?: string;
    size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "calm";
    placeholder?: string; // Optional: text to show when listening
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
        transcript
    } = useSpeechRecognition({
        onResult: (text) => {
            // We pass the final text to the parent
            onTextReceived(text);
        }
    });

    // Optional: pass interim results if needed via another prop, 
    // but for now we just handle final result in onResult.

    if (!isSupported) return null;

    return (
        <Button
            type="button"
            variant={isListening ? "destructive" : variant} // Red when listening
            size={size}
            onClick={isListening ? stopListening : startListening}
            className={cn(
                "transition-all duration-300",
                isListening && "animate-pulse ring-2 ring-destructive/30",
                className
            )}
            title={isListening ? "Detener dictado" : "Iniciar dictado"}
        >
            {isListening ? (
                <span className="flex items-center gap-2">
                    <MicOff className="w-4 h-4" />
                    {placeholder && <span className="text-xs animate-pulse">Escuchando...</span>}
                </span>
            ) : (
                <Mic className="w-4 h-4" />
            )}
        </Button>
    );
};
