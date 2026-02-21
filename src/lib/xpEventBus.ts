/**
 * Simple XP Event Bus
 * 
 * A lightweight pub/sub mechanism to notify the Dashboard
 * when XP is earned from outside the DailyChallenge context
 * (e.g. from ToolChallenge inside a tool's detail page).
 */

type XPListener = (xp: number) => void;

const listeners: Set<XPListener> = new Set();

export const xpEventBus = {
    /**
     * Emit an XP gained event. Call this after any XP-granting action
     * that happens outside of the DailyChallenge hook.
     */
    emit: (xp: number) => {
        listeners.forEach(cb => cb(xp));
    },

    /**
     * Subscribe to XP events. Returns an unsubscribe function.
     */
    subscribe: (cb: XPListener): (() => void) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
    },
};
