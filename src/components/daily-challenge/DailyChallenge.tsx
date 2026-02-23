import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Flame, Clock, ChevronRight, Crown, Lock,
  Trophy, Target, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { getStreakMultiplier, type Mission } from '@/lib/daily-challenge-config';
import { ProgressHeader } from './ProgressHeader';
import { MissionCard } from './MissionCard';
import { VictoryInput } from './VictoryInput';
import { HeroMissionModal } from './HeroMissionModal';
import { CalmMissionModal } from './CalmMissionModal';
import { ScriptsMissionModal } from './ScriptsMissionModal';
import { SelfcareMissionModal } from './SelfcareMissionModal';
import { SupportMissionModal } from './SupportMissionModal';
import { SOSCardMissionModal } from './SOSCardMissionModal';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

type ActiveModal = 'hero' | 'calm' | 'scripts' | 'selfcare' | 'support' | 'sos_card' | 'roleplay' | 'risk_map' | 'audio' | null;

export function DailyChallenge() {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const {
    loading,
    progress,
    level,
    streak,
    todaysMissions,
    todaysXP,
    isMissionCompleted,
    completeMission,
    saveVictory,
    progressToNextLevel,
    consumeToken,
  } = useDailyChallenge();

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);

  // States for Shadow Contract and Unlock Premium
  const [contractMission, setContractMission] = useState<Mission | null>(null);
  const [unlockMission, setUnlockMission] = useState<Mission | null>(null);

  // Replaced direct handleStartMission logic from UI:
  const handleInitiate = (mission: Mission) => {
    // 1. Premium Mission clicked by a non-premium user
    if (mission.isPremium && !isPremium) {
      if (progress.powerTokens > 0) {
        setUnlockMission(mission);
      } else {
        navigate('/premium');
      }
      return;
    }

    // 2. Free Mission (Shadow Contract) clicked
    if (!mission.isPremium) {
      setContractMission(mission);
      return;
    }

    // 3. Premium user clicking a Premium Mission
    handleStartMission(mission);
  };

  const handleStartMission = (mission: Mission) => {
    // Handle premium tools that redirect to their pages
    if (mission.type === 'roleplay') {
      navigate('/tools/simulador-conversaciones');
      return;
    }
    if (mission.type === 'risk_map') {
      navigate('/tools/mapa-riesgo');
      return;
    }
    if (mission.id === 'audio_state') {
      navigate('/tools/biblioteca-audios');
      return;
    }

    setCurrentMission(mission);
    setActiveModal(mission.type as ActiveModal);
  };

  const handleCompleteMission = async (metadata: Record<string, unknown>) => {
    if (!currentMission) return { success: false };

    const result = await completeMission(currentMission, metadata);
    if (result.success) {
      // Brutalist Celebration (Dark confetti)
      const colors = ['#000000', '#2B2B2B', '#FF3B30', '#00F5D4'];
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: colors,
        shapes: ['square'],
        disableForReducedMotion: true
      });
    }
    return result;
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setCurrentMission(null);
  };

  const xpMultiplier = getStreakMultiplier(streak);

  // Calculate completion progress
  const freeMissionsCompleted = todaysMissions.freeMissions.filter(m => isMissionCompleted(m.id)).length;
  const premiumMissionsCompleted = todaysMissions.premiumBonuses.filter(m => isMissionCompleted(m.id)).length;
  const allFreeDone = freeMissionsCompleted === todaysMissions.freeMissions.length;

  if (!user) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-6 text-center">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-display font-bold mb-2">Reto Diario</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Inicia sesión para acceder al reto "7 minutos más allá del miedo"
          </p>
          <Button onClick={() => navigate('/auth')}>
            Iniciar sesión
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const today = new Date().getDay();

  return (
    <div className="space-y-4">
      {/* Progress Header Card */}
      <Card className="brutal-card border-[hsl(var(--turquoise)_/_0.5)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Reto Diario
            </span>
            <Badge variant="outline" className="font-normal">
              {dayNames[today]}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressHeader
            level={level}
            totalXP={progress.totalXP}
            todaysXP={todaysXP}
            streak={streak}
            powerTokens={progress.powerTokens}
            progressToNextLevel={progressToNextLevel}
          />
        </CardContent>
      </Card>

      {/* Missions */}
      <Card className="brutal-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-coral" />
              CONTRATOS DE SOMBRA
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {freeMissionsCompleted}/{todaysMissions.freeMissions.length} completadas
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Free missions */}
          {todaysMissions.freeMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isCompleted={isMissionCompleted(mission.id)}
              isPremiumUser={isPremium}
              xpMultiplier={xpMultiplier}
              onStart={() => handleInitiate(mission)}
            />
          ))}

          {/* Perfect day indicator */}
          {allFreeDone && (
            <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center animate-fade-up">
              <div className="flex items-center justify-center gap-2 text-success mb-1">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">¡Día Perfecto!</span>
              </div>
              <p className="text-xs text-muted-foreground">+15 XP bonus por completar todas las misiones</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Bonuses */}
      <Card className="brutal-card border-amber-500/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Bonus Premium
            {!isPremium && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                Desbloquear
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysMissions.premiumBonuses.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isCompleted={isMissionCompleted(mission.id)}
              isPremiumUser={isPremium}
              xpMultiplier={xpMultiplier}
              onStart={() => handleInitiate(mission)}
            />
          ))}

          {!isPremium && (
            <Button
              variant="warmth"
              className="w-full"
              onClick={() => navigate('/premium')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Desbloquear Premium
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Victory Input */}
      <VictoryInput onSave={saveVictory} />

      {/* Dialog for Shadow Contract */}
      <Dialog open={!!contractMission} onOpenChange={(open) => !open && setContractMission(null)}>
        <DialogContent className="sm:max-w-md bg-card border-2 border-primary/20 brutal-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
              <Flame className="w-5 h-5 text-coral" />
              Firma tu Contrato de Sombra
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Al aceptar, te comprometes verdaderamente a observar tu mente y completar esta misión antes de que acabe el día: <br />
              <strong className="text-foreground mt-2 block">"{contractMission?.title}"</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex sm:justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => setContractMission(null)}
              className="w-full sm:w-auto"
            >
              Declinar
            </Button>
            <Button
              className="w-full sm:w-auto brutal-btn bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                if (contractMission) {
                  handleStartMission(contractMission);
                }
                setContractMission(null);
              }}
            >
              Me Comprometo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Unlock Premium with Power Token */}
      <Dialog open={!!unlockMission} onOpenChange={(open) => !open && setUnlockMission(null)}>
        <DialogContent className="sm:max-w-md bg-card border-2 border-amber-500/50 brutal-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Desbloqueo Táctico
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              ¿Quieres consumir <strong>1 Power Token</strong> para acceder temporalmente hoy al Bonus Premium: <br />
              <strong className="text-foreground block mt-1">"{unlockMission?.title}"</strong>?
              <br /><br />
              <span className="text-xs">Tienes {progress.powerTokens} Power Tokens en tu inventario.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex sm:justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => setUnlockMission(null)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              className="w-full sm:w-auto brutal-btn bg-amber-500 hover:bg-amber-600 text-white"
              onClick={async () => {
                const consumed = await consumeToken();
                if (consumed && unlockMission) {
                  // Bypass standard logic since it's already "unlocked" locally for execution immediately
                  handleStartMission(unlockMission);
                }
                setUnlockMission(null);
              }}
            >
              Gastar 1 Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mission Modals */}
      <HeroMissionModal
        open={activeModal === 'hero'}
        onClose={handleCloseModal}
        onComplete={handleCompleteMission}
      />
      <CalmMissionModal
        open={activeModal === 'calm'}
        onClose={handleCloseModal}
        onComplete={handleCompleteMission}
      />
      <ScriptsMissionModal
        open={activeModal === 'scripts'}
        onClose={handleCloseModal}
        onComplete={handleCompleteMission}
      />
      <SelfcareMissionModal
        open={activeModal === 'selfcare'}
        onClose={handleCloseModal}
        onComplete={handleCompleteMission}
      />
      <SupportMissionModal
        open={activeModal === 'support'}
        onClose={handleCloseModal}
        onComplete={handleCompleteMission}
      />
      <SOSCardMissionModal
        open={activeModal === 'sos_card'}
        onClose={handleCloseModal}
        onComplete={handleCompleteMission}
      />
    </div>
  );
}
