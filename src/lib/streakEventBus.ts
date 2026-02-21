/**
 * Streak Event Bus
 * Notifies the DailyChallenge widget when streak_count changes
 * (e.g. after a check-in from Index.tsx) so both header and widget show the same value.
 */

type StreakListener = (newStreak: number) => void;
const listeners: Set<StreakListener> = new Set();

export const streakEventBus = {
    emit: (newStreak: number) => {
        listeners.forEach(cb => cb(newStreak));
    },
    subscribe: (cb: StreakListener): (() => void) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
    },
};
