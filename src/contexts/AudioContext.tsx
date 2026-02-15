
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AudioTrack, AudioState } from '@/types/audio';
import { toast } from 'sonner';

interface AudioContextType extends AudioState {
    play: (track: AudioTrack) => void;
    pause: () => void;
    resume: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    toggleExpand: () => void;
    closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(1);
    const [isExpanded, setIsExpanded] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio element
        audioRef.current = new Audio();
        audioRef.current.preload = 'metadata';

        const audio = audioRef.current;

        const handleTimeUpdate = () => {
            setProgress(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        const handleError = () => {
            setIsPlaying(false);
            toast.error("Error al reproducir el audio.");
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.pause();
        };
    }, []);

    const play = (track: AudioTrack) => {
        if (!audioRef.current) return;

        // Check if same track
        if (currentTrack?.id === track.id) {
            resume();
            return;
        }

        setCurrentTrack(track);
        audioRef.current.src = track.audio_url;
        audioRef.current.load();

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    setIsPlaying(true);
                })
                .catch(error => {
                    console.error("Playback failed:", error);
                    setIsPlaying(false);
                    toast.error("No se pudo reproducir este audio.");
                });
        }
    };

    const pause = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const resume = () => {
        if (audioRef.current && currentTrack) {
            audioRef.current.play().catch(console.error);
            setIsPlaying(true);
        }
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };

    const setVolume = (val: number) => {
        if (audioRef.current) {
            // Clamp between 0 and 1
            const safeVal = Math.max(0, Math.min(1, val));
            audioRef.current.volume = safeVal;
            setVolumeState(safeVal);
        }
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const closePlayer = () => {
        pause();
        setCurrentTrack(null);
        setIsExpanded(false);
    };

    return (
        <AudioContext.Provider value={{
            currentTrack,
            isPlaying,
            progress,
            duration,
            volume,
            isExpanded,
            play,
            pause,
            resume,
            seek,
            setVolume,
            toggleExpand,
            closePlayer
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
