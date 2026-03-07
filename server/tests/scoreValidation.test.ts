import test from "node:test";
import assert from "node:assert/strict";
import { consumeRunTicketOrThrow, parseIncomingScore, parseLimit } from "../api/scoreValidation";
import { RunTicketStore } from "../api/runTicket";

test("parseLimit clamps values within bounds", () => {
    assert.equal(parseLimit("10", 50), 10);
    assert.equal(parseLimit("0", 50), 1);
    assert.equal(parseLimit("999", 50), 100);
    assert.equal(parseLimit(undefined, 50), 50);
});

test("parseIncomingScore normalizes valid payload", () => {
    const now = Date.now();
    const parsed = parseIncomingScore({
        token: "abc",
        imageURL: "https://example.com/a.png",
        playerName: "runner  ",
        score: 122,
        ticketId: "ticket-1",
        runStartedAt: new Date(now - 30_000).toISOString(),
        runEndedAt: new Date(now).toISOString(),
        collectedStars: 12,
        maxCombo: 3,
        maxLevelReached: 2,
    });

    assert.equal(parsed.token, "abc");
    assert.equal(parsed.imageURL, "https://example.com/a.png");
    assert.equal(parsed.playerName, "runner");
    assert.equal(parsed.score, 122);
    assert.equal(parsed.ticketId, "ticket-1");
    assert.match(parsed.season, /^\d{4}-Q[1-4]$/);
});

test("parseIncomingScore rejects invalid image url", () => {
    const now = Date.now();
    assert.throws(
        () => parseIncomingScore({
            imageURL: "ftp://example.com/a.png",
            score: 10,
            ticketId: "ticket-1",
            runStartedAt: new Date(now - 30_000).toISOString(),
            runEndedAt: new Date(now).toISOString(),
            collectedStars: 1,
            maxCombo: 1,
            maxLevelReached: 1,
        }),
        /Image URL is invalid|Image URL must use http or https/,
    );
});

test("parseIncomingScore rejects negative score", () => {
    const now = Date.now();
    assert.throws(
        () =>
            parseIncomingScore({
                score: -2,
                ticketId: "ticket-1",
                runStartedAt: new Date(now - 30_000).toISOString(),
                runEndedAt: new Date(now).toISOString(),
                collectedStars: 1,
                maxCombo: 1,
                maxLevelReached: 1,
            }),
        /non-negative/,
    );
});

test("consumeRunTicketOrThrow accepts fresh ticket and rejects reused ticket", () => {
    const store = new RunTicketStore();
    const issued = store.issue("ip-1");
    assert.doesNotThrow(() => consumeRunTicketOrThrow(store, issued.ticketId, "ip-1"));
    assert.throws(() => consumeRunTicketOrThrow(store, issued.ticketId, "ip-1"), /Ticket not found|already used/);
});
