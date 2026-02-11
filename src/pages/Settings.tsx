import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { ArrowLeft, Bell, Shield, Heart, ChevronRight, Plus, Trash2, Loader2, Save, Moon, Sun, Laptop, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Settings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const section = location.pathname.includes("/notifications") ? "notifications"
        : location.pathname.includes("/privacy") ? "privacy"
            : location.pathname.includes("/contacts") ? "contacts"
                : location.pathname.includes("/appearance") ? "appearance"
                    : location.pathname.includes("/profile") ? "profile"
                        : "settings";

    const isRoot = section === "settings";
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { setTheme, theme } = useTheme();

    // Fetch Profile
    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    // Fetch Contacts
    const { data: contacts, isLoading: isLoadingContacts } = useQuery({
        queryKey: ['trusted_contacts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('trusted_contacts')
                .select('*')
                .eq('user_id', user?.id);

            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });

    // Update Profile Mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (updates: Record<string, unknown>) => {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('user_id', user?.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success("Configuración actualizada");
        },
        onError: (error) => {
            toast.error("Error al actualizar: " + error.message);
        }
    });

    // Add Contact Mutation
    const addContactMutation = useMutation({
        mutationFn: async (newContact: { name: string; phone?: string; email: string }) => {
            const { error } = await supabase
                .from('trusted_contacts')
                .insert([{ ...newContact, user_id: user?.id }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trusted_contacts'] });
            toast.success("Contacto agregado");
            setNewContact({ name: "", phone: "", email: "" });
            setIsAddingContact(false);
        },
        onError: (error) => {
            toast.error("Error al agregar contacto: " + error.message);
        }
    });

    // Delete Contact Mutation
    const deleteContactMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('trusted_contacts')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trusted_contacts'] });
            toast.success("Contacto eliminado");
        },
        onError: (error) => {
            toast.error("Error al eliminar contacto: " + error.message);
        }
    });

    const [isAddingContact, setIsAddingContact] = useState(false);
    const [newContact, setNewContact] = useState({ name: "", phone: "", email: "" });

    // Handlers
    const handleNotificationToggle = (key: 'notifications_push' | 'notifications_email') => {
        updateProfileMutation.mutate({ [key]: !profile?.[key] });
    };

    const handlePrivacyToggle = () => {
        const currentIsPublic = !profile?.is_ranking_private;
        const newIsPublic = !currentIsPublic;
        // if newIsPublic is true, is_ranking_private should be false
        updateProfileMutation.mutate({ is_ranking_private: !newIsPublic });
    };

    const handleAddContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContact.name || !newContact.email) return;
        addContactMutation.mutate(newContact);
    };


    const renderRoot = () => (
        <div className="space-y-4">
            {[
                { icon: User, label: "Perfil", path: "/settings/profile", desc: "Datos personales y demografía" },
                { icon: Bell, label: "Notificaciones", path: "/settings/notifications", desc: "Alertas y recordatorios" },
                { icon: Shield, label: "Privacidad y seguridad", path: "/settings/privacy", desc: "Visibilidad y datos" },
                { icon: Heart, label: "Contactos de confianza", path: "/settings/contacts", desc: "Red de apoyo" },
                { icon: Moon, label: "Apariencia", path: "/settings/appearance", desc: "Tema claro u oscuro" },
            ].map((item) => (
                <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="w-full bg-card p-4 rounded-xl shadow-sm flex items-center gap-4 hover:bg-muted/50 transition-all text-left"
                >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.label}</h3>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
            ))}
        </div>
    );

    const renderNotifications = () => {
        if (isLoadingProfile) return <Loader2 className="w-8 h-8 animate-spin mx-auto" />;
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Preferencias de Notificación</CardTitle>
                    <CardDescription>Gestiona cómo quieres recibir alertas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Notificaciones Push</Label>
                            <p className="text-xs text-muted-foreground">Alertas en tu dispositivo</p>
                        </div>
                        <Switch
                            checked={profile?.notifications_push ?? true}
                            onCheckedChange={() => handleNotificationToggle('notifications_push')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Notificaciones por Email</Label>
                            <p className="text-xs text-muted-foreground">Resúmenes semanales y alertas</p>
                        </div>
                        <Switch
                            checked={profile?.notifications_email ?? false}
                            onCheckedChange={() => handleNotificationToggle('notifications_email')}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderPrivacy = () => {
        if (isLoadingProfile) return <Loader2 className="w-8 h-8 animate-spin mx-auto" />;
        const isPublic = !profile?.is_ranking_private;

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Privacidad</CardTitle>
                    <CardDescription>Controla quién puede ver tu actividad.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Perfil Público</Label>
                            <p className="text-xs text-muted-foreground">Visible en la comunidad y rankings</p>
                        </div>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={handlePrivacyToggle}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderContacts = () => {
        if (isLoadingContacts) return <Loader2 className="w-8 h-8 animate-spin mx-auto" />;

        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Red de Apoyo</CardTitle>
                        <CardDescription>Personas clave para situaciones SOS.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {contacts?.map((contact) => (
                            <div key={contact.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-warmth/20 flex items-center justify-center text-warmth font-bold">
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{contact.name}</p>
                                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                                        {contact.phone && <p className="text-xs text-muted-foreground">{contact.phone}</p>}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive h-8 w-8 hover:bg-destructive/10"
                                    onClick={() => deleteContactMutation.mutate(contact.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        {isAddingContact && (
                            <form onSubmit={handleAddContactSubmit} className="space-y-3 pt-2 border-t mt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input
                                        id="name"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                        placeholder="Ej. Mamá"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                        placeholder="ejemplo@correo.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono (Opcional)</Label>
                                    <Input
                                        id="phone"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                        placeholder="Ej. 555-1234"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="ghost" onClick={() => setIsAddingContact(false)}>Cancelar</Button>
                                    <Button type="submit" size="sm">
                                        <Save className="w-4 h-4 mr-2" /> Guardar
                                    </Button>
                                </div>
                            </form>
                        )}

                        {!isAddingContact && (
                            <Button className="w-full mt-2" variant="outline" onClick={() => setIsAddingContact(true)}>
                                <Plus className="w-4 h-4 mr-2" /> Agregar Contacto
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderProfile = () => {
        if (isLoadingProfile) return <Loader2 className="w-8 h-8 animate-spin mx-auto" />;

        const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            updateProfileMutation.mutate({
                display_name: formData.get('display_name'),
                age_range: formData.get('age_range'),
                gender: formData.get('gender'),
                occupation: formData.get('occupation'),
            });
        };

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Tu Perfil</CardTitle>
                    <CardDescription>Actualiza tu información personal.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="display_name">Nombre</Label>
                            <Input
                                id="display_name"
                                name="display_name"
                                defaultValue={profile?.display_name || ''}
                                placeholder="Tu nombre"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="age_range">Rango de Edad</Label>
                            <Select name="age_range" defaultValue={profile?.age_range || ''}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tu rango de edad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="<18">Menor de 18 años</SelectItem>
                                    <SelectItem value="18-24">18 - 24 años</SelectItem>
                                    <SelectItem value="25-34">25 - 34 años</SelectItem>
                                    <SelectItem value="35-44">35 - 44 años</SelectItem>
                                    <SelectItem value="45-54">45 - 54 años</SelectItem>
                                    <SelectItem value="55+">55+ años</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender">Género</Label>
                            <Select name="gender" defaultValue={profile?.gender || ''}>
                                <SelectTrigger>
                                    <SelectValue placeholder="¿Cómo te identificas?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Hombre">Hombre</SelectItem>
                                    <SelectItem value="Mujer">Mujer</SelectItem>
                                    <SelectItem value="No binario">No binario</SelectItem>
                                    <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="occupation">Ocupación</Label>
                            <Select name="occupation" defaultValue={profile?.occupation || ''}>
                                <SelectTrigger>
                                    <SelectValue placeholder="¿A qué te dedicas?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Estudiante">Estudiante</SelectItem>
                                    <SelectItem value="Trabajo">Trabajo</SelectItem>
                                    <SelectItem value="Estudio y Trabajo">Estudio y Trabajo</SelectItem>
                                    <SelectItem value="Desempleado/a">Desempleado/a</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full">
                                <Save className="w-4 h-4 mr-2" />
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        );
    };

    const renderAppearance = () => (
        <Card>
            <CardHeader>
                <CardTitle>Apariencia</CardTitle>
                <CardDescription>Personaliza cómo se ve la aplicación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted'}`}
                    >
                        <Sun className={`w-8 h-8 mb-2 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">Claro</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted'}`}
                    >
                        <Moon className={`w-8 h-8 mb-2 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">Oscuro</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTheme("system")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted'}`}
                    >
                        <Laptop className={`w-8 h-8 mb-2 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">Sistema</span>
                    </button>
                </div>
            </CardContent>
        </Card>
    );

    const getTitle = () => {
        switch (section) {
            case "notifications": return "Notificaciones";
            case "privacy": return "Privacidad";
            case "contacts": return "Contactos";
            case "appearance": return "Apariencia";
            case "profile": return "Tu Perfil";
            default: return "Configuración";
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="container flex items-center gap-4 py-4">
                    <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-lg font-display font-bold text-foreground">
                        {getTitle()}
                    </h1>
                </div>
            </header>

            <main className="container py-6">
                {isRoot && renderRoot()}
                {section === "notifications" && renderNotifications()}
                {section === "privacy" && renderPrivacy()}
                {section === "contacts" && renderContacts()}
                {section === "appearance" && renderAppearance()}
                {section === "profile" && renderProfile()}
            </main>
        </div>
    );
};

export default Settings;
