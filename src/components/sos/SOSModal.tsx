import { X, MessageCircle, Wind, BookOpen, User, Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { BreathingExercise } from "./BreathingExercise";
import { ProfessionalResources } from "./ProfessionalResources";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
}

export function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBreathing, setShowBreathing] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isCustomMessage, setIsCustomMessage] = useState(false);
  const [customMessageText, setCustomMessageText] = useState('');

  useEffect(() => {
    if (showContacts && user) {
      fetchContacts();
    }
  }, [showContacts, user]);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    const { data } = await supabase
      .from('trusted_contacts')
      .select('id, name, email')
      .eq('user_id', user!.id);

    if (data) setContacts(data);
    setLoadingContacts(false);
  };

  const handleSendEmail = (email: string | null, name: string, usePredefined: boolean) => {
    if (!email) {
      toast({
        title: "Sin correo electrónico",
        description: `El contacto ${name} no tiene un correo registrado.`,
        variant: "destructive"
      });
      return;
    }

    const subject = encodeURIComponent("Necesito apoyo");
    let link = `mailto:${email}?subject=${subject}`;

    if (usePredefined) {
      const body = encodeURIComponent(
        `Hola ${name},\n\nNecesito apoyo y me gustaría mucho que pudiéramos estar en contacto pronto.\n\n`
      );
      link += `&body=${body}`;
    }

    window.open(link, '_blank');
  };

  if (!isOpen) return null;

  if (showBreathing) {
    return (
      <div className="fixed inset-0 z-[100] bg-secondary/95 flex items-center justify-center p-6">
        <BreathingExercise onClose={() => {
          setShowBreathing(false);
          onClose();
        }} />
      </div>
    );
  }

  if (showResources) {
    return (
      <ProfessionalResources
        onBack={() => setShowResources(false)}
        onClose={() => {
          setShowResources(false);
          onClose();
        }}
      />
    );
  }

  // View: Contact List or Message Preview
  if (showContacts) {
    if (selectedContact) {
      if (isCustomMessage) {
        return (
          <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex items-end justify-center p-4">
            <div className="w-full max-w-md bg-card rounded-3xl shadow-elevated p-6 animate-slide-up space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Mensaje para {selectedContact.name}
                </h2>
                <Button variant="ghost" size="icon-sm" onClick={() => setIsCustomMessage(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <textarea
                  className="w-full h-32 p-3 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Escribe aquí tu mensaje..."
                  value={customMessageText}
                  onChange={(e) => setCustomMessageText(e.target.value)}
                  autoFocus
                />

                <Button
                  className="w-full"
                  onClick={() => handleSendEmail(selectedContact.email, selectedContact.name, false)}
                  disabled={!customMessageText.trim()}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Abrir cliente de correo
                </Button>
              </div>

              <Button variant="ghost" className="w-full" onClick={() => setIsCustomMessage(false)}>
                Volver
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl shadow-elevated p-6 animate-slide-up space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Dile a {selectedContact.name}
              </h2>
              <Button variant="ghost" size="icon-sm" onClick={() => setSelectedContact(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Puedes usar este mensaje predefinido o escribir uno propio.
              </p>

              <div className="p-4 bg-muted/50 rounded-xl border border-border/50 text-sm italic relative">
                <span className="text-2xl text-primary/20 absolute -top-2 -left-2">"</span>
                Hola {selectedContact.name},<br /><br />
                Necesito apoyo y me gustaría mucho que pudiéramos estar en contacto pronto.
                <span className="text-2xl text-primary/20 absolute -bottom-4 -right-2">"</span>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  className="w-full"
                  onClick={() => handleSendEmail(selectedContact.email, selectedContact.name, true)}
                  disabled={isSending}
                >
                  {isSending ? (
                    "Enviando..."
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enviar mensaje predefinido
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsCustomMessage(true)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Escribir mi propio mensaje
                </Button>
              </div>
            </div>

            <Button variant="ghost" className="w-full" onClick={() => setSelectedContact(null)}>
              Volver a contactos
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex items-end justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-3xl shadow-elevated p-6 animate-slide-up space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Contactar Apoyo
            </h2>
            <Button variant="ghost" size="icon-sm" onClick={() => setShowContacts(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Selecciona a quién deseas enviar el mensaje predefinido.
          </p>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {loadingContacts ? (
              <p className="text-sm text-center py-4">Cargando...</p>
            ) : contacts.length === 0 ? (
              <div className="text-center py-4 border-2 border-dashed rounded-xl">
                <p className="text-sm text-muted-foreground mb-2">No tienes contactos registrados.</p>
                <p className="text-xs text-muted-foreground">Ve a Misiones &gt; Red de Apoyo para agregar uno.</p>
              </div>
            ) : (
              contacts.map(contact => (
                <Button
                  key={contact.id}
                  variant="outline"
                  className="w-full justify-between h-auto py-3 px-4"
                  onClick={() => setSelectedContact(contact)}
                >
                  <span className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{contact.name}</span>
                  </span>
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </Button>
              ))
            )}
          </div>

          <Button variant="ghost" className="w-full" onClick={() => setShowContacts(false)}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex items-end justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-elevated p-6 animate-slide-up space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Apoyo Rápido
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Estás a salvo aquí. Elige lo que necesitas ahora.
        </p>

        <div className="space-y-3">
          <Button
            variant="warmth"
            className="w-full justify-start gap-3"
            onClick={() => setShowBreathing(true)}
          >
            <Wind className="w-5 h-5" />
            <span>Ejercicio de calma (90 seg)</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={() => setShowContacts(true)}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Mensaje a contacto de confianza</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => setShowResources(true)}
          >
            <BookOpen className="w-5 h-5" />
            <span>Recursos de ayuda profesional</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Esta app es un apoyo, no reemplaza ayuda profesional de emergencia.
        </p>
      </div>
    </div>
  );
}
