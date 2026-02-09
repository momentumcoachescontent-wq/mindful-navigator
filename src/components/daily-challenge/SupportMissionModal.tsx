import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Sparkles, Users, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SupportMissionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (metadata: Record<string, unknown>) => Promise<{ success: boolean; xpEarned?: number }>;
}

interface TrustedContact {
  id: string;
  name: string;
  relationship: string | null;
  email?: string | null;
}

export function SupportMissionModal({ open, onClose, onComplete }: SupportMissionModalProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  useEffect(() => {
    if (open && user) {
      loadContacts();
    }
  }, [open, user]);

  const loadContacts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('trusted_contacts')
      .select('id, name, relationship')
      .eq('user_id', user.id)
      .limit(5);

    if (data) {
      setContacts(data);
    }
  };

  const handleAddContact = async () => {
    if (!user || !newContactName.trim()) return;

    const { data, error } = await supabase
      .from('trusted_contacts')
      .insert([{ user_id: user.id, name: newContactName.trim() }] as never)
      .select('id, name, relationship')
      .single();

    if (!error && data) {
      setContacts(prev => [...prev, data]);
      setNewContactName('');
      setIsAddingContact(false);
      setSelectedContact(data.id);
    }
  };

  const handleComplete = async () => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    const result = await onComplete({
      contactId: selectedContact,
      message: checkInMessage.trim() || null,
    });
    setIsSubmitting(false);

    if (result.success) {
      setEarnedXP(result.xpEarned || 25);
      setCompleted(true);
    }
  };

  const handleClose = () => {
    setSelectedContact(null);
    setCheckInMessage('');
    setIsAddingContact(false);
    setNewContactName('');
    setCompleted(false);
    onClose();
  };

  if (completed) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">¡Misión completada!</h3>
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              +{earnedXP} XP
            </Badge>
            <p className="text-sm text-muted-foreground mb-6">
              Tu red de apoyo es clave. Mantén estos contactos activos.
            </p>
            <Button onClick={handleClose}>Continuar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Misión: Red de apoyo
          </DialogTitle>
          <DialogDescription>
            Confirma un contacto o escribe un mensaje de check-in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing contacts */}
          {contacts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Tus contactos de confianza:</p>
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact.id)}
                    className={cn(
                      "w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all text-left",
                      selectedContact === contact.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {contact.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      {contact.relationship && (
                        <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add new contact */}
          {isAddingContact ? (
              <Input
                placeholder="Nombre del contacto"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="mb-2"
              />
              <Input
                placeholder="Correo electrónico (para emergencias)"
                type="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsAddingContact(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleAddContact} disabled={!newContactName.trim()}>
                  Agregar
                </Button>
              </div>
            </div>
        ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsAddingContact(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Agregar nuevo contacto
        </Button>
          )}

        {/* Check-in message */}
        {selectedContact && (
          <div className="animate-fade-up space-y-2">
            <p className="text-sm font-medium">
              Escribe un mensaje de check-in (opcional):
            </p>
            <Textarea
              placeholder="Hola, solo quería saber cómo estás..."
              value={checkInMessage}
              onChange={(e) => setCheckInMessage(e.target.value)}
              className="min-h-[60px]"
            />
            <p className="text-xs text-muted-foreground">
              No se enviará automáticamente. Es solo para ti.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!selectedContact || isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Completar misión'}
          </Button>
        </div>
      </div>
    </DialogContent>
    </Dialog >
  );
}
