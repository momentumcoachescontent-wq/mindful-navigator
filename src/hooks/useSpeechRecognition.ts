import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseSpeechRecognitionProps {
    onResult?: (text: string) => void;
    // continuous is intentionally NOT exposed — push-to-talk always uses false.
    // If a caller needs streaming continuous mode, they can fork the hook.
    language?: string;
}

export const useSpeechRecognition = ({
    onResult,
    language = 'es-ES',
}: UseSpeechRecognitionProps = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Keep latest onResult in a ref so the recognition handler is never stale
    const onResultRef = useRef(onResult);
    useEffect(() => { onResultRef.current = onResult; }, [onResult]);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        // @ts-ignore
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        setIsSupported(true);

        const rec = new SR();
        rec.lang = language;
        rec.continuous = false;        // push-to-talk: one session per press
        rec.interimResults = true;     // show live text while speaking
        rec.maxAlternatives = 1;

        rec.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        rec.onend = () => {
            setIsListening(false);
            // No auto-restart: push-to-talk ends when user releases
        };

        rec.onresult = (event: any) => {
            // Accumulate only from the CURRENT session (not previous ones)
            let finalText = '';
            let interimText = '';
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalText += result[0].transcript;
                } else {
                    interimText += result[0].transcript;
                }
            }

            const display = finalText || interimText;
            setTranscript(display);

            if (finalText && onResultRef.current) {
                onResultRef.current(finalText.trim());
            }
        };

        rec.onerror = (event: any) => {
            setIsListening(false);
            setError(event.error);

            if (event.error === 'not-allowed') {
                toast.error('Permiso de micrófono denegado. Habilítalo en la configuración del navegador.');
            } else if (event.error === 'network') {
                toast.error('Sin conexión para reconocimiento de voz');
            }
            // no-speech and aborted are silent — normal when user releases quickly
        };

        recognitionRef.current = rec;

        return () => {
            try { rec.abort(); } catch { /* ignore */ }
        };
    }, [language]);

    /** Start a fresh recognition session. Clears previous transcript. */
    const startListening = useCallback(() => {
        const rec = recognitionRef.current;
        if (!rec) {
            toast.error('Tu navegador no soporta reconocimiento de voz');
            return;
        }
        // Abort any running session cleanly before starting a new one
        try { rec.abort(); } catch { /* ignore */ }

        setTranscript('');   // ← key: wipe previous session text
        setError(null);

        // Small timeout so abort() has time to settle on some mobile browsers
        setTimeout(() => {
            try { rec.start(); } catch (err) {
                console.warn('start() failed:', err);
            }
        }, 80);
    }, []);

    /** Stop the current recognition session. */
    const stopListening = useCallback(() => {
        const rec = recognitionRef.current;
        if (!rec) return;
        try { rec.stop(); } catch { /* ignore */ }
        setIsListening(false);
    }, []);

    return {
        isListening,
        transcript,
        error,
        isSupported,
        hasRecognitionSupport: isSupported,
        startListening,
        stopListening,
    };
};
