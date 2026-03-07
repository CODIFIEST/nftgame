import test from "node:test";
import assert from "node:assert/strict";
import { SlidingWindowRateLimiter } from "../api/rateLimit";

test("rate limiter allows requests up to limit then blocks", () => {
    const limiter = new SlidingWindowRateLimiter(60_000, 3, 20);
    const now = Date.now();
    assert.equal(limiter.consume("ip-1", now), true);
    assert.equal(limiter.consume("ip-1", now + 1), true);
    assert.equal(limiter.consume("ip-1", now + 2), true);
    assert.equal(limiter.consume("ip-1", now + 3), false);
});

test("rate limiter resets window after duration", () => {
    const limiter = new SlidingWindowRateLimiter(1000, 2, 20);
    const now = Date.now();
    assert.equal(limiter.consume("ip-1", now), true);
    assert.equal(limiter.consume("ip-1", now + 100), true);
    assert.equal(limiter.consume("ip-1", now + 200), false);
    assert.equal(limiter.consume("ip-1", now + 1200), true);
});
