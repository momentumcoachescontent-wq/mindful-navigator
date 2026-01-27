// Daily Challenge Configuration - "7 minutos más allá del miedo"

export type MissionType = 'hero' | 'calm' | 'scripts' | 'selfcare' | 'support' | 'sos_card' | 'roleplay' | 'risk_map';

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  duration: string;
  xp: number;
  isPremium: boolean;
  icon: string;
  action?: string;
}

export interface DayMissions {
  day: number; // 0 = Sunday, 1 = Monday, etc.
  freeMissions: Mission[];
  premiumBonuses: Mission[];
}

// Level thresholds and names
export const LEVELS = [
  { name: 'explorer', label: 'Explorador/a', minXP: 0, maxXP: 499 },
  { name: 'observer', label: 'Observador/a', minXP: 500, maxXP: 1499 },
  { name: 'regulator', label: 'Regulador/a', minXP: 1500, maxXP: 2999 },
  { name: 'guardian', label: 'Guardián/a de Límites', minXP: 3000, maxXP: 4999 },
  { name: 'strategist', label: 'Estratega', minXP: 5000, maxXP: 7999 },
  { name: 'mentor', label: 'Mentor/a', minXP: 8000, maxXP: Infinity },
];

// Streak multipliers
export const STREAK_MULTIPLIERS = {
  3: 1.10,  // +10% XP
  7: 1.20,  // +20% XP
  21: 1.30, // +30% XP (cap)
};

// Perfect day bonus
export const PERFECT_DAY_BONUS = 15;

// Streak rescues
export const FREE_RESCUES = 1;
export const PREMIUM_RESCUES = 3;

// Token rewards
export const TOKEN_REWARDS = {
  weekStreak: 1,
  perfectWeek: 2,
  achievement: 1,
};

// Token costs
export const TOKEN_COSTS = {
  premiumAudioPreview: 1,
  proSOSCard: 2,
  extendedSimulation: 3,
};

// Achievements/Badges
export const ACHIEVEMENTS = [
  { id: 'detector', label: 'Detector/a', description: '10 registros H.E.R.O.', requirement: { type: 'hero', count: 10 }, icon: 'Search' },
  { id: 'calm_pressure', label: 'Calma bajo presión', description: '10 C.A.L.M. completados', requirement: { type: 'calm', count: 10 }, icon: 'Wind' },
  { id: 'limit_said', label: 'Límite dicho', description: '5 scripts adaptados', requirement: { type: 'scripts', count: 5 }, icon: 'MessageSquare' },
  { id: 'real_selfcare', label: 'Autocuidado real', description: '7 días con micro-rutina', requirement: { type: 'selfcare', count: 7 }, icon: 'Heart' },
  { id: 'circle_active', label: 'Círculo activado', description: 'Red de apoyo configurada', requirement: { type: 'support', count: 3 }, icon: 'Users' },
  { id: 'sos_mode', label: 'Modo SOS', description: '10 tarjetas guardadas', requirement: { type: 'sos_card', count: 10 }, icon: 'Shield', isPremium: true },
  { id: 'strategist_badge', label: 'Estratega', description: '5 semáforos de riesgo', requirement: { type: 'risk_map', count: 5 }, icon: 'Target', isPremium: true },
  { id: 'week_streak', label: 'Constancia semanal', description: '7 días seguidos', requirement: { type: 'streak', count: 7 }, icon: 'Flame' },
  { id: 'month_warrior', label: 'Guerrero/a del mes', description: '30 días de reto', requirement: { type: 'streak', count: 30 }, icon: 'Trophy' },
];

// Base missions
const HERO_MISSION: Mission = {
  id: 'hero',
  type: 'hero',
  title: 'Detecta (H.E.R.O.)',
  description: 'Identifica 1 señal H.E.R.O. en una situación',
  duration: '60-90s',
  xp: 20,
  isPremium: false,
  icon: 'Search',
};

const CALM_MISSION: Mission = {
  id: 'calm',
  type: 'calm',
  title: 'Regula (C.A.L.M.)',
  description: 'Haz C.A.L.M. con foco en el paso del día',
  duration: '2-3 min',
  xp: 20,
  isPremium: false,
  icon: 'Wind',
};

const SCRIPTS_MISSION: Mission = {
  id: 'scripts',
  type: 'scripts',
  title: 'Scripts de límites',
  description: 'Escoge un script y adáptalo a tu caso',
  duration: '2-3 min',
  xp: 25,
  isPremium: false,
  icon: 'MessageSquare',
};

const SELFCARE_MISSION: Mission = {
  id: 'selfcare',
  type: 'selfcare',
  title: 'Plan de autocuidado',
  description: 'Añade 1 micro-acción de cuidado personal',
  duration: '1-2 min',
  xp: 25,
  isPremium: false,
  icon: 'Heart',
};

const SUPPORT_MISSION: Mission = {
  id: 'support',
  type: 'support',
  title: 'Red de apoyo',
  description: 'Confirma 1 contacto o escribe un mensaje de check-in',
  duration: '2-3 min',
  xp: 25,
  isPremium: false,
  icon: 'Users',
};

// Premium bonuses
const SOS_CARD_BONUS: Mission = {
  id: 'sos_card',
  type: 'sos_card',
  title: 'Tarjeta SOS del día',
  description: 'Elige tu Tarjeta SOS y guárdala en favoritas',
  duration: '1-2 min',
  xp: 30,
  isPremium: true,
  icon: 'Shield',
};

const ROLEPLAY_BONUS: Mission = {
  id: 'roleplay',
  type: 'roleplay',
  title: 'Simulador de conversación',
  description: 'Practica 2 turnos de una conversación difícil',
  duration: '5-7 min',
  xp: 60,
  isPremium: true,
  icon: 'MessageCircle',
};

const RISK_MAP_BONUS: Mission = {
  id: 'risk_map',
  type: 'risk_map',
  title: 'Semáforo de Riesgo',
  description: 'Evalúa una situación con el Mapa de Riesgo',
  duration: '5-8 min',
  xp: 100,
  isPremium: true,
  icon: 'AlertTriangle',
};

// Weekly schedule
export const WEEKLY_SCHEDULE: DayMissions[] = [
  // Sunday - Review + Victory Wall
  {
    day: 0,
    freeMissions: [HERO_MISSION, CALM_MISSION, { ...SELFCARE_MISSION, id: 'review', title: 'Revisión semanal', description: 'Revisa tu progreso y celebra tus victorias' }],
    premiumBonuses: [RISK_MAP_BONUS],
  },
  // Monday
  {
    day: 1,
    freeMissions: [HERO_MISSION, CALM_MISSION, SCRIPTS_MISSION],
    premiumBonuses: [SOS_CARD_BONUS],
  },
  // Tuesday
  {
    day: 2,
    freeMissions: [HERO_MISSION, CALM_MISSION, SELFCARE_MISSION],
    premiumBonuses: [{ ...SOS_CARD_BONUS, id: 'audio_state', title: 'Audio por estado', description: 'Escucha un audio según cómo te sientes', icon: 'Headphones' }],
  },
  // Wednesday
  {
    day: 3,
    freeMissions: [HERO_MISSION, CALM_MISSION, SUPPORT_MISSION],
    premiumBonuses: [ROLEPLAY_BONUS],
  },
  // Thursday
  {
    day: 4,
    freeMissions: [HERO_MISSION, CALM_MISSION, SCRIPTS_MISSION],
    premiumBonuses: [SOS_CARD_BONUS],
  },
  // Friday
  {
    day: 5,
    freeMissions: [HERO_MISSION, CALM_MISSION, SELFCARE_MISSION],
    premiumBonuses: [ROLEPLAY_BONUS],
  },
  // Saturday - Social mini-challenge
  {
    day: 6,
    freeMissions: [HERO_MISSION, CALM_MISSION, { ...SCRIPTS_MISSION, id: 'social', title: 'Mini-reto social', description: 'Practica límites en redes o con amigos' }],
    premiumBonuses: [SOS_CARD_BONUS],
  },
];

// H.E.R.O. categories
export const HERO_CATEGORIES = [
  { id: 'humillacion', label: 'Humillación', icon: '😔', description: 'Comentarios despectivos, burlas, críticas constantes' },
  { id: 'exigencias', label: 'Exigencias', icon: '😤', description: 'Demandas excesivas, expectativas irreales, presión' },
  { id: 'rechazo', label: 'Rechazo', icon: '💔', description: 'Ignorar sentimientos, minimizar, invalidar' },
  { id: 'ordenes', label: 'Órdenes', icon: '👊', description: 'Control, imposiciones, decisiones unilaterales' },
];

// C.A.L.M. steps with daily focus
export const CALM_STEPS = [
  { id: 'cuerpo', label: 'Cuerpo', icon: '🫁', description: 'Respira profundo 3 veces. ¿Dónde sientes tensión?' },
  { id: 'analiza', label: 'Analiza', icon: '🧠', description: '¿Qué necesitas realmente en este momento?' },
  { id: 'limita', label: 'Limita', icon: '🛡️', description: '¿Qué límite necesitas poner o reforzar?' },
  { id: 'mueve', label: 'Muévete', icon: '🚶', description: 'Cambia de posición, sal un momento, estira' },
];

// Script templates
export const SCRIPT_TEMPLATES = [
  { id: 'soft', level: 'Suave', template: 'Entiendo tu punto de vista, y al mismo tiempo necesito [tu necesidad].' },
  { id: 'firm', level: 'Firme', template: 'Aprecio que me compartas esto. Mi decisión es [tu límite] y no está en negociación.' },
  { id: 'final', level: 'Última advertencia', template: 'He sido claro/a sobre mis límites. Si esto continúa, [consecuencia].' },
];

// Selfcare micro-actions
export const SELFCARE_ACTIONS = [
  { id: 'water', label: 'Beber agua', icon: '💧' },
  { id: 'walk', label: 'Caminar 5 min', icon: '🚶' },
  { id: 'sleep', label: 'Dormir 8 horas', icon: '😴' },
  { id: 'eat', label: 'Comer nutritivo', icon: '🥗' },
  { id: 'breathe', label: 'Respirar profundo', icon: '🫁' },
  { id: 'disconnect', label: 'Desconectar del teléfono', icon: '📵' },
  { id: 'nature', label: 'Tiempo en naturaleza', icon: '🌿' },
  { id: 'music', label: 'Escuchar música', icon: '🎵' },
];

// SOS Card types
export const SOS_CARD_TYPES = [
  { id: 'say', label: 'Qué decir', icon: '💬', color: 'bg-primary' },
  { id: 'not_say', label: 'Qué NO decir', icon: '🚫', color: 'bg-destructive' },
  { id: 'do', label: 'Qué hacer', icon: '✅', color: 'bg-success' },
];

// Helper function to get today's missions
export function getTodaysMissions(): DayMissions {
  const today = new Date().getDay();
  return WEEKLY_SCHEDULE[today] || WEEKLY_SCHEDULE[1]; // Default to Monday if something fails
}

// Helper function to calculate level from XP
export function getLevelFromXP(xp: number): typeof LEVELS[0] {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

// Helper function to get streak multiplier
export function getStreakMultiplier(streak: number): number {
  if (streak >= 21) return STREAK_MULTIPLIERS[21];
  if (streak >= 7) return STREAK_MULTIPLIERS[7];
  if (streak >= 3) return STREAK_MULTIPLIERS[3];
  return 1;
}

// Helper function to calculate XP with multiplier
export function calculateXP(baseXP: number, streak: number): number {
  const multiplier = getStreakMultiplier(streak);
  return Math.floor(baseXP * multiplier);
}
