"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const scoreValidation_1 = require("../api/scoreValidation");
const runTicket_1 = require("../api/runTicket");
(0, node_test_1.default)("parseLimit clamps values within bounds", () => {
    strict_1.default.equal((0, scoreValidation_1.parseLimit)("10", 50), 10);
    strict_1.default.equal((0, scoreValidation_1.parseLimit)("0", 50), 1);
    strict_1.default.equal((0, scoreValidation_1.parseLimit)("999", 50), 100);
    strict_1.default.equal((0, scoreValidation_1.parseLimit)(undefined, 50), 50);
});
(0, node_test_1.default)("parseIncomingScore normalizes valid payload", () => {
    const now = Date.now();
    const parsed = (0, scoreValidation_1.parseIncomingScore)({
        token: "abc",
        imageURL: "https://example.com/a.png",
        playerName: "runner  ",
        score: 122,
        ticketId: "ticket-1",
        runStartedAt: new Date(now - 30000).toISOString(),
        runEndedAt: new Date(now).toISOString(),
        collectedStars: 12,
        maxCombo: 3,
        maxLevelReached: 2,
    });
    strict_1.default.equal(parsed.token, "abc");
    strict_1.default.equal(parsed.imageURL, "https://example.com/a.png");
    strict_1.default.equal(parsed.playerName, "runner");
    strict_1.default.equal(parsed.score, 122);
    strict_1.default.equal(parsed.ticketId, "ticket-1");
    strict_1.default.match(parsed.season, /^\d{4}-Q[1-4]$/);
});
(0, node_test_1.default)("parseIncomingScore rejects invalid image url", () => {
    const now = Date.now();
    strict_1.default.throws(() => (0, scoreValidation_1.parseIncomingScore)({
        imageURL: "ftp://example.com/a.png",
        score: 10,
        ticketId: "ticket-1",
        runStartedAt: new Date(now - 30000).toISOString(),
        runEndedAt: new Date(now).toISOString(),
        collectedStars: 1,
        maxCombo: 1,
        maxLevelReached: 1,
    }), /Image URL is invalid|Image URL must use http or https/);
});
(0, node_test_1.default)("parseIncomingScore rejects negative score", () => {
    const now = Date.now();
    strict_1.default.throws(() => (0, scoreValidation_1.parseIncomingScore)({
        score: -2,
        ticketId: "ticket-1",
        runStartedAt: new Date(now - 30000).toISOString(),
        runEndedAt: new Date(now).toISOString(),
        collectedStars: 1,
        maxCombo: 1,
        maxLevelReached: 1,
    }), /non-negative/);
});
(0, node_test_1.default)("consumeRunTicketOrThrow accepts fresh ticket and rejects reused ticket", () => {
    const store = new runTicket_1.RunTicketStore();
    const issued = store.issue("ip-1");
    strict_1.default.doesNotThrow(() => (0, scoreValidation_1.consumeRunTicketOrThrow)(store, issued.ticketId, "ip-1"));
    strict_1.default.throws(() => (0, scoreValidation_1.consumeRunTicketOrThrow)(store, issued.ticketId, "ip-1"), /Ticket not found|already used/);
});
