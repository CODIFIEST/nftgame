/** Type definition for pulse kind. */
export type PulseKind = "score" | "combo" | "level";

/** Type definition for HUD pulse timers. */
export type HudPulseTimers = {
    scorePulseTimer?: number;
    comboPulseTimer?: number;
    levelPulseTimer?: number;
};

/** Arguments for trigger HUD pulse. */
type TriggerHudPulseArgs = {
    kind: PulseKind;
    reducedMotion: boolean;
    timers: HudPulseTimers;
    setScorePulse: (value: boolean) => void;
    setComboPulse: (value: boolean) => void;
    setLevelPulse: (value: boolean) => void;
};

/** Performs trigger HUD pulse. */
export function triggerHudPulse(args: TriggerHudPulseArgs): void {
    if (args.reducedMotion) {
        return;
    }
    const durationMs = 220;
    if (args.kind === "score") {
        args.setScorePulse(false);
        if (args.timers.scorePulseTimer) {
            clearTimeout(args.timers.scorePulseTimer);
        }
        args.setScorePulse(true);
        args.timers.scorePulseTimer = window.setTimeout(() => {
            args.setScorePulse(false);
        }, durationMs);
        return;
    }
    if (args.kind === "combo") {
        args.setComboPulse(false);
        if (args.timers.comboPulseTimer) {
            clearTimeout(args.timers.comboPulseTimer);
        }
        args.setComboPulse(true);
        args.timers.comboPulseTimer = window.setTimeout(() => {
            args.setComboPulse(false);
        }, durationMs);
        return;
    }

    args.setLevelPulse(false);
    if (args.timers.levelPulseTimer) {
        clearTimeout(args.timers.levelPulseTimer);
    }
    args.setLevelPulse(true);
    args.timers.levelPulseTimer = window.setTimeout(() => {
        args.setLevelPulse(false);
    }, durationMs + 80);
}

/** Performs clear HUD pulse timers. */
export function clearHudPulseTimers(timers: HudPulseTimers): void {
    if (timers.scorePulseTimer) {
        clearTimeout(timers.scorePulseTimer);
    }
    if (timers.comboPulseTimer) {
        clearTimeout(timers.comboPulseTimer);
    }
    if (timers.levelPulseTimer) {
        clearTimeout(timers.levelPulseTimer);
    }
}
