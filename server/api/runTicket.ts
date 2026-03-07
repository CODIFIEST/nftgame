import { randomUUID } from "node:crypto";

type TicketRecord = {
    issuedAtMs: number;
    ip: string;
};

const TICKET_TTL_MS = 45 * 60 * 1000;
const MAX_TICKETS = 10_000;

export class RunTicketStore {
    private tickets = new Map<string, TicketRecord>();

    issue(ip: string): { ticketId: string; issuedAt: string } {
        const nowMs = Date.now();
        this.compact(nowMs);
        const ticketId = randomUUID();
        this.tickets.set(ticketId, { issuedAtMs: nowMs, ip });
        return { ticketId, issuedAt: new Date(nowMs).toISOString() };
    }

    consume(ticketId: string, ip: string, nowMs = Date.now()): { ok: boolean; reason?: string } {
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

    private compact(nowMs: number): void {
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

export function starCountForLevel(levelNumber: number): number {
    return 10 + Math.min(16, Math.floor((levelNumber - 1) / 2));
}

export function minimumStarsToReachLevel(levelNumber: number): number {
    if (levelNumber <= 1) {
        return 0;
    }
    let total = 0;
    for (let lvl = 1; lvl < levelNumber; lvl += 1) {
        total += starCountForLevel(lvl);
    }
    return total;
}
