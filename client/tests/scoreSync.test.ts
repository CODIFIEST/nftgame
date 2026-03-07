import test from "node:test";
import assert from "node:assert/strict";
import { ScoreSyncQueue, type ScorePayload } from "../src/game/scoreSync.js";

type StorageMap = Record<string, string>;

function mockWindowStorage() {
    const store: StorageMap = {};
    const localStorage = {
        getItem: (key: string) => (key in store ? store[key] : null),
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            Object.keys(store).forEach((key) => delete store[key]);
        },
    };
    (globalThis as any).window = { localStorage };
    (globalThis as any).localStorage = localStorage;
    return () => {
        delete (globalThis as any).window;
        delete (globalThis as any).localStorage;
    };
}

const payload: ScorePayload = {
    token: "abc",
    imageURL: "https://example.com/panda.png",
    score: 100,
    playerName: "tester",
    ticketId: "ticket-1",
    runStartedAt: "2026-03-01T00:00:00.000Z",
    runEndedAt: "2026-03-01T00:01:00.000Z",
    collectedStars: 20,
    maxCombo: 4,
    maxLevelReached: 3,
    season: "2026-Q1",
    createdAt: "2026-03-01T00:00:00.000Z",
};

test("enqueue deduplicates identical score payloads", () => {
    const cleanup = mockWindowStorage();
    const queue = new ScoreSyncQueue("test.pending", "test.lastSync");
    queue.enqueue(payload);
    queue.enqueue(payload);
    assert.equal(queue.getPendingCount(), 1);
    cleanup();
});

test("flush clears pending records when post succeeds", async () => {
    const cleanup = mockWindowStorage();
    const queue = new ScoreSyncQueue("test.pending", "test.lastSync");
    queue.enqueue(payload);
    const remaining = await queue.flush(async () => undefined, 1000, [1]);
    assert.equal(remaining, 0);
    assert.equal(queue.getPendingCount(), 0);
    assert.ok(queue.getLastSyncAt());
    cleanup();
});
