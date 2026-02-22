import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function ScannerInput({ onSubmit, isLoading }: ScannerInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      onSubmit(text.trim());
    }
  };

  const prompts = [
    "Mi pareja me dice que nadie más me va a querer...",
    "Un compañero siempre me critica delante de todos...",
    "Siento que mi amigo solo me busca cuando necesita algo...",
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Habla con el Oráculo. Describe tu sombra..."
          className="w-full min-h-[140px] p-4 pr-12 bg-card brutal-card focus:border-primary focus:ring-0 resize-none text-foreground placeholder:text-muted-foreground transition-colors"
        />
      </div>

      {/* Example prompts */}
      {!text && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ecos comunes:</p>
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setText(prompt)}
                className="text-xs px-3 py-1.5 brutal-btn bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground focus:outline-none"
              >
                {prompt.slice(0, 35)}...
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        variant="calm"
        size="lg"
        className="w-full brutal-btn"
        onClick={handleSubmit}
        disabled={!text.trim() || isLoading}
      >
        {isLoading ? (
          <>
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>Consultando al Oráculo...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Revelar la Sombra</span>
          </>
        )}
      </Button>
    </div>
  );
}
