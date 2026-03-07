import test from "node:test";
import assert from "node:assert/strict";
import { getCurrentSeason } from "../api/season";

test("getCurrentSeason returns Q1 for January", () => {
    const season = getCurrentSeason(new Date("2026-01-15T00:00:00.000Z"));
    assert.equal(season, "2026-Q1");
});

test("getCurrentSeason returns Q3 for August", () => {
    const season = getCurrentSeason(new Date("2026-08-01T00:00:00.000Z"));
    assert.equal(season, "2026-Q3");
});

