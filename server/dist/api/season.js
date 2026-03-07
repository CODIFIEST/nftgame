"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentSeason = void 0;
function getCurrentSeason(date = new Date()) {
    const year = date.getUTCFullYear();
    const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
    return `${year}-Q${quarter}`;
}
exports.getCurrentSeason = getCurrentSeason;
