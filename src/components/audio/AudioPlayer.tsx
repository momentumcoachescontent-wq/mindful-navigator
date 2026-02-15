
import { useAudio } from "@/contexts/AudioContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, X, SkipBack, SkipForward, Volume2, Maximize2, Minimize2 } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const AudioPlayer = () => {
    const {
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
    } = useAudio();

    if (!currentTrack) return null;

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out bg-background/95 backdrop-blur-md border-t shadow-2xl",
            isExpanded ? "h-screen flex flex-col justify-center pb-20" : "h-20"
        )}>
            {/* Progress Bar (Top) - Only in mini mode */}
            {!isExpanded && (
                <div
                    className="absolute top-0 left-0 h-1 bg-primary z-10 transition-all duration-100"
                    style={{ width: `${(progress / duration) * 100}%` }}
                />
            )}

            <div className={cn("container h-full flex items-center justify-between gap-4", isExpanded && "flex-col h-auto")}>

                {/* Track Info */}
                <div className={cn("flex items-center gap-4 min-w-0", isExpanded ? "flex-col text-center" : "flex-1")}>
                    {currentTrack.image_url ? (
                        <img
                            src={currentTrack.image_url}
                            alt={currentTrack.title}
                            className={cn("object-cover rounded-md shadow-sm", isExpanded ? "w-64 h-64 mb-4" : "w-12 h-12")}
                        />
                    ) : (
                        <div className={cn("bg-primary/10 rounded-md flex items-center justify-center text-primary font-bold", isExpanded ? "w-64 h-64 mb-4 text-4xl" : "w-12 h-12 text-lg")}>
                            ♫
                        </div>
                    )}
                    <div className="overflow-hidden">
                        <h4 className={cn("font-semibold truncate", isExpanded && "text-2xl mt-4")}>{currentTrack.title}</h4>
                        <p className={cn("text-xs text-muted-foreground truncate capitalize", isExpanded && "text-lg")}>{currentTrack.category}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className={cn("flex flex-col items-center gap-1", isExpanded ? "w-full max-w-md gap-6" : "flex-none")}>
                    <div className="flex items-center gap-2 md:gap-4">
                        <Button variant="ghost" size="icon" onClick={() => seek(Math.max(0, progress - 10))}>
                            <SkipBack className="w-5 h-5" />
                        </Button>

                        <Button
                            size="icon"
                            className={cn("rounded-full", isExpanded ? "w-16 h-16" : "w-10 h-10")}
                            onClick={isPlaying ? pause : resume}
                        >
                            {isPlaying ? <Pause className={cn(isExpanded ? "w-8 h-8" : "w-5 h-5")} /> : <Play className={cn(isExpanded ? "w-8 h-8" : "w-5 h-5", "ml-1")} />}
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => seek(Math.min(duration, progress + 10))}>
                            <SkipForward className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Expanded Seek Bar */}
                    {isExpanded && (
                        <div className="w-full flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatTime(progress)}</span>
                            <Slider
                                value={[progress]}
                                max={duration || 100}
                                step={1}
                                onValueChange={(val) => seek(val[0])}
                                className="flex-1"
                            />
                            <span>{formatTime(duration)}</span>
                        </div>
                    )}
                </div>

                {/* Volume & Extras */}
                <div className={cn("flex items-center gap-2 md:gap-4 justify-end", isExpanded ? "w-full max-w-md justify-center mt-8" : "flex-1")}>
                    {/* Volume Hidden on mobile mini */}
                    <div className="hidden md:flex items-center gap-2 w-24">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                        <Slider value={[volume]} max={1} step={0.01} onValueChange={(val) => setVolume(val[0])} />
                    </div>

                    <Button variant="ghost" size="icon" onClick={toggleExpand}>
                        {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </Button>

                    <Button variant="ghost" size="icon" onClick={closePlayer}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
