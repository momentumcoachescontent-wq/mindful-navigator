
import { useState } from "react";
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
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, Music, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AudioTrack } from "@/types/audio";

const AdminAudio = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState<AudioTrack | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch Tracks
    const { data: tracks, isLoading } = useQuery({
        queryKey: ['admin-audio'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('audio_content' as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as unknown as AudioTrack[];
        }
    });

    // Create/Update Mutation
    const saveTrackMutation = useMutation({
        mutationFn: async (trackData: Partial<AudioTrack>) => {
            if (editingTrack) {
                const { error } = await supabase
                    .from('audio_content' as any)
                    .update(trackData)
                    .eq('id', editingTrack.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('audio_content' as any)
                    .insert([trackData]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-audio'] });
            setIsOpen(false);
            setEditingTrack(null);
            toast.success(editingTrack ? "Audio actualizado" : "Audio creado");
        },
        onError: (error) => {
            toast.error(`Error: ${error.message}`);
        }
    });

    // Delete Mutation
    const deleteTrackMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('audio_content' as any).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-audio'] });
            toast.success("Audio eliminado");
        },
        onError: (error) => toast.error(`Error: ${error.message}`)
    });

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

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

        // Handle Audio File Upload
        const audioFile = formData.get('audio_file') as File;
        let audioUrl = formData.get('audio_url') as string;

        if (audioFile && audioFile.size > 0) {
            const uploadedUrl = await handleFileUpload(audioFile);
            if (uploadedUrl) {
                audioUrl = uploadedUrl;
            } else {
                return; // Stop if upload failed
            }
        }

        const data = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            category: formData.get('category') as any,
            audio_url: audioUrl, // Use the uploaded URL or the text input
            image_url: formData.get('image_url') as string,
            duration: parseInt(formData.get('duration') as string) || 0,
            is_premium: formData.get('is_premium') === 'on',
        };
        saveTrackMutation.mutate(data);
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-background pb-20 p-6">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                        <Music className="w-6 h-6 text-primary" />
                        Biblioteca de Audio
                    </h1>
                    <p className="text-muted-foreground">Gestiona meditaciones y música</p>
                </div>

                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) setEditingTrack(null);
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" /> Nuevo Audio
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingTrack ? "Editar Audio" : "Nuevo Audio"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                    <select
                                        id="category"
                                        name="category"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        defaultValue={editingTrack?.category || 'meditation'}
                                    >
                                        <option value="meditation">Meditación</option>
                                        <option value="music">Música</option>
                                        <option value="guide">Guía</option>
                                        <option value="sounds">Sonidos</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="duration">Duración (segundos)</Label>
                                    <Input id="duration" name="duration" type="number" defaultValue={editingTrack?.duration || 0} />
                                </div>
                            </div>

                            <div className="grid gap-2 p-4 bg-muted/50 rounded-lg border border-dashed">
                                <Label>Archivo de Audio</Label>
                                <div className="space-y-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="audio_file" className="text-xs text-muted-foreground">Subir archivo (MP3, WAV)</Label>
                                        <Input id="audio_file" name="audio_file" type="file" accept="audio/*" />
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
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isUploading}>
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Subiendo...
                                        </>
                                    ) : (
                                        editingTrack ? "Guardar" : "Crear"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Audio</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Duración</TableHead>
                            <TableHead>Premium</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tracks?.map((track) => (
                            <TableRow key={track.id}>
                                <TableCell className="font-medium">
                                    {track.title}
                                </TableCell>
                                <TableCell>
                                    <span className="capitalize px-2 py-1 rounded-full bg-secondary text-xs">
                                        {track.category}
                                    </span>
                                </TableCell>
                                <TableCell>{track.duration}s</TableCell>
                                <TableCell>
                                    {track.is_premium ? (
                                        <span className="text-xs text-yellow-600 font-bold bg-yellow-100 px-2 py-1 rounded-full">Premium</span>
                                    ) : (
                                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Gratis</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        setEditingTrack(track);
                                        setIsOpen(true);
                                    }}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                                        if (confirm("¿Eliminar este audio permanentemente?")) deleteTrackMutation.mutate(track.id);
                                    }}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {tracks?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No hay audios registrados.
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
