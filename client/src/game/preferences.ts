/** Shared constant for reduced motion key. */
export const REDUCED_MOTION_KEY = "nftgame.reducedMotion";
/** Shared constant for left handed key. */
export const LEFT_HANDED_KEY = "nftgame.leftHandedControls";

/** Type definition for gameplay preferences. */
export type GameplayPreferences = {
    reducedMotion: boolean;
    leftHandedMobileControls: boolean;
};

/** Loads gameplay preferences. */
export function loadGameplayPreferences(): GameplayPreferences {
    if (typeof window === "undefined") {
        return {
            reducedMotion: false,
            leftHandedMobileControls: false,
        };
    }

    return {
        reducedMotion: localStorage.getItem(REDUCED_MOTION_KEY) === "1",
        leftHandedMobileControls: localStorage.getItem(LEFT_HANDED_KEY) === "1",
    };
}

/** Performs persist gameplay preferences. */
export function persistGameplayPreferences(prefs: GameplayPreferences): void {
    if (typeof window === "undefined") {
        return;
    }
    localStorage.setItem(REDUCED_MOTION_KEY, prefs.reducedMotion ? "1" : "0");
    localStorage.setItem(LEFT_HANDED_KEY, prefs.leftHandedMobileControls ? "1" : "0");
}
