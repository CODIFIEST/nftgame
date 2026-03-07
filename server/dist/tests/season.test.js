"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const season_1 = require("../api/season");
(0, node_test_1.default)("getCurrentSeason returns Q1 for January", () => {
    const season = (0, season_1.getCurrentSeason)(new Date("2026-01-15T00:00:00.000Z"));
    strict_1.default.equal(season, "2026-Q1");
});
(0, node_test_1.default)("getCurrentSeason returns Q3 for August", () => {
    const season = (0, season_1.getCurrentSeason)(new Date("2026-08-01T00:00:00.000Z"));
    strict_1.default.equal(season, "2026-Q3");
});
