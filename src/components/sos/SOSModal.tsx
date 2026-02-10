import { X, MessageCircle, Wind, BookOpen, User, Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { BreathingExercise } from "./BreathingExercise";
import { ProfessionalResources } from "./ProfessionalResources";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import emailjs from '@emailjs/browser';

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
  const [isSending, setIsSending] = useState(false);

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

  const handleSendEmail = async (email: string | null, name: string, usePredefined: boolean) => {
    if (!email) {
      toast({
        title: "Sin correo electrónico",
        description: `El contacto ${name} no tiene un correo registrado.`,
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    // Configuration for EmailJS
    // User provided keys directly
    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_59lgy53";
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_tfch3dk";
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "FSOyeuuDUXKDdHcT_";

    if (!SERVICE_ID || !PUBLIC_KEY) {
      toast({
        title: "Configuración requerida",
        description: "Falta configurar EmailJS. Por favor contacta al soporte técnico.",
        variant: "destructive",
      });
      console.error("EmailJS keys missing.");
      setIsSending(false);
      return;
    }

    let message = "";

    if (usePredefined) {
      message = `Hola ${name},\n\nNecesito apoyo y me gustaría mucho que pudiéramos estar en contacto pronto.\n\n`;
    } else {
      message = customMessageText;
    }

    const templateParams = {
      to_email: email,
      to_name: name,
      message: message,
      from_name: user?.user_metadata?.first_name || "Usuario de Mindful Navigator",
      reply_to: user?.email,
    };

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

      toast({
        title: "Mensaje enviado",
        description: `Se ha enviado un correo a ${name}.`,
      });

      setIsCustomMessage(false);
      setCustomMessageText('');
      setSelectedContact(null);
      // Optional: keep modal open or go back to main screen?
      // For now, let's keep them in the contact view but clear selection

    } catch (error: any) {
      console.error('Error sending SOS email:', error);

      let errorMessage = "No se pudo enviar el mensaje.";
      if (error?.text) errorMessage += ` Detalles: ${error.text}`;
      else if (error?.status) errorMessage += ` Status: ${error.status}`;
      else if (error?.message) errorMessage += ` Error: ${error.message}`;

      // Common error: 412 means Gmail scopes are missing. User needs to reconnect Gmail in EmailJS.
      if (error?.text?.includes("insufficient authentication scopes")) {
        errorMessage = "Error de permisos de Gmail. Por favor reconecta tu cuenta en EmailJS y marca la casilla de enviar correos.";
      }

      toast({
        title: "Error al enviar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
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
                  disabled={!customMessageText.trim() || isSending}
                >
                  {isSending ? (
                    "Enviando..."
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enviar mensaje
                    </>
                  )}
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
                  disabled={isSending}
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
