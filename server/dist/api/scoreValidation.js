"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIncomingScore = exports.normalizeScoreRecord = exports.parseLimit = void 0;
const season_1 = require("./season");
const PLAYER_NAME_MAX = 32;
const TOKEN_MAX = 200;
const IMAGE_URL_MAX = 2048;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
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
    var _a, _b, _c, _d;
    const payload = (body !== null && body !== void 0 ? body : {});
    const scoreValue = Number((_a = payload.score) !== null && _a !== void 0 ? _a : 0);
    if (!Number.isFinite(scoreValue) || scoreValue < 0) {
        throw new Error("Score must be a non-negative number.");
    }
    const playerName = String((_b = payload.playerName) !== null && _b !== void 0 ? _b : "anonymous").trim() || "anonymous";
    const token = String((_c = payload.token) !== null && _c !== void 0 ? _c : "").trim().slice(0, TOKEN_MAX);
    const imageURL = validateImageUrl(String((_d = payload.imageURL) !== null && _d !== void 0 ? _d : ""));
    return {
        token,
        imageURL,
        playerName: playerName.slice(0, PLAYER_NAME_MAX),
        score: Math.floor(scoreValue),
        season: (0, season_1.getCurrentSeason)(),
    };
}
exports.parseIncomingScore = parseIncomingScore;
