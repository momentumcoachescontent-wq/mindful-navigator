import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseSpeechRecognitionProps {
    onResult?: (text: string) => void;
    continuous?: boolean;
    language?: string;
}

export const useSpeechRecognition = ({
    onResult,
    continuous = false,
    language = 'es-ES'
}: UseSpeechRecognitionProps = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                setIsSupported(true);
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = continuous;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = language;

                recognitionRef.current.onstart = () => {
                    setIsListening(true);
                    setError(null);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current.onresult = (event: any) => {
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
                    setTranscript(currentText);

                    if (finalTranscript && onResult) {
                        onResult(finalTranscript);
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setError(event.error);
                    setIsListening(false);

                    if (event.error === 'not-allowed') {
                        toast.error('Permiso de micrófono denegado');
                    } else if (event.error === 'no-speech') {
                        // Ignore no-speech errors usually
                    } else {
                        toast.error('Error en reconocimiento de voz');
                    }
                };
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [continuous, language, onResult]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                setTranscript('');
                recognitionRef.current.start();
            } catch (err) {
                console.error('Error starting recognition:', err);
            }
        } else if (!isSupported) {
            toast.error('Tu navegador no soporta reconocimiento de voz');
        }
    }, [isListening, isSupported]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

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
