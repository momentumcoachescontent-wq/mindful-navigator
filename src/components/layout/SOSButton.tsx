import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { SOSModal } from "@/components/sos/SOSModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function SOSButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hideSos, setHideSos] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('hide_sos').eq('user_id', user.id).single();
      if (data?.hide_sos) {
        setHideSos(true);
      }
    };
    fetchProfile();
  }, [user]);

  if (hideSos) {
    return <SOSModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
  }

  return (
    <>
      <Button
        variant="sos"
        size="icon-lg"
        className="fixed bottom-24 right-4 z-50 rounded-full animate-pulse-soft"
        onClick={() => setIsOpen(true)}
        aria-label="Botón de ayuda rápida"
      >
        <span className="text-2xl leading-none select-none" role="img" aria-label="SOS">🆘</span>
      </Button>

      <SOSModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
