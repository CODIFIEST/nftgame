import { trackInfo, trackWarn } from "./telemetry.js";

export type ScorePayload = {
    token: string;
    imageURL: string;
    score: number;
    playerName: string;
    ticketId: string;
    runStartedAt: string;
    runEndedAt: string;
    collectedStars: number;
    maxCombo: number;
    maxLevelReached: number;
    season?: string;
    createdAt?: string;
};

type PostScoreFn = (payload: ScorePayload, timeoutMs: number) => Promise<void>;

const DEFAULT_QUEUE_KEY = "nftgame.pendingScores";
const DEFAULT_LAST_SYNC_KEY = "nftgame.lastScoreSyncAt";

function dedupeKey(payload: ScorePayload): string {
    return [
        payload.ticketId || "ticketless",
        payload.token || "anonymous",
        payload.score,
        payload.playerName || "anonymous",
        payload.runStartedAt || "start-unknown",
        payload.runEndedAt || "end-unknown",
        payload.season || "seasonless",
        payload.createdAt || "at-unknown",
    ].join("|");
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ScoreSyncQueue {
    private queueKey: string;
    private lastSyncKey: string;

    constructor(queueKey = DEFAULT_QUEUE_KEY, lastSyncKey = DEFAULT_LAST_SYNC_KEY) {
        this.queueKey = queueKey;
        this.lastSyncKey = lastSyncKey;
    }

    getPending(): ScorePayload[] {
        if (typeof window === "undefined") {
            return [];
        }
        const raw = localStorage.getItem(this.queueKey);
        if (!raw) {
            return [];
        }
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    getPendingCount(): number {
        return this.getPending().length;
    }

    getLastSyncAt(): string | null {
        if (typeof window === "undefined") {
            return null;
        }
        return localStorage.getItem(this.lastSyncKey);
    }

    private write(scores: ScorePayload[]): void {
        if (typeof window === "undefined") {
            return;
        }
        localStorage.setItem(this.queueKey, JSON.stringify(scores));
    }

    private setLastSyncNow(): void {
        if (typeof window === "undefined") {
            return;
        }
        localStorage.setItem(this.lastSyncKey, new Date().toISOString());
    }

    enqueue(payload: ScorePayload): void {
        const normalized: ScorePayload = {
            ...payload,
            createdAt: payload.createdAt ?? new Date().toISOString(),
        };
        const existing = this.getPending();
        const existingKeys = new Set(existing.map(dedupeKey));
        if (existingKeys.has(dedupeKey(normalized))) {
            trackInfo("score_queue_duplicate_dropped", { payload: normalized });
            return;
        }
        existing.push(normalized);
        if (existing.length > 40) {
            existing.splice(0, existing.length - 40);
        }
        this.write(existing);
        trackWarn("score_queued_for_retry", { pendingCount: existing.length });
    }

    async postWithRetry(
        payload: ScorePayload,
        postScore: PostScoreFn,
        timeoutMs: number,
        retryBaseDelaysMs: number[],
    ): Promise<void> {
        let lastError: unknown = null;
        for (let attempt = 0; attempt <= retryBaseDelaysMs.length; attempt += 1) {
            try {
                await postScore(payload, timeoutMs);
                this.setLastSyncNow();
                return;
            } catch (error) {
                lastError = error;
                if (attempt < retryBaseDelaysMs.length) {
                    const base = retryBaseDelaysMs[attempt];
                    const jitter = Math.floor(Math.random() * 220);
                    await wait(base + jitter);
                }
            }
        }
        throw lastError;
    }

    async flush(postScore: PostScoreFn, timeoutMs: number, retryBaseDelaysMs: number[]): Promise<number> {
        const pending = this.getPending();
        if (pending.length === 0) {
            return 0;
        }

        const remaining: ScorePayload[] = [];
        for (const payload of pending) {
            try {
                await this.postWithRetry(payload, postScore, timeoutMs, retryBaseDelaysMs);
            } catch {
                remaining.push(payload);
            }
        }
        this.write(remaining);
        if (remaining.length === 0) {
            this.setLastSyncNow();
        }
        return remaining.length;
    }
}
