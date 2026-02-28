import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Shield, Trophy, Flame, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { MoreHorizontal, Trash2, Star, ShieldAlert, BookPlus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface UserProfile {
    id: string;
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    streak_count: number;
    onboarding_completed: boolean;
    is_premium: boolean;
    is_admin: boolean;
    created_at: string;
    // Enriched from user_progress
    xp: number;
    level: string;
}

const AdminUsers = () => {
    const navigate = useNavigate();
    const { user, loading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [journalEntry, setJournalEntry] = useState("");
    const [isInjecting, setIsInjecting] = useState(false);

    // Broadcast state
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [broadcastTitle, setBroadcastTitle] = useState("");
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!user) return;

            try {
                // Fetch profiles (columns that actually exist)
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, user_id, display_name, avatar_url, streak_count, onboarding_completed, is_premium, is_admin, created_at')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (profilesError) throw profilesError;

                // Fetch XP data from user_progress
                const { data: progressData } = await supabase
                    .from('user_progress')
                    .select('user_id, total_xp, current_level');

                const progressMap = new Map(
                    (progressData || []).map(p => [p.user_id, p])
                );

                // Merge profiles with progress
                const enriched: UserProfile[] = (profiles || []).map((p: any) => {
                    const progress = progressMap.get(p.user_id);
                    return {
                        ...p,
                        is_premium: p.is_premium || false,
                        is_admin: p.is_admin || false,
                        streak_count: p.streak_count || 0,
                        xp: progress?.total_xp || 0,
                        level: progress?.current_level || 'explorer',
                    };
                });

                // Sort by XP descending
                enriched.sort((a, b) => b.xp - a.xp);
                setUsers(enriched);
            } catch (error) {
                console.error("Error fetching users:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los usuarios. Verifica permisos de admin.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (!isAuthLoading) fetchUsers();
    }, [user, isAuthLoading, toast]);


    const handleTogglePremium = async (profile: UserProfile) => {
        try {
            const newValue = !profile.is_premium;
            const { error } = await (supabase.rpc as any)('admin_update_profile_status', {
                p_target_user_id: profile.id,
                p_is_premium: newValue
            });

            if (error) throw error;

            setUsers(users.map(u => u.id === profile.id ? { ...u, is_premium: newValue } : u));
            toast({ title: "Éxito", description: `Estado Premium ${newValue ? 'activado' : 'desactivado'} para ${profile.display_name}.` });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo actualizar el estado Premium.", variant: "destructive" });
        }
    };

    const handleToggleAdmin = async (profile: UserProfile) => {
        try {
            const newValue = !profile.is_admin;
            const { error } = await (supabase.rpc as any)('admin_update_profile_status', {
                p_target_user_id: profile.id,
                p_is_admin: newValue
            });

            if (error) throw error;

            setUsers(users.map(u => u.id === profile.id ? { ...u, is_admin: newValue } : u));
            toast({ title: newValue ? "Nuevo Administrador Forjado" : "Poder Revocado", description: `${profile.display_name} ha cambiado su rol.`, variant: "default" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo actualizar el rol de admin.", variant: "destructive" });
        }
    };

    const handleDeleteProfile = async (profile: UserProfile) => {
        if (!confirm(`¿Estás seguro de que quieres erradicar a ${profile.display_name}? Esto no se puede deshacer.`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profile.id);

            if (error) throw error;

            setUsers(users.filter(u => u.id !== profile.id));
            toast({ title: "Aniquilación", description: `El perfil de ${profile.display_name} ha sido borrado (Guillotina).`, variant: "destructive" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo borrar el perfil.", variant: "destructive" });
        }
    };

    const handleInjectJournal = async () => {
        if (!selectedUser || !journalEntry.trim()) return;
        setIsInjecting(true);

        try {
            const content = {
                title: "Nota del Coach",
                text: journalEntry,
                tags: ["Nota Coach", "Admin"]
            };

            const { error } = await supabase
                .from('journal_entries')
                .insert([{
                    user_id: selectedUser.user_id,
                    content: JSON.stringify(content),
                    entry_type: 'coach_note',
                    tags: ["Nota Coach", "Admin"]
                }]);

            if (error) throw error;

            toast({ title: "Diario Actualizado", description: `Se ha inyectado la nota en el diario de ${selectedUser.display_name}.` });
            setIsJournalModalOpen(false);
            setJournalEntry("");
        } catch (error) {
            console.error(error);
            toast({ title: "Error de Inyección", description: "No se pudo insertar la nota en el diario.", variant: "destructive" });
        } finally {
            setIsInjecting(false);
        }
    };

    // Broadcast a message to ALL users
    const handleBroadcastJournal = async () => {
        if (!broadcastMessage.trim()) return;
        setIsBroadcasting(true);

        try {
            // Fetch all user_ids from profiles
            const { data: allProfiles, error: fetchError } = await supabase
                .from('profiles')
                .select('user_id')
                .not('user_id', 'is', null);

            if (fetchError) throw fetchError;
            if (!allProfiles || allProfiles.length === 0) {
                toast({ title: "Sin usuarios", description: "No se encontraron usuarios activos.", variant: "destructive" });
                return;
            }

            const title = broadcastTitle.trim() || "Mensaje de tu Coach";
            const entries = allProfiles.map(p => ({
                user_id: p.user_id,
                content: JSON.stringify({
                    title,
                    text: broadcastMessage,
                    tags: ["Coach", "Broadcast"]
                }),
                entry_type: 'admin_note',
                tags: ['Coach', 'Broadcast']
            }));

            // Batch insert in chunks of 50 to avoid request size limits
            const chunkSize = 50;
            for (let i = 0; i < entries.length; i += chunkSize) {
                const chunk = entries.slice(i, i + chunkSize);
                const { error: insertError } = await supabase
                    .from('journal_entries')
                    .insert(chunk as never[]);
                if (insertError) throw insertError;
            }

            toast({
                title: "📡 Broadcast Enviado",
                description: `Mensaje entregado a ${allProfiles.length} usuarios.`,
            });
            setIsBroadcastModalOpen(false);
            setBroadcastMessage("");
            setBroadcastTitle("");
        } catch (error) {
            console.error('Broadcast error:', error);
            toast({ title: "Error en Broadcast", description: "No se pudo enviar el mensaje a todos los usuarios.", variant: "destructive" });
        } finally {
            setIsBroadcasting(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.display_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (u.id || "").includes(searchTerm)
    );

    if (isLoading || isAuthLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
                <div className="container flex items-center gap-3 py-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold font-display flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Gestión de Usuarios
                        </h1>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={() => setIsBroadcastModalOpen(true)}
                    >
                        <Radio className="w-4 h-4" />
                        Broadcast
                    </Button>
                </div>
            </div>

            <main className="container py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Usuarios Registrados ({users.length})</CardTitle>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead className="text-center">Nivel</TableHead>
                                        <TableHead className="text-center">XP</TableHead>
                                        <TableHead className="text-center">Racha</TableHead>
                                        <TableHead className="text-right">Última Actividad</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((profile) => (
                                        <TableRow key={profile.id}>
                                            <TableCell className="flex items-center gap-3 font-medium">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={profile.avatar_url || ""} />
                                                    <AvatarFallback>{profile.display_name?.substring(0, 2).toUpperCase() || "??"}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span>{profile.display_name || "Sin nombre"}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{profile.id.substring(0, 8)}...</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    <LevelBadge level={profile.level as any} showLabel={false} />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-primary cursor-help" title={`XP Actual: ${profile.xp}`}>
                                                    <Trophy className="w-3 h-3" />
                                                    {profile.xp}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-orange-500 font-bold">
                                                    <Flame className="w-4 h-4" />
                                                    {profile.streak_count}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">
                                                {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "Nunca"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Poderes de Origen</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleTogglePremium(profile)}>
                                                            <Star className={`mr-2 h-4 w-4 ${profile.is_premium ? 'text-coral' : ''}`} />
                                                            {profile.is_premium ? "Revocar Premium" : "Otorgar Premium"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleAdmin(profile)}>
                                                            <ShieldAlert className={`mr-2 h-4 w-4 ${profile.is_admin ? 'text-primary' : ''}`} />
                                                            {profile.is_admin ? "Degradar de Admin" : "Ascender a Admin"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedUser(profile);
                                                            setIsJournalModalOpen(true);
                                                        }}>
                                                            <BookPlus className="mr-2 h-4 w-4 text-primary" />
                                                            Inyectar Diario
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleDeleteProfile(profile)} className="text-destructive font-bold focus:bg-destructive focus:text-destructive-foreground">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            La Guillotina (Borrar)
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Modal de Inyección de Diario */}
            <Dialog open={isJournalModalOpen} onOpenChange={setIsJournalModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Inyectar Nota al Diario</DialogTitle>
                        <DialogDescription>
                            Escribe una nota clínica o directriz que aparecerá directamente en el diario de {selectedUser?.display_name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="journal-content">Contenido de la nota</Label>
                            <Textarea
                                id="journal-content"
                                placeholder="Escribe aquí tu observación o guía estratégica..."
                                value={journalEntry}
                                onChange={(e) => setJournalEntry(e.target.value)}
                                className="min-h-[150px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsJournalModalOpen(false)} disabled={isInjecting}>
                            Cancelar
                        </Button>
                        <Button onClick={handleInjectJournal} disabled={isInjecting || !journalEntry.trim()}>
                            {isInjecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookPlus className="w-4 h-4 mr-2" />}
                            Inyectar Ahora
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Broadcast Masivo */}
            <Dialog open={isBroadcastModalOpen} onOpenChange={setIsBroadcastModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Radio className="w-5 h-5 text-primary" />
                            Broadcast — Mensaje a Todos los Usuarios
                        </DialogTitle>
                        <DialogDescription>
                            Este mensaje aparecerá en el <strong>diario personal</strong> de cada usuario registrado.
                            Usa este poder con intención.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="broadcast-title">Título del mensaje</Label>
                            <input
                                id="broadcast-title"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Mensaje de tu Coach"
                                value={broadcastTitle}
                                onChange={(e) => setBroadcastTitle(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="broadcast-content">Contenido del mensaje</Label>
                            <Textarea
                                id="broadcast-content"
                                placeholder="Escribe aquí tu mensaje, guía o reflexión para toda la comunidad..."
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                className="min-h-[150px]"
                            />
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                            <span className="text-lg leading-none">⚠️</span>
                            <span>Este mensaje se enviará a <strong>todos los {users.length} usuarios</strong> listados. Esta acción no se puede deshacer.</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsBroadcastModalOpen(false)} disabled={isBroadcasting}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleBroadcastJournal}
                            disabled={isBroadcasting || !broadcastMessage.trim()}
                            className="gap-2"
                        >
                            {isBroadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                            {isBroadcasting ? "Enviando..." : `Enviar a todos (${users.length})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

    );
};

export default AdminUsers;
