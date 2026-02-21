
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AudioTrack } from "@/types/audio";
import { useAudio } from "@/contexts/AudioContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Lock, Search, Music, Mic, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Library = () => {
    const { play, pause, currentTrack, isPlaying } = useAudio();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const { data: tracks, isLoading } = useQuery({
        queryKey: ['audio-library'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('audio_content')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as unknown as AudioTrack[];
        }
    });

    const { data: profile } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('is_premium').eq('user_id', user?.id).single();
            return data;
        },
        enabled: !!user
    });

    const isPremium = profile?.is_premium || false;

    const handlePlay = (track: AudioTrack) => {
        if (track.is_premium && !isPremium) {
            toast.error("Contenido exclusivo para Premium", {
                description: "Actualiza tu plan para acceder a esta meditación.",
                action: {
                    label: "Ver Planes",
                    onClick: () => navigate("/shop")
                }
            });
            return;
        }

        if (currentTrack?.id === track.id && isPlaying) {
            pause();
        } else {
            play(track);
        }
    };

    const filteredTracks = tracks?.filter(track => {
        const matchesSearch = track.title.toLowerCase().includes(search.toLowerCase()) ||
            track.category.toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === "all" || track.category === activeTab;
        return matchesSearch && matchesTab;
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-background pb-32 pt-6 px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold font-display">Biblioteca de Bienestar</h1>
                    <p className="text-muted-foreground">Meditaciones, guías y sonidos para tu equilibrio.</p>

                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar contenido..."
                            className="pl-9 bg-secondary/50 border-0"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories */}
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent gap-2">
                        <TabsTrigger value="all" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Todo</TabsTrigger>
                        <TabsTrigger value="meditation" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Meditaciones</TabsTrigger>
                        <TabsTrigger value="music" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Música</TabsTrigger>
                        <TabsTrigger value="guide" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Guías</TabsTrigger>
                        <TabsTrigger value="sounds" className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sonidos</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTracks?.map((track) => (
                                <Card key={track.id} className="hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden" onClick={() => handlePlay(track)}>

                                    {/* Premium Lock Overlay */}
                                    {track.is_premium && !isPremium && (
                                        <div className="absolute top-2 right-2 z-10 bg-black/50 backdrop-blur-sm p-1 rounded-full text-white">
                                            <Lock className="w-3 h-3" />
                                        </div>
                                    )}

                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                                            {track.image_url ? (
                                                <img src={track.image_url} alt={track.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    {track.category === 'meditation' && <Sparkles className="w-6 h-6" />}
                                                    {track.category === 'music' && <Music className="w-6 h-6" />}
                                                    {track.category === 'guide' && <Mic className="w-6 h-6" />}
                                                    {track.category === 'sounds' && <BookOpen className="w-6 h-6" />}
                                                </div>
                                            )}

                                            {/* Hover Play Button */}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                {currentTrack?.id === track.id && isPlaying ? (
                                                    <Pause className="w-6 h-6 text-white drop-shadow-md" />
                                                ) : (
                                                    <Play className="w-6 h-6 text-white drop-shadow-md ml-1" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className={cn("font-semibold truncate", currentTrack?.id === track.id && "text-primary")}>
                                                {track.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground capitalize">{track.category}</p>
                                        </div>

                                        {currentTrack?.id === track.id && isPlaying && (
                                            <div className="flex gap-0.5 items-end h-4">
                                                <span className="w-0.5 h-2 bg-primary animate-pulse" />
                                                <span className="w-0.5 h-4 bg-primary animate-pulse delay-75" />
                                                <span className="w-0.5 h-3 bg-primary animate-pulse delay-150" />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        {filteredTracks?.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No se encontraron audios en esta categoría.
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

// Helper utility for dynamic class names if not imported
function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(" ");
}

export default Library;
