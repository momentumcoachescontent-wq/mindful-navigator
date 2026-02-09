import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell, Shield, Heart, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Settings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const section = location.pathname.split("/").pop();
    const isRoot = section === "settings";

    // Mock state for notifications
    const [notifications, setNotifications] = useState({
        push: true,
        email: false,
        dailyReminder: true,
        weeklyReport: true,
    });

    // Mock state for privacy
    const [privacy, setPrivacy] = useState({
        publicProfile: false,
        showActivity: true,
        allowFriends: true,
    });

    // Mock state for contacts
    const [contacts] = useState([
        { id: 1, name: "Mamá", phone: "555-0000", isPrimary: true },
        { id: 2, name: "Ana (Pareja)", phone: "555-1234", isPrimary: false },
    ]);

    const handleToggle = (category: "notifications" | "privacy", key: string) => {
        if (category === "notifications") {
            setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
        } else {
            setPrivacy(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
        }
        toast.success("Configuración guardada");
    };

    const renderRoot = () => (
        <div className="space-y-4">
            {[
                { icon: Bell, label: "Notificaciones", path: "/settings/notifications", desc: "Alertas y recordatorios" },
                { icon: Shield, label: "Privacidad y seguridad", path: "/settings/privacy", desc: "Visibilidad y datos" },
                { icon: Heart, label: "Contactos de confianza", path: "/settings/contacts", desc: "Red de apoyo" },
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

    const renderNotifications = () => (
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
                        checked={notifications.push}
                        onCheckedChange={() => handleToggle("notifications", "push")}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Recordatorio Diario</Label>
                        <p className="text-xs text-muted-foreground">Para tu check-in emocional</p>
                    </div>
                    <Switch
                        checked={notifications.dailyReminder}
                        onCheckedChange={() => handleToggle("notifications", "dailyReminder")}
                    />
                </div>
            </CardContent>
        </Card>
    );

    const renderPrivacy = () => (
        <Card>
            <CardHeader>
                <CardTitle>Privacidad</CardTitle>
                <CardDescription>Controla quién puede ver tu actividad.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Perfil Público</Label>
                        <p className="text-xs text-muted-foreground">Visible en la comunidad</p>
                    </div>
                    <Switch
                        checked={privacy.publicProfile}
                        onCheckedChange={() => handleToggle("privacy", "publicProfile")}
                    />
                </div>
            </CardContent>
        </Card>
    );

    const renderContacts = () => (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Red de Apoyo</CardTitle>
                    <CardDescription>Personas clave para situaciones SOS.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-warmth/20 flex items-center justify-center text-warmth font-bold">
                                    {contact.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{contact.name}</p>
                                    <p className="text-xs text-muted-foreground">{contact.phone}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button className="w-full mt-2" variant="outline">
                        <Plus className="w-4 h-4 mr-2" /> Agregar Contacto
                    </Button>
                </CardContent>
            </Card>
        </div>
    );

    const getTitle = () => {
        switch (section) {
            case "notifications": return "Notificaciones";
            case "privacy": return "Privacidad";
            case "contacts": return "Contactos";
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
            </main>
        </div>
    );
};

export default Settings;
