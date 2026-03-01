import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { SOSModal } from "@/components/sos/SOSModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function SOSButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hideSos, setHideSos] = useState(true); // default: HIDDEN unless user opts-in
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('hide_sos').eq('user_id', user.id).single();
      // Show SOS only when hide_sos is explicitly false (user opted-in)
      setHideSos(data?.hide_sos !== false);
    };
    fetchProfile();
  }, [user]);

  if (hideSos) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-lg"
        className="fixed bottom-24 right-4 z-50 hover:bg-transparent"
        onClick={() => setIsOpen(true)}
        aria-label="Botón de ayuda rápida SOS"
      >
        <span className="text-4xl leading-none select-none drop-shadow-lg" role="img" aria-label="SOS">🆘</span>
      </Button>

      <SOSModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
