import { GAME_CONTAINER_ID, GAME_HEIGHT, GAME_WIDTH } from "./constants";
import type { LevelConfig } from "./levels";

type SanitySnapshot = {
    playerName: string | null | undefined;
    hasPlayerImage: boolean;
    hasSelectedNft: boolean;
    highScoresLoaded: boolean;
    highScoreValue: number;
};

export function runSanityChecks(levels: LevelConfig[], snapshot: SanitySnapshot): void {
    console.group("[GameDebug] Sanity checks");
    console.assert(Array.isArray(levels) && levels.length > 0, "LEVELS config missing");
    console.assert(Boolean(document.getElementById(GAME_CONTAINER_ID)), "Game container is missing");
    console.assert(GAME_WIDTH > 0 && GAME_HEIGHT > 0, "Invalid game dimensions");
    console.log("Store snapshot", snapshot);
    console.groupEnd();
}
