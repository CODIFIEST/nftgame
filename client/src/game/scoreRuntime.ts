import axios from "axios";
import { buildScorePayload, ensureTicketForSubmissionOrFail, type RunSessionState } from "./runSession";
import { isRetryableScoreError, type ScorePayload, type ScoreSyncQueue } from "./scoreSync";
import { trackInfo } from "./telemetry";

/** Type definition for NFT like. */
type NftLike = {
    tokenAddress?: string;
    imageURL?: string;
};

/** Arguments for flush pending scores. */
type FlushPendingScoresArgs = {
    scoreQueue: ScoreSyncQueue;
    postScore: (payload: ScorePayload, timeoutMs: number) => Promise<void>;
    timeoutMs: number;
    retryDelaysMs: number[];
    refreshPendingSyncCount: () => void;
};

/** Arguments for save score. */
type SaveScoreArgs = {
    scoreQueue: ScoreSyncQueue;
    runSession: RunSessionState;
    score: number;
    playerName: string;
    selectedNft: NftLike | null;
    timeoutMs: number;
    retryDelaysMs: number[];
    requestRunTicket: () => Promise<void>;
    postScore: (payload: ScorePayload, timeoutMs: number) => Promise<void>;
    refreshPendingSyncCount: () => void;
    setSubmittingScore: (value: boolean) => void;
    setScoreSaveError: (value: string) => void;
};

/** Posts score payload. */
export async function postScorePayload(
    apiBaseUrl: string,
    payload: ScorePayload,
    timeoutMs: number,
): Promise<void> {
    await axios.post(`${apiBaseUrl}/scores`, payload, { timeout: timeoutMs });
}

/** Reads score save error message. */
export function readScoreSaveErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const serverMessage = typeof error.response?.data?.error === "string" ? error.response.data.error.trim() : "";
        if (serverMessage) {
            return `Score rejected: ${serverMessage}`;
        }
        if (typeof status === "number" && status >= 400 && status < 500 && status !== 429) {
            return "Score rejected by server validation.";
        }
    }
    return "Score saved locally and will auto-sync when connection returns.";
}

/** Performs flush pending scores runtime. */
export async function flushPendingScoresRuntime(args: FlushPendingScoresArgs): Promise<void> {
    const pending = args.scoreQueue.getPendingCount();
    if (pending === 0) {
        args.refreshPendingSyncCount();
        return;
    }
    trackInfo("pending_score_flush_started", { pending });
    const remaining = await args.scoreQueue.flush(args.postScore, args.timeoutMs, args.retryDelaysMs);
    args.refreshPendingSyncCount();
    trackInfo("pending_score_flush_completed", { remaining });
}

/** Saves score runtime. */
export async function saveScoreRuntime(args: SaveScoreArgs): Promise<void> {
    args.setSubmittingScore(true);
    args.setScoreSaveError("");

    if (args.runSession.runTicketSupportAvailable !== false && !args.runSession.runTicketId) {
        await args.requestRunTicket();
    }
    if (!ensureTicketForSubmissionOrFail(args.runSession)) {
        args.setScoreSaveError("Unable to verify run. Connect and retry.");
        args.setSubmittingScore(false);
        return;
    }

    const payload: ScorePayload = buildScorePayload({
        token: args.selectedNft?.tokenAddress ?? "",
        imageURL: args.selectedNft?.imageURL ?? "",
        score: args.score,
        playerName: args.playerName || "anonymous",
        session: args.runSession,
        fallbackStartedAt: new Date(Date.now() - 20_000).toISOString(),
    });

    try {
        await args.scoreQueue.postWithRetry(payload, args.postScore, args.timeoutMs, args.retryDelaysMs);
        args.refreshPendingSyncCount();
        console.log("[GameDebug] score payload uses original NFT", {
            token: payload.token,
            imageURL: payload.imageURL,
        });
    } catch (error) {
        if (isRetryableScoreError(error)) {
            args.scoreQueue.enqueue(payload);
            args.refreshPendingSyncCount();
        }
        args.setScoreSaveError(readScoreSaveErrorMessage(error));
        console.error("failed to save score", error);
    } finally {
        args.setSubmittingScore(false);
    }
}
