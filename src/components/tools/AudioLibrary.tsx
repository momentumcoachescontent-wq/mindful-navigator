import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Download, Heart, Clock, Zap, Flame, CloudRain, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

interface Emotion {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface Situation {
  id: string;
  label: string;
}

interface AudioLibraryProps {
  content: {
    emotions: Emotion[];
    situations: Situation[];
    has_offline: boolean;
    has_playlists: boolean;
  };
}

interface AudioTrack {
  id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  duration_seconds: number;
  category: string;
  narrator: string | null;
  thumbnail_url: string | null;
}

const emotionIcons: Record<string, typeof Zap> = {
  Zap: Zap,
  Heart: Heart,
  Flame: Flame,
  Brain: Brain,
  CloudRain: CloudRain,
};

const emotionColorClasses: Record<string, { bg: string; text: string; border: string }> = {
  amber: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/30" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-500/30" },
  red: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/30" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/30" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/30" },
};

type LibraryStep = "emotion" | "situation" | "player";

export function AudioLibrary({ content }: AudioLibraryProps) {
  const { session } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<LibraryStep>("emotion");
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [selectedSituation, setSelectedSituation] = useState<Situation | null>(null);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchFavorites();
    }
  }, [session]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const fetchFavorites = async () => {
    if (!session?.user) return;
    
    const { data } = await supabase
      .from("user_favorites")
      .select("meditation_id")
      .eq("user_id", session.user.id);
    
    if (data) {
      setFavorites(data.map(f => f.meditation_id));
    }
  };

  const fetchTracks = async () => {
    setIsLoading(true);
    
    // Fetch tracks that match the selected emotion/situation
    // For now, we'll fetch all premium meditations
    const { data, error } = await supabase
      .from("meditations")
      .select("*")
      .eq("is_free", false)
      .order("order_index");
    
    if (error) {
      console.error("Error fetching tracks:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los audios",
        variant: "destructive",
      });
    } else {
      setTracks(data || []);
      if (data && data.length > 0) {
        setCurrentTrack(data[0]);
      }
    }
    
    setIsLoading(false);
  };

  const handleEmotionSelect = (emotion: Emotion) => {
    setSelectedEmotion(emotion);
    setStep("situation");
  };

  const handleSituationSelect = (situation: Situation) => {
    setSelectedSituation(situation);
    setStep("player");
    fetchTracks();
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !currentTrack?.audio_url) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTrackSelect = (track: AudioTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handlePrevTrack = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      handleTrackSelect(tracks[currentIndex - 1]);
    }
  };

  const handleNextTrack = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex < tracks.length - 1) {
      handleTrackSelect(tracks[currentIndex + 1]);
    }
  };

  const toggleFavorite = async (trackId: string) => {
    if (!session?.user) return;
    
    const isFavorite = favorites.includes(trackId);
    
    if (isFavorite) {
      await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", session.user.id)
        .eq("meditation_id", trackId);
      
      setFavorites(prev => prev.filter(id => id !== trackId));
    } else {
      await supabase
        .from("user_favorites")
        .insert({ user_id: session.user.id, meditation_id: trackId });
      
      setFavorites(prev => [...prev, trackId]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderEmotionStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-display font-bold text-foreground">
          ¿Qué estás sintiendo?
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecciona tu estado emocional actual
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {content.emotions.map((emotion) => {
          const IconComponent = emotionIcons[emotion.icon] || Zap;
          const colors = emotionColorClasses[emotion.color] || emotionColorClasses.amber;
          
          return (
            <button
              key={emotion.id}
              onClick={() => handleEmotionSelect(emotion)}
              className={cn(
                "p-5 rounded-xl border-2 transition-all text-center space-y-2",
                colors.bg, colors.border,
                "hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <IconComponent className={cn("w-8 h-8 mx-auto", colors.text)} />
              <p className={cn("font-medium", colors.text)}>{emotion.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSituationStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          {selectedEmotion && (
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              emotionColorClasses[selectedEmotion.color]?.bg,
              emotionColorClasses[selectedEmotion.color]?.text
            )}>
              {selectedEmotion.label}
            </span>
          )}
        </div>
        <h3 className="text-lg font-display font-bold text-foreground">
          ¿En qué momento estás?
        </h3>
      </div>
      
      <div className="space-y-3">
        {content.situations.map((situation) => (
          <button
            key={situation.id}
            onClick={() => handleSituationSelect(situation)}
            className="w-full bg-card p-4 rounded-xl border-2 border-transparent hover:border-primary/50 transition-all text-left shadow-soft"
          >
            <p className="font-medium text-foreground">{situation.label}</p>
          </button>
        ))}
      </div>
      
      <Button variant="ghost" onClick={() => setStep("emotion")} className="w-full">
        Cambiar emoción
      </Button>
    </div>
  );

  const renderPlayerStep = () => (
    <div className="space-y-6">
      {/* Context badges */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {selectedEmotion && (
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            emotionColorClasses[selectedEmotion.color]?.bg,
            emotionColorClasses[selectedEmotion.color]?.text
          )}>
            {selectedEmotion.label}
          </span>
        )}
        {selectedSituation && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {selectedSituation.label}
          </span>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Cargando audios...</p>
        </div>
      ) : currentTrack ? (
        <>
          {/* Current track player */}
          <div className="bg-gradient-to-br from-secondary to-primary rounded-2xl p-6 text-white space-y-4">
            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-lg">{currentTrack.title}</h3>
              {currentTrack.narrator && (
                <p className="text-white/70 text-sm">Por {currentTrack.narrator}</p>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || currentTrack.duration_seconds}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/70">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration || currentTrack.duration_seconds)}</span>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePrevTrack}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                disabled={tracks.findIndex(t => t.id === currentTrack.id) === 0}
              >
                <SkipBack className="w-6 h-6" />
              </button>
              
              <button
                onClick={handlePlayPause}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-secondary" />
                ) : (
                  <Play className="w-8 h-8 text-secondary ml-1" />
                )}
              </button>
              
              <button
                onClick={handleNextTrack}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                disabled={tracks.findIndex(t => t.id === currentTrack.id) === tracks.length - 1}
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>
            
            {/* Extra actions */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => toggleFavorite(currentTrack.id)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Heart className={cn(
                  "w-5 h-5",
                  favorites.includes(currentTrack.id) ? "fill-coral text-coral" : ""
                )} />
              </button>
              {content.has_offline && (
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              )}
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Audio element */}
          {currentTrack.audio_url && (
            <audio
              ref={audioRef}
              src={currentTrack.audio_url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />
          )}
          
          {/* Track list */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Más audios para ti:</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleTrackSelect(track)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                    track.id === currentTrack.id 
                      ? "bg-primary/10 border border-primary/30" 
                      : "bg-card hover:bg-muted/50 shadow-soft"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Play className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{track.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(track.duration_seconds)}</span>
                    </div>
                  </div>
                  {favorites.includes(track.id) && (
                    <Heart className="w-4 h-4 fill-coral text-coral flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No hay audios disponibles para esta selección.</p>
          <Button variant="ghost" onClick={() => setStep("emotion")} className="mt-4">
            Intentar con otra emoción
          </Button>
        </div>
      )}
      
      <Button variant="ghost" onClick={() => setStep("emotion")} className="w-full">
        Cambiar selección
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {step === "emotion" && renderEmotionStep()}
      {step === "situation" && renderSituationStep()}
      {step === "player" && renderPlayerStep()}
    </div>
  );
}
