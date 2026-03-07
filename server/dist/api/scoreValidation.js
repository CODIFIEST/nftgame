"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeRunTicketOrThrow = exports.parseIncomingScore = exports.normalizeScoreRecord = exports.parseLimit = void 0;
const season_1 = require("./season");
const runTicket_1 = require("./runTicket");
const PLAYER_NAME_MAX = 32;
const TOKEN_MAX = 200;
const IMAGE_URL_MAX = 2048;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MIN_RUN_DURATION_MS = 3000;
const MAX_RUN_DURATION_MS = 60 * 60 * 1000;
const STAR_POINTS_MIN = 10;
const STAR_POINTS_MAX = 60;
function parseLimit(rawValue, fallback = DEFAULT_LIMIT) {
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
exports.parseLimit = parseLimit;
function normalizeScoreRecord(raw, id) {
    var _a, _b, _c;
    const data = (raw !== null && raw !== void 0 ? raw : {});
    if (typeof data.score !== "number" || Number.isNaN(data.score)) {
        return null;
    }
    const normalizedSeason = typeof data.season === "string" ? data.season.trim() : "";
    return {
        token: String((_a = data.token) !== null && _a !== void 0 ? _a : ""),
        imageURL: String((_b = data.imageURL) !== null && _b !== void 0 ? _b : ""),
        playerName: String((_c = data.playerName) !== null && _c !== void 0 ? _c : "anonymous"),
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
exports.normalizeScoreRecord = normalizeScoreRecord;
function validateImageUrl(value) {
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
    }
    catch (_a) {
        throw new Error("Image URL is invalid.");
    }
}
function parseIncomingScore(body) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const payload = (body !== null && body !== void 0 ? body : {});
    const scoreValue = Number((_a = payload.score) !== null && _a !== void 0 ? _a : 0);
    if (!Number.isFinite(scoreValue) || scoreValue < 0) {
        throw new Error("Score must be a non-negative number.");
    }
    const playerName = String((_b = payload.playerName) !== null && _b !== void 0 ? _b : "anonymous").trim() || "anonymous";
    const token = String((_c = payload.token) !== null && _c !== void 0 ? _c : "").trim().slice(0, TOKEN_MAX);
    const imageURL = validateImageUrl(String((_d = payload.imageURL) !== null && _d !== void 0 ? _d : ""));
    const ticketId = String((_e = payload.ticketId) !== null && _e !== void 0 ? _e : "").trim();
    if (!ticketId) {
        throw new Error("Missing run ticket.");
    }
    const runStartedAt = String((_f = payload.runStartedAt) !== null && _f !== void 0 ? _f : "").trim();
    const runEndedAt = String((_g = payload.runEndedAt) !== null && _g !== void 0 ? _g : "").trim();
    const startedMs = Date.parse(runStartedAt);
    const endedMs = Date.parse(runEndedAt);
    if (!Number.isFinite(startedMs) || !Number.isFinite(endedMs) || endedMs < startedMs) {
        throw new Error("Invalid run timestamps.");
    }
    const durationMs = endedMs - startedMs;
    if (durationMs < MIN_RUN_DURATION_MS || durationMs > MAX_RUN_DURATION_MS) {
        throw new Error("Run duration is outside allowed limits.");
    }
    const collectedStars = Math.floor(Number((_h = payload.collectedStars) !== null && _h !== void 0 ? _h : 0));
    const maxCombo = Math.floor(Number((_j = payload.maxCombo) !== null && _j !== void 0 ? _j : 0));
    const maxLevelReached = Math.floor(Number((_k = payload.maxLevelReached) !== null && _k !== void 0 ? _k : 0));
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
    const minStarsNeeded = (0, runTicket_1.minimumStarsToReachLevel)(maxLevelReached);
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
        season: (0, season_1.getCurrentSeason)(),
    };
}
exports.parseIncomingScore = parseIncomingScore;
function consumeRunTicketOrThrow(ticketStore, ticketId, ip) {
    var _a;
    const ticketCheck = ticketStore.consume(ticketId, ip);
    if (!ticketCheck.ok) {
        throw new Error((_a = ticketCheck.reason) !== null && _a !== void 0 ? _a : "Invalid run ticket.");
    }
}
exports.consumeRunTicketOrThrow = consumeRunTicketOrThrow;
