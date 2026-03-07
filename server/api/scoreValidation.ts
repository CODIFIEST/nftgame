import { getCurrentSeason } from "./season";
import { HighScore } from "../domain/highscore";

const PLAYER_NAME_MAX = 32;
const TOKEN_MAX = 200;
const IMAGE_URL_MAX = 2048;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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
    const payload = (body ?? {}) as Partial<HighScore>;
    const scoreValue = Number(payload.score ?? 0);
    if (!Number.isFinite(scoreValue) || scoreValue < 0) {
        throw new Error("Score must be a non-negative number.");
    }

    const playerName = String(payload.playerName ?? "anonymous").trim() || "anonymous";
    const token = String(payload.token ?? "").trim().slice(0, TOKEN_MAX);
    const imageURL = validateImageUrl(String(payload.imageURL ?? ""));

    return {
        token,
        imageURL,
        playerName: playerName.slice(0, PLAYER_NAME_MAX),
        score: Math.floor(scoreValue),
        season: getCurrentSeason(),
    };
}
