import axios from "axios";
import type { ScorePayload } from "./scoreSync";

/** Type definition for run session state. */
export type RunSessionState = {
    runTicketId: string;
    runStartedAtIso: string;
    collectedStars: number;
    maxComboReached: number;
    maxLevelReached: number;
    runTicketSupportAvailable: boolean | null;
};

/** Arguments for build score payload. */
type BuildScorePayloadArgs = {
    token: string;
    imageURL: string;
    score: number;
    playerName: string;
    session: RunSessionState;
    fallbackStartedAt: string;
};

/** Creates run session state. */
export function createRunSessionState(): RunSessionState {
    return {
        runTicketId: "",
        runStartedAtIso: "",
        collectedStars: 0,
        maxComboReached: 1,
        maxLevelReached: 1,
        runTicketSupportAvailable: null,
    };
}

/** Resets run session. */
export function resetRunSession(session: RunSessionState): void {
    session.runTicketId = "";
    session.runStartedAtIso = "";
    session.collectedStars = 0;
    session.maxComboReached = 1;
    session.maxLevelReached = 1;
}

/** Marks run started. */
export function markRunStarted(session: RunSessionState, level: number): void {
    session.runStartedAtIso = new Date().toISOString();
    session.maxLevelReached = Math.max(session.maxLevelReached, level);
}

/** Marks star collected. */
export function markStarCollected(session: RunSessionState, comboMultiplier: number): void {
    session.collectedStars += 1;
    session.maxComboReached = Math.max(session.maxComboReached, comboMultiplier);
}

/** Marks level reached. */
export function markLevelReached(session: RunSessionState, level: number): void {
    session.maxLevelReached = Math.max(session.maxLevelReached, level);
}

/** Requests run ticket. */
export async function requestRunTicket(apiBaseUrl: string, session: RunSessionState): Promise<void> {
    if (session.runTicketSupportAvailable === false) {
        return;
    }
    const response = await axios.post<{ ticketId: string; issuedAt: string }>(
        `${apiBaseUrl}/run-ticket`,
        {},
        { timeout: 8000 },
    );
    session.runTicketId = response.data.ticketId ?? "";
    session.runTicketSupportAvailable = true;
}

/** Handles run ticket request error. */
export function handleRunTicketRequestError(error: unknown, session: RunSessionState): void {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
        session.runTicketSupportAvailable = false;
    }
}

/** Ensures ticket for submission or fail. */
export function ensureTicketForSubmissionOrFail(session: RunSessionState): boolean {
    if (session.runTicketSupportAvailable === false) {
        return true;
    }
    return Boolean(session.runTicketId);
}

/** Builds score payload. */
export function buildScorePayload(args: BuildScorePayloadArgs): ScorePayload {
    const runEndedAt = new Date().toISOString();
    const legacyMode = args.session.runTicketSupportAvailable === false;
    return {
        token: args.token,
        imageURL: args.imageURL,
        score: args.score,
        playerName: args.playerName,
        ticketId: legacyMode ? "legacy-ticketless" : args.session.runTicketId,
        runStartedAt: legacyMode ? args.fallbackStartedAt : args.session.runStartedAtIso || args.fallbackStartedAt,
        runEndedAt,
        collectedStars: Math.max(1, args.session.collectedStars),
        maxCombo: Math.max(1, args.session.maxComboReached),
        maxLevelReached: Math.max(1, args.session.maxLevelReached),
    };
}
