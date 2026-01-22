import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SOSModal } from "@/components/sos/SOSModal";

export function SOSButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="sos"
        size="icon-lg"
        className="fixed bottom-24 right-4 z-50 rounded-full animate-pulse-soft"
        onClick={() => setIsOpen(true)}
        aria-label="Botón de ayuda rápida"
      >
        <Heart className="w-6 h-6 fill-current" />
      </Button>
      
      <SOSModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
