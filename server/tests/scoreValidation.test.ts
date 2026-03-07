import test from "node:test";
import assert from "node:assert/strict";
import { parseIncomingScore, parseLimit } from "../api/scoreValidation";

test("parseLimit clamps values within bounds", () => {
    assert.equal(parseLimit("10", 50), 10);
    assert.equal(parseLimit("0", 50), 1);
    assert.equal(parseLimit("999", 50), 100);
    assert.equal(parseLimit(undefined, 50), 50);
});

test("parseIncomingScore normalizes valid payload", () => {
    const parsed = parseIncomingScore({
        token: "abc",
        imageURL: "https://example.com/a.png",
        playerName: "runner  ",
        score: 122.8,
    });

    assert.equal(parsed.token, "abc");
    assert.equal(parsed.imageURL, "https://example.com/a.png");
    assert.equal(parsed.playerName, "runner");
    assert.equal(parsed.score, 122);
    assert.match(parsed.season, /^\d{4}-Q[1-4]$/);
});

test("parseIncomingScore rejects invalid image url", () => {
    assert.throws(
        () => parseIncomingScore({ imageURL: "ftp://example.com/a.png", score: 10 }),
        /Image URL is invalid|Image URL must use http or https/,
    );
});

test("parseIncomingScore rejects negative score", () => {
    assert.throws(() => parseIncomingScore({ score: -2 }), /non-negative/);
});
