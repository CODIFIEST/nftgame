"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minimumStarsToReachLevel = exports.starCountForLevel = exports.RunTicketStore = void 0;
const node_crypto_1 = require("node:crypto");
const TICKET_TTL_MS = 45 * 60 * 1000;
const MAX_TICKETS = 10000;
class RunTicketStore {
    constructor() {
        this.tickets = new Map();
    }
    issue(ip) {
        const nowMs = Date.now();
        this.compact(nowMs);
        const ticketId = (0, node_crypto_1.randomUUID)();
        this.tickets.set(ticketId, { issuedAtMs: nowMs, ip });
        return { ticketId, issuedAt: new Date(nowMs).toISOString() };
    }
    consume(ticketId, ip, nowMs = Date.now()) {
        this.compact(nowMs);
        const record = this.tickets.get(ticketId);
        if (!record) {
            return { ok: false, reason: "Ticket not found or already used." };
        }
        if (record.ip && record.ip !== ip) {
            return { ok: false, reason: "Ticket origin mismatch." };
        }
        if (nowMs - record.issuedAtMs > TICKET_TTL_MS) {
            this.tickets.delete(ticketId);
            return { ok: false, reason: "Ticket expired." };
        }
        this.tickets.delete(ticketId);
        return { ok: true };
    }
    compact(nowMs) {
        for (const [ticketId, record] of this.tickets.entries()) {
            if (nowMs - record.issuedAtMs > TICKET_TTL_MS) {
                this.tickets.delete(ticketId);
            }
        }
        if (this.tickets.size <= MAX_TICKETS) {
            return;
        }
        const oldest = [...this.tickets.entries()].sort((a, b) => a[1].issuedAtMs - b[1].issuedAtMs);
        const removeCount = this.tickets.size - MAX_TICKETS;
        for (let i = 0; i < removeCount; i += 1) {
            this.tickets.delete(oldest[i][0]);
        }
    }
}
exports.RunTicketStore = RunTicketStore;
function starCountForLevel(levelNumber) {
    return 10 + Math.min(16, Math.floor((levelNumber - 1) / 2));
}
exports.starCountForLevel = starCountForLevel;
function minimumStarsToReachLevel(levelNumber) {
    if (levelNumber <= 1) {
        return 0;
    }
    let total = 0;
    for (let lvl = 1; lvl < levelNumber; lvl += 1) {
        total += starCountForLevel(lvl);
    }
    return total;
}
exports.minimumStarsToReachLevel = minimumStarsToReachLevel;
