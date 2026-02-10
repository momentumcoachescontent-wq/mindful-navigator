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

// Seeded random number generator (Linear Congruential Generator)
function seededRandom(seed: number) {
  const m = 0x80000000;
  const a = 1103515245;
  const c = 12345;
  let state = seed ? seed : Math.floor(Math.random() * (m - 1));

  return function () {
    state = (a * state + c) % m;
    return state / (m - 1);
  };
}

// Generate a seed from the date string (YYYY-MM-DD)
function getSeedFromDate(date: Date): number {
  const str = date.toISOString().split('T')[0].replace(/-/g, '');
  return parseInt(str, 10);
}

const VARIABLE_MISSIONS = [SCRIPTS_MISSION, SELFCARE_MISSION, SUPPORT_MISSION];

const PREMIUM_MISSIONS = [
  SOS_CARD_BONUS,
  ROLEPLAY_BONUS,
  RISK_MAP_BONUS,
  { ...SOS_CARD_BONUS, id: 'audio_state', title: 'Audio por estado', description: 'Escucha un audio según cómo te sientes', icon: 'Headphones' }
];

// Helper function to get today's missions
export function getTodaysMissions(): DayMissions {
  const todayDate = new Date();
  const todayDay = todayDate.getDay();

  // Use a seed based on the date to ensure everyone gets the same "random" missions for the day
  const seed = getSeedFromDate(todayDate);
  const random = seededRandom(seed);

  // Core missions: Always HERO and CALM
  const dailyMissions = [HERO_MISSION, CALM_MISSION];

  // 3rd Mission: Randomly selected from variable pool
  // On Sundays, we prioritize the Review mission
  if (todayDay === 0) {
    dailyMissions.push({
      ...SELFCARE_MISSION,
      id: 'review',
      title: 'Revisión semanal',
      description: 'Revisa tu progreso y celebra tus victorias'
    });
  } else {
    const variableIndex = Math.floor(random() * VARIABLE_MISSIONS.length);
    dailyMissions.push(VARIABLE_MISSIONS[variableIndex]);
  }

  // Premium Bonus: Randomly selected
  const premiumIndex = Math.floor(random() * PREMIUM_MISSIONS.length);
  const premiumBonus = PREMIUM_MISSIONS[premiumIndex];

  return {
    day: todayDay,
    freeMissions: dailyMissions,
    premiumBonuses: [premiumBonus],
  };
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
