import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Sparkles, Globe, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface VictoryInputProps {
  onSave: (text: string, isPublic: boolean) => Promise<{ success: boolean }>;
}

export function VictoryInput({ onSave }: VictoryInputProps) {
  const [victoryText, setVictoryText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const handleSave = async () => {
    if (!victoryText.trim() || isSaving) return;

    setIsSaving(true);
    const result = await onSave(victoryText.trim(), isPublic);
    setIsSaving(false);

    if (result.success) {
      setSaved(true);
      setVictoryText('');
    } else {
      // We assume the hook handles the specific toast, but if not:
      console.error("Victory save failed");
    }
  };

  if (saved) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-display font-bold mb-2">
            ¡Victoria guardada! 🎉
          </h3>
          <p className="text-sm text-muted-foreground">
            +10 XP bonus por registrar tu victoria
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => setSaved(false)}
          >
            Agregar otra
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          ¿Cuál fue tu victoria de hoy?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Hoy puse un límite cuando... / Me sentí orgulloso/a de... / Logré..."
          value={victoryText}
          onChange={(e) => setVictoryText(e.target.value)}
          className="min-h-[80px] resize-none"
          maxLength={280}
        />
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="w-4 h-4 text-primary animate-pulse" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
              <div className="flex flex-col">
                <Label htmlFor="share-victory" className="text-sm font-medium cursor-pointer">
                  Compartir en Comunidad
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {isPublic ? "Inspirarás a otros valientes" : "Solo tú podrás ver esta victoria"}
                </span>
              </div>
            </div>
            <Switch
              id="share-victory"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {victoryText.length}/280 caracteres
            </span>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!victoryText.trim() || isSaving}
              className="gap-1 shadow-md hover:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Guardar victoria
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
