"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const rateLimit_1 = require("../api/rateLimit");
(0, node_test_1.default)("rate limiter allows requests up to limit then blocks", () => {
    const limiter = new rateLimit_1.SlidingWindowRateLimiter(60000, 3, 20);
    const now = Date.now();
    strict_1.default.equal(limiter.consume("ip-1", now), true);
    strict_1.default.equal(limiter.consume("ip-1", now + 1), true);
    strict_1.default.equal(limiter.consume("ip-1", now + 2), true);
    strict_1.default.equal(limiter.consume("ip-1", now + 3), false);
});
(0, node_test_1.default)("rate limiter resets window after duration", () => {
    const limiter = new rateLimit_1.SlidingWindowRateLimiter(1000, 2, 20);
    const now = Date.now();
    strict_1.default.equal(limiter.consume("ip-1", now), true);
    strict_1.default.equal(limiter.consume("ip-1", now + 100), true);
    strict_1.default.equal(limiter.consume("ip-1", now + 200), false);
    strict_1.default.equal(limiter.consume("ip-1", now + 1200), true);
});
