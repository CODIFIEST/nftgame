"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlidingWindowRateLimiter = void 0;
const WINDOW_MS = 60000;
const MAX_SUBMISSIONS_PER_WINDOW = 24;
const MAX_TRACKED_CLIENTS = 2000;
class SlidingWindowRateLimiter {
    constructor(windowMs = WINDOW_MS, limit = MAX_SUBMISSIONS_PER_WINDOW, maxClients = MAX_TRACKED_CLIENTS) {
        this.buckets = new Map();
        this.windowMs = windowMs;
        this.limit = limit;
        this.maxClients = maxClients;
    }
    consume(key, now = Date.now()) {
        this.compact(now);
        const existing = this.buckets.get(key);
        if (!existing || now - existing.startedAt >= this.windowMs) {
            this.buckets.set(key, { count: 1, startedAt: now, lastSeenAt: now });
            return true;
        }
        if (existing.count >= this.limit) {
            existing.lastSeenAt = now;
            return false;
        }
        existing.count += 1;
        existing.lastSeenAt = now;
        return true;
    }
    compact(now) {
        for (const [key, bucket] of this.buckets.entries()) {
            if (now - bucket.startedAt >= this.windowMs * 2) {
                this.buckets.delete(key);
            }
        }
        if (this.buckets.size <= this.maxClients) {
            return;
        }
        const oldest = [...this.buckets.entries()].sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt);
        const removeCount = this.buckets.size - this.maxClients;
        for (let i = 0; i < removeCount; i += 1) {
            this.buckets.delete(oldest[i][0]);
        }
    }
}
exports.SlidingWindowRateLimiter = SlidingWindowRateLimiter;
