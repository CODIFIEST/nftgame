/** Performs combo momentum text. */
export function comboMomentumText(combo: number): string {
    return combo >= 4 ? "On fire" : "Build momentum";
}

/** Formats infinite level for UI display. */
export function formatInfiniteLevel(level: number): string {
    const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
    return `${safeLevel}/∞`;
}

/** Formats last sync time for UI display. */
export function formatLastSyncTime(lastSyncAt: string | null): string | null {
    if (!lastSyncAt) {
        return null;
    }
    const date = new Date(lastSyncAt);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toLocaleTimeString();
}
