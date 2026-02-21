import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Shield, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { MoreHorizontal, Trash2, Star, ShieldAlert } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfile {
    id: string; // The row UUID
    user_id: string; // The auth user ID
    display_name: string | null;
    email: string | null; // Often not in profiles, but we might want it. If not available, use display_name.
    avatar_url: string | null;
    level: number;
    xp: number;
    streak_current: number;
    last_interaction: string;
    is_admin: boolean;
    is_premium: boolean;
}

const AdminUsers = () => {
    const navigate = useNavigate();
    const { user, loading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            // 1. Check Admin
            if (!user) return;
            // Ideally we check is_admin again or trust the RLS/Layout protection

            try {
                // Fetch profiles with gamification data
                // Note: 'email' is usually in auth.users, not profiles. 
                // We will just use display_name for now.
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('xp', { ascending: false }) // Rank by XP
                    .limit(50); // Pagination later

                if (error) throw error;
                setUsers(data as any as UserProfile[]);
            } catch (error) {
                console.error("Error fetching users:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los usuarios.",
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
            const { error } = await supabase
                .from('profiles')
                .update({ is_premium: newValue })
                .eq('id', profile.id);

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
            const { error } = await supabase
                .from('profiles')
                .update({ is_admin: newValue })
                .eq('id', profile.id);

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
                                                    <LevelBadge level={profile.level} showLabel={false} />
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
                                                    {profile.streak_current}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">
                                                {profile.last_interaction ? new Date(profile.last_interaction).toLocaleDateString() : "Nunca"}
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
        </div>
    );
};

export default AdminUsers;
