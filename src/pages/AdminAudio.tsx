import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, Music, Upload, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AudioTrack } from "@/types/audio";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminAudio = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState<AudioTrack | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'audio_content' | 'meditations'>('audio_content');
    const [detectedDuration, setDetectedDuration] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Tracks for both tables
    const { data: libraryTracks, isLoading: isLoadingLibrary } = useQuery({
        queryKey: ['admin-audio', 'audio_content'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('audio_content')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data as any[]).map(t => ({ ...t, source_table: 'audio_content' })) as AudioTrack[];
        }
    });

    const { data: meditationTracks, isLoading: isLoadingMeditations } = useQuery({
        queryKey: ['admin-audio', 'meditations'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('meditations')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            // Map table specific fields
            return (data as any[]).map(t => ({
                ...t,
                duration: t.duration_seconds,
                is_premium: !t.is_free,
                source_table: 'meditations'
            })) as AudioTrack[];
        }
    });

    const tracks = activeTab === 'audio_content' ? libraryTracks : meditationTracks;
    const isLoading = isLoadingLibrary || isLoadingMeditations;

    // Helper to get duration from file
    const getAudioDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = URL.createObjectURL(file);
            audio.onloadedmetadata = () => {
                URL.revokeObjectURL(audio.src);
                resolve(Math.round(audio.duration));
            };
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const duration = await getAudioDuration(file);
            setDetectedDuration(duration);
            toast.info(`Duración detectada: ${duration}s`);
        }
    };

    // Create/Update Mutation
    const saveTrackMutation = useMutation({
        mutationFn: async (trackData: any) => {
            const table = activeTab;

            // Re-map fields for meditations table if necessary
            const payload = table === 'meditations' ? {
                title: trackData.title,
                description: trackData.description,
                category: trackData.category,
                duration_seconds: trackData.duration,
                is_free: !trackData.is_premium,
                audio_url: trackData.audio_url,
                image_url: trackData.image_url,
                narrator: trackData.narrator || 'Ernesto',
                is_featured: trackData.is_featured || false,
            } : {
                ...trackData,
                is_premium: trackData.is_premium,
                is_featured: trackData.is_featured || false,
            };

            if (editingTrack) {
                // If replacing audio, we should ideally delete the old one, but for now we just update URL
                const { error } = await supabase
                    .from(table)
                    .update(payload)
                    .eq('id', editingTrack.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from(table)
                    .insert([payload]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-audio'] });
            setIsOpen(false);
            setEditingTrack(null);
            setDetectedDuration(0);
            toast.success(editingTrack ? "Registro actualizado" : "Registro creado");
        },
        onError: (error) => {
            toast.error(`Error: ${error.message}`);
        }
    });

    // Delete Mutation
    const deleteTrackMutation = useMutation({
        mutationFn: async (track: AudioTrack) => {
            const table = track.source_table || activeTab;
            const { error } = await supabase.from(table).delete().eq('id', track.id);
            if (error) throw error;

            // Clean storage if it was a supabase URL
            if (track.audio_url.includes('storage/v1/object/public/audio-library')) {
                const path = track.audio_url.split('audio-library/').pop();
                if (path) {
                    await supabase.storage.from('audio-library').remove([path]);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-audio'] });
            toast.success("Eliminado correctamente");
        },
        onError: (error) => toast.error(`Error: ${error.message}`)
    });

    const handleFileUpload = async (file: File, title: string) => {
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            // Sanitize title for filename
            const cleanTitle = title.toLowerCase().replace(/[^a-z0-0]/g, '-').substring(0, 30);
            const fileName = `${cleanTitle}-${Date.now()}.${fileExt}`;
            const folder = activeTab === 'meditations' ? 'meditations' : 'library';
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('audio-library')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('audio-library')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error: any) {
            toast.error(`Error al subir archivo: ${error.message}`);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;

        // Handle Audio File Upload
        const audioFile = formData.get('audio_file') as File;
        let audioUrl = formData.get('audio_url') as string;

        if (audioFile && audioFile.size > 0) {
            // If editing, try to delete old file first
            if (editingTrack?.audio_url?.includes('audio-library')) {
                const oldPath = editingTrack.audio_url.split('audio-library/').pop();
                if (oldPath) await supabase.storage.from('audio-library').remove([oldPath]);
            }

            const uploadedUrl = await handleFileUpload(audioFile, title);
            if (uploadedUrl) {
                audioUrl = uploadedUrl;
            } else {
                return;
            }
        }

        const data = {
            title: title,
            description: formData.get('description') as string,
            category: formData.get('category') as string,
            audio_url: audioUrl,
            image_url: formData.get('image_url') as string,
            duration: detectedDuration || parseInt(formData.get('duration') as string) || 0,
            is_premium: formData.get('is_premium') === 'on',
            is_featured: formData.get('is_featured') === 'on',
            narrator: formData.get('narrator') as string || 'Ernesto',
        };
        saveTrackMutation.mutate(data);
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-background pb-20 p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                        <Music className="w-6 h-6 text-primary" />
                        Gestión de Audio
                    </h1>
                    <p className="text-muted-foreground">Administra la audioteca y meditaciones</p>
                </div>

                <div className="flex items-center gap-2">
                    <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-[300px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="audio_content">Audioteca</TabsTrigger>
                            <TabsTrigger value="meditations">Meditaciones</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Dialog open={isOpen} onOpenChange={(open) => {
                        setIsOpen(open);
                        if (!open) {
                            setEditingTrack(null);
                            setDetectedDuration(0);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" /> Nuevo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingTrack ? "Editar" : "Nuevo"} en {activeTab === 'meditations' ? 'Meditaciones' : 'Audioteca'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Título</Label>
                                    <Input id="title" name="title" defaultValue={editingTrack?.title} required />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea id="description" name="description" defaultValue={editingTrack?.description || ''} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Categoría</Label>
                                        <Input id="category" name="category" defaultValue={editingTrack?.category || ''} placeholder="ej: calma, ansiedad..." required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="duration">Duración (segundos)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="duration"
                                                name="duration"
                                                type="number"
                                                value={detectedDuration || editingTrack?.duration || 0}
                                                onChange={(e) => setDetectedDuration(parseInt(e.target.value))}
                                            />
                                            {detectedDuration > 0 && <span className="text-[10px] text-green-500 flex items-center">Auto</span>}
                                        </div>
                                    </div>
                                </div>

                                {activeTab === 'meditations' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="narrator">Narrador</Label>
                                        <Input id="narrator" name="narrator" defaultValue={editingTrack?.narrator || 'Ernesto'} />
                                    </div>
                                )}

                                <div className="grid gap-2 p-4 bg-muted/50 rounded-lg border border-dashed">
                                    <Label>Archivo de Audio</Label>
                                    <div className="space-y-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="audio_file" className="text-xs text-muted-foreground">
                                                {editingTrack ? "Reemplazar archivo" : "Subir archivo (MP3, WAV)"}
                                            </Label>
                                            <Input
                                                id="audio_file"
                                                name="audio_file"
                                                type="file"
                                                accept="audio/*"
                                                onChange={handleFileChange}
                                                ref={fileInputRef}
                                            />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">O usar URL externa</span>
                                            </div>
                                        </div>
                                        <Input id="audio_url" name="audio_url" defaultValue={editingTrack?.audio_url || ''} placeholder="https://..." />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="image_url">URL Portada (Opcional)</Label>
                                    <Input id="image_url" name="image_url" defaultValue={editingTrack?.image_url || ''} placeholder="https://..." />
                                </div>

                                <div className="flex gap-6 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="is_premium" name="is_premium" defaultChecked={editingTrack?.is_premium ?? true} />
                                        <Label htmlFor="is_premium">Premium</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch id="is_featured" name="is_featured" defaultChecked={editingTrack?.is_featured ?? false} />
                                        <Label htmlFor="is_featured">Destacar (Banner)</Label>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-4 sticky bottom-0 bg-background pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={isUploading}>
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Subiendo...
                                            </>
                                        ) : (
                                            editingTrack ? "Guardar Cambios" : "Crear Registro"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Duración</TableHead>
                            <TableHead>Nivel</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tracks?.map((track) => (
                            <TableRow key={track.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{track.title}</span>
                                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{track.audio_url}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="capitalize px-2 py-1 rounded-full bg-secondary text-xs">
                                        {track.category}
                                    </span>
                                </TableCell>
                                <TableCell>{track.duration}s</TableCell>
                                <TableCell>
                                    {track.is_premium ? (
                                        <span className="text-[10px] text-yellow-600 font-bold bg-yellow-100 px-2 py-0.5 rounded-full">PREMIUM</span>
                                    ) : (
                                        <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full">GRATIS</span>
                                    )}
                                    {track.is_featured && (
                                        <span className="text-[10px] text-primary-foreground font-bold bg-primary ml-2 px-2 py-0.5 rounded-full">DESTACADO</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        setEditingTrack(track);
                                        setDetectedDuration(0);
                                        setIsOpen(true);
                                    }}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                                        if (confirm("¿Eliminar permanentemente? Esto también borrará el archivo del servidor.")) deleteTrackMutation.mutate(track);
                                    }}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {tracks?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Music className="w-8 h-8 opacity-20" />
                                        <p>No se encontraron registros en esta tabla.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminAudio;
