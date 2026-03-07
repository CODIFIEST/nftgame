import { getCurrentSeason } from "./season";
import { HighScore } from "../domain/highscore";
import { minimumStarsToReachLevel, RunTicketStore } from "./runTicket";

const PLAYER_NAME_MAX = 32;
const TOKEN_MAX = 200;
const IMAGE_URL_MAX = 2048;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MIN_RUN_DURATION_MS = 15_000;
const MAX_RUN_DURATION_MS = 60 * 60 * 1000;
const STAR_POINTS_MIN = 10;
const STAR_POINTS_MAX = 60;

export type IncomingScorePayload = Omit<HighScore, "id" | "season"> & {
    season?: string;
};

export function parseLimit(rawValue: unknown, fallback = DEFAULT_LIMIT): number {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
        return fallback;
    }
    const normalized = Math.floor(value);
    if (normalized < 1) {
        return 1;
    }
    if (normalized > MAX_LIMIT) {
        return MAX_LIMIT;
    }
    return normalized;
}

export function normalizeScoreRecord(raw: unknown, id: string): HighScore | null {
    const data = (raw ?? {}) as Partial<HighScore>;
    if (typeof data.score !== "number" || Number.isNaN(data.score)) {
        return null;
    }
    const normalizedSeason = typeof data.season === "string" ? data.season.trim() : "";
    return {
        token: String(data.token ?? ""),
        imageURL: String(data.imageURL ?? ""),
        playerName: String(data.playerName ?? "anonymous"),
        score: Math.max(0, Math.floor(data.score)),
        ticketId: typeof data.ticketId === "string" ? data.ticketId : undefined,
        runStartedAt: typeof data.runStartedAt === "string" ? data.runStartedAt : undefined,
        runEndedAt: typeof data.runEndedAt === "string" ? data.runEndedAt : undefined,
        maxCombo: typeof data.maxCombo === "number" ? data.maxCombo : undefined,
        collectedStars: typeof data.collectedStars === "number" ? data.collectedStars : undefined,
        maxLevelReached: typeof data.maxLevelReached === "number" ? data.maxLevelReached : undefined,
        season: normalizedSeason,
        id,
    };
}

function validateImageUrl(value: string): string {
    const trimmed = value.trim().slice(0, IMAGE_URL_MAX);
    if (!trimmed) {
        return "";
    }
    if (trimmed.startsWith("data:image/")) {
        return trimmed;
    }
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            throw new Error("Image URL must use http or https.");
        }
        return parsed.toString().slice(0, IMAGE_URL_MAX);
    } catch {
        throw new Error("Image URL is invalid.");
    }
}

export function parseIncomingScore(body: unknown): Omit<HighScore, "id"> {
    const payload = (body ?? {}) as Partial<IncomingScorePayload>;
    const scoreValue = Number(payload.score ?? 0);
    if (!Number.isFinite(scoreValue) || scoreValue < 0) {
        throw new Error("Score must be a non-negative number.");
    }

    const playerName = String(payload.playerName ?? "anonymous").trim() || "anonymous";
    const token = String(payload.token ?? "").trim().slice(0, TOKEN_MAX);
    const imageURL = validateImageUrl(String(payload.imageURL ?? ""));
    const ticketId = String(payload.ticketId ?? "").trim();
    if (!ticketId) {
        throw new Error("Missing run ticket.");
    }

    const runStartedAt = String(payload.runStartedAt ?? "").trim();
    const runEndedAt = String(payload.runEndedAt ?? "").trim();
    const startedMs = Date.parse(runStartedAt);
    const endedMs = Date.parse(runEndedAt);
    if (!Number.isFinite(startedMs) || !Number.isFinite(endedMs) || endedMs < startedMs) {
        throw new Error("Invalid run timestamps.");
    }
    const durationMs = endedMs - startedMs;
    if (durationMs < MIN_RUN_DURATION_MS || durationMs > MAX_RUN_DURATION_MS) {
        throw new Error("Run duration is outside allowed limits.");
    }

    const collectedStars = Math.floor(Number(payload.collectedStars ?? 0));
    const maxCombo = Math.floor(Number(payload.maxCombo ?? 0));
    const maxLevelReached = Math.floor(Number(payload.maxLevelReached ?? 0));
    if (!Number.isFinite(collectedStars) || collectedStars < 1) {
        throw new Error("Invalid collected stars.");
    }
    if (!Number.isFinite(maxCombo) || maxCombo < 1 || maxCombo > 6) {
        throw new Error("Invalid max combo.");
    }
    if (!Number.isFinite(maxLevelReached) || maxLevelReached < 1) {
        throw new Error("Invalid max level reached.");
    }

    const minPossibleScore = collectedStars * STAR_POINTS_MIN;
    const maxPossibleScore = collectedStars * STAR_POINTS_MAX;
    if (scoreValue < minPossibleScore || scoreValue > maxPossibleScore) {
        throw new Error("Score does not match collected stars bounds.");
    }

    const minStarsNeeded = minimumStarsToReachLevel(maxLevelReached);
    if (collectedStars + 4 < minStarsNeeded) {
        throw new Error("Collected stars too low for reported level.");
    }

    return {
        token,
        imageURL,
        playerName: playerName.slice(0, PLAYER_NAME_MAX),
        score: Math.floor(scoreValue),
        ticketId,
        runStartedAt,
        runEndedAt,
        maxCombo,
        collectedStars,
        maxLevelReached,
        season: getCurrentSeason(),
    };
}

export function consumeRunTicketOrThrow(
    ticketStore: RunTicketStore,
    ticketId: string,
    ip: string,
): void {
    const ticketCheck = ticketStore.consume(ticketId, ip);
    if (!ticketCheck.ok) {
        throw new Error(ticketCheck.reason ?? "Invalid run ticket.");
    }
}
