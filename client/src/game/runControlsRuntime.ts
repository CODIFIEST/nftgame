import type * as Phaser from "phaser";
import { handleRunTicketRequestError, markRunStarted, type RunSessionState } from "./runSession";

/** Arguments for request run ticket. */
type RequestRunTicketArgs = {
    requestRunTicket: () => Promise<void>;
    runSession: RunSessionState;
};

/** Arguments for begin run. */
type BeginRunArgs = {
    sceneRef: Phaser.Scene | null;
    hasRunStarted: boolean;
    isDead: boolean;
    runSession: RunSessionState;
    level: number;
    requestRunTicket: () => Promise<void>;
    setHasRunStarted: (value: boolean) => void;
    setShowStartOverlay: (value: boolean) => void;
    setIsPaused: (value: boolean) => void;
    playTone: (frequency: number, durationMs: number, gain?: number, type?: OscillatorType) => void;
};

/** Arguments for toggle pause. */
type TogglePauseArgs = {
    sceneRef: Phaser.Scene | null;
    hasRunStarted: boolean;
    isDead: boolean;
    showGameOver: boolean;
    isLevelTransitioning: boolean;
    isPaused: boolean;
    setIsPaused: (value: boolean) => void;
};

/** Arguments for keydown. */
type KeydownArgs = {
    event: KeyboardEvent;
    showStartOverlay: boolean;
    hasRunStarted: boolean;
    beginRun: () => Promise<void>;
    togglePause: () => void;
};

/** Requests run ticket with handling. */
export async function requestRunTicketWithHandling(args: RequestRunTicketArgs): Promise<void> {
    try {
        await args.requestRunTicket();
    } catch (error) {
        handleRunTicketRequestError(error, args.runSession);
        if (args.runSession.runTicketSupportAvailable === false) {
            return;
        }
        console.error("[GameDebug] failed to request run ticket", error);
    }
}

/** Starts run runtime. */
export async function beginRunRuntime(args: BeginRunArgs): Promise<void> {
    if (!args.sceneRef || args.hasRunStarted || args.isDead) {
        return;
    }
    if (!args.runSession.runTicketId) {
        await requestRunTicketWithHandling({
            requestRunTicket: args.requestRunTicket,
            runSession: args.runSession,
        });
    }
    args.setHasRunStarted(true);
    markRunStarted(args.runSession, args.level);
    args.setShowStartOverlay(false);
    args.setIsPaused(false);
    args.sceneRef.physics.resume();
    args.playTone(640, 100, 0.02, "triangle");
}

/** Toggles pause runtime. */
export function togglePauseRuntime(args: TogglePauseArgs): void {
    if (!args.sceneRef || !args.hasRunStarted || args.isDead || args.showGameOver || args.isLevelTransitioning) {
        return;
    }
    const nextPaused = !args.isPaused;
    args.setIsPaused(nextPaused);
    if (nextPaused) {
        args.sceneRef.physics.pause();
    } else {
        args.sceneRef.physics.resume();
    }
}

/** Handles run control keydown. */
export function handleRunControlKeydown(args: KeydownArgs): void {
    if (args.event.key === "Escape") {
        args.togglePause();
    }
    if (args.event.key === "Enter" && args.showStartOverlay && !args.hasRunStarted) {
        void args.beginRun();
    }
}
