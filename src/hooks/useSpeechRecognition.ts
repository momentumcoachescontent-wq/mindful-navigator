import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseSpeechRecognitionProps {
    onResult?: (text: string) => void;
    continuous?: boolean;
    language?: string;
}

export const useSpeechRecognition = ({
    onResult,
    continuous = true,        // FIX: default true — keeps mic open on mobile
    language = 'es-ES'
}: UseSpeechRecognitionProps = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    const recognitionRef = useRef<any>(null);
    // FIX: memoize onResult in a ref so we don't re-create the SpeechRecognition
    // object on every render when the consumer passes an inline function
    const onResultRef = useRef(onResult);
    useEffect(() => { onResultRef.current = onResult; }, [onResult]);

    // FIX: track desired listening state separately from the API state
    // so we can auto-restart when Android/iOS kills the stream unexpectedly
    const shouldListenRef = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        setIsSupported(true);

        const recognition = new SpeechRecognition();
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.lang = language;
        // FIX: set maxAlternatives for better accuracy on mobile
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onend = () => {
            // FIX: auto-restart if we still want to listen (mobile closes stream early)
            if (shouldListenRef.current) {
                try {
                    recognition.start();
                } catch {
                    // already started or permission gone — give up
                    shouldListenRef.current = false;
                    setIsListening(false);
                }
            } else {
                setIsListening(false);
            }
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const currentText = finalTranscript || interimTranscript;
            if (currentText) setTranscript(currentText);

            if (finalTranscript && onResultRef.current) {
                onResultRef.current(finalTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setError(event.error);

            if (event.error === 'not-allowed') {
                shouldListenRef.current = false;
                setIsListening(false);
                toast.error('Permiso de micrófono denegado. Habilítalo en la configuración del navegador.');
            } else if (event.error === 'no-speech') {
                // no-speech is normal on mobile — the onend handler will restart
            } else if (event.error === 'network') {
                toast.error('Sin conexión para reconocimiento de voz');
                shouldListenRef.current = false;
                setIsListening(false);
            } else {
                // For other errors don't stop — let onend restart
                console.warn('Speech error (non-fatal):', event.error);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            shouldListenRef.current = false;
            try { recognition.stop(); } catch { /* ignore */ }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [continuous, language]); // onResult intentionally excluded — handled via ref

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            toast.error('Tu navegador no soporta reconocimiento de voz');
            return;
        }
        if (isListening) return;

        try {
            setTranscript('');
            setError(null);
            shouldListenRef.current = true;
            recognitionRef.current.start();
        } catch (err) {
            console.error('Error starting recognition:', err);
            shouldListenRef.current = false;
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        shouldListenRef.current = false;
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { /* ignore */ }
        }
        setIsListening(false);
    }, []);

    return {
        isListening,
        transcript,
        error,
        isSupported,
        startListening,
        stopListening,
        hasRecognitionSupport: isSupported
    };
};
