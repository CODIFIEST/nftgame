import test from "node:test";
import assert from "node:assert/strict";
import { anchorXForLevel, buildLevels } from "../src/game/levels.js";

const GAME_WIDTH = 1400;

test("buildLevels is deterministic for same inputs", () => {
    const first = buildLevels(8, GAME_WIDTH);
    const second = buildLevels(8, GAME_WIDTH);
    assert.deepEqual(first, second);
});

test("first platform anchor alternates side every 5 levels", () => {
    assert.equal(anchorXForLevel(1, GAME_WIDTH), 160);
    assert.equal(anchorXForLevel(5, GAME_WIDTH), 160);
    assert.equal(anchorXForLevel(6, GAME_WIDTH), GAME_WIDTH - 160);
    assert.equal(anchorXForLevel(10, GAME_WIDTH), GAME_WIDTH - 160);
});

test("generated platform y stays within level bounds", () => {
    const levels = buildLevels(20, GAME_WIDTH);
    for (const level of levels) {
        for (const piece of level.platformLayout) {
            assert.ok(piece.y >= 460);
            assert.ok(piece.y <= 860);
        }
    }
});
