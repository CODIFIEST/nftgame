import type * as Phaser from "phaser";
import {
    BACKGROUND_SCALE,
    BACKGROUND_SECTION_GRID,
    GAME_HEIGHT,
    GAME_WIDTH,
    JUMP_HOLD_ACCEL,
    JUMP_HOLD_MAX_MS,
    JUMP_INITIAL_VELOCITY,
    WORLD_GRAVITY_Y,
} from "./constants";
import type { LevelConfig } from "./levels";

export type BombStyle = {
    tint: number;
    scale: number;
};

export function estimateMaxJumpRisePx(): number {
    const dt = 1 / 120;
    let vy = JUMP_INITIAL_VELOCITY;
    let y = 0;
    let maxRise = 0;
    let holdTime = 0;

    for (let i = 0; i < 600; i += 1) {
        if (vy < 0 && holdTime < JUMP_HOLD_MAX_MS) {
            vy += JUMP_HOLD_ACCEL * dt;
            holdTime += dt * 1000;
        }

        vy += WORLD_GRAVITY_Y * dt;
        y += vy * dt;
        maxRise = Math.max(maxRise, -y);
        if (vy > 0 && y >= 0) {
            break;
        }
    }

    return maxRise;
}

export function verifyAllLevelFirstLedgeReachability(scene: Phaser.Scene, levels: LevelConfig[]): void {
    const groundTexture = scene.textures.get("ground").getSourceImage() as { height?: number };
    const groundHeight = groundTexture?.height ?? 64;
    const groundTop = 1050 - groundHeight / 2;
    const maxJumpRise = estimateMaxJumpRisePx();
    const safetyMargin = 12;

    levels.forEach((cfg, idx) => {
        const lowestLedgeY = Math.max(...cfg.platformLayout.map((piece) => piece.y));
        const lowestLedgeTop = lowestLedgeY - groundHeight / 2;
        const riseRequired = groundTop - lowestLedgeTop;
        const reachable = riseRequired <= maxJumpRise - safetyMargin;
        const payload = {
            level: idx + 1,
            title: cfg.title,
            riseRequired: Math.round(riseRequired),
            maxJumpRise: Math.round(maxJumpRise),
            reachable,
        };
        if (!reachable) {
            console.error("[GameDebug] first ledge unreachable with current jump model", payload);
        } else {
            console.log("[GameDebug] first ledge reachable", payload);
        }
    });
}

export function centerZoomedCamera(scene: Phaser.Scene) {
    const camera = scene.cameras.main;
    const visibleWidth = GAME_WIDTH / camera.zoom;
    const visibleHeight = GAME_HEIGHT / camera.zoom;
    camera.setScroll((GAME_WIDTH - visibleWidth) / 2, (GAME_HEIGHT - visibleHeight) / 2);
}

export function backgroundTargetPositionForLevel(levelNumber: number) {
    const sectionIndex = (levelNumber - 1) % (BACKGROUND_SECTION_GRID * BACKGROUND_SECTION_GRID);
    const rowFromBottom = Math.floor(sectionIndex / BACKGROUND_SECTION_GRID);
    const indexInRow = sectionIndex % BACKGROUND_SECTION_GRID;
    const col = rowFromBottom % 2 === 0 ? indexInRow : BACKGROUND_SECTION_GRID - 1 - indexInRow;
    const u = (col + 0.5) / BACKGROUND_SECTION_GRID;
    const v = 1 - (rowFromBottom + 0.5) / BACKGROUND_SECTION_GRID;
    const displayWidth = GAME_WIDTH * BACKGROUND_SCALE;
    const displayHeight = GAME_HEIGHT * BACKGROUND_SCALE;
    return {
        x: GAME_WIDTH / 2 + displayWidth * (0.5 - u),
        y: GAME_HEIGHT / 2 + displayHeight * (0.5 - v),
        sectionIndex: sectionIndex + 1,
    };
}

export function bombStyleForLevel(currentLevel: number): BombStyle {
    const tier = Math.min(4, Math.floor((currentLevel - 1) / 20));
    const styles: BombStyle[] = [
        { tint: 0xffffff, scale: 1 },
        { tint: 0xffe29b, scale: 1.04 },
        { tint: 0xffb59b, scale: 1.08 },
        { tint: 0xff9bcf, scale: 1.12 },
        { tint: 0xff8f8f, scale: 1.16 },
    ];
    return styles[tier];
}
