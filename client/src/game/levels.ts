export type PlatformConfig = {
    x: number;
    y: number;
    scaleX?: number;
};

export type LevelConfig = {
    title: string;
    tint: number;
    platformLayout: PlatformConfig[];
    starCount: number;
    targetBombs: number;
    bombSpeed: number;
};

const BASE_LEVEL_THEMES: Pick<LevelConfig, "title" | "tint">[] = [
    { title: "Rooftop Run", tint: 0x9bd5ff },
    { title: "Factory Lift", tint: 0xffd38f },
    { title: "Storm Walk", tint: 0xbac3ff },
    { title: "Neon Tunnel", tint: 0xff9add },
    { title: "Core Breach", tint: 0xff8d8d },
];

export const LEVEL_MIN_Y = 460;
export const LEVEL_MAX_Y = 860;
export const ANCHOR_MIN_Y = 650;
export const ANCHOR_MAX_Y = 860;

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function rowIndexForLevel(levelNumber: number): number {
    return Math.floor((levelNumber - 1) / 5);
}

function movesRightForLevel(levelNumber: number): boolean {
    return rowIndexForLevel(levelNumber) % 2 === 0;
}

export function anchorXForLevel(levelNumber: number, gameWidth: number): number {
    return movesRightForLevel(levelNumber) ? 160 : gameWidth - 160;
}

function seededUnit(levelNumber: number, index: number, salt = 0): number {
    const seed = Math.sin((levelNumber + 1) * 9283 + (index + 1) * 1237 + salt * 313) * 43758.5453;
    return seed - Math.floor(seed);
}

function seededBetween(levelNumber: number, index: number, min: number, max: number, salt = 0): number {
    const u = seededUnit(levelNumber, index, salt);
    return min + (max - min) * u;
}

function randomLedgeScale(levelNumber: number, index: number, isAnchor = false): number {
    const r = seededUnit(levelNumber, index, 5);
    const min = isAnchor ? 0.56 : 0.34;
    const max = isAnchor ? 0.78 : 0.62;
    return min + (max - min) * r;
}

export function buildLayoutForLevel(levelNumber: number, gameWidth: number): PlatformConfig[] {
    const platformCount = 5 + Math.min(5, Math.floor(levelNumber / 12));
    const maxStepX = 410;
    const minStepX = 230;
    const moveRight = movesRightForLevel(levelNumber);
    const layout: PlatformConfig[] = [];

    let prevX = moveRight ? 180 : gameWidth - 180;
    let prevY = 850;

    for (let i = 0; i < platformCount; i += 1) {
        if (i === 0) {
            layout.push({ x: prevX, y: prevY, scaleX: randomLedgeScale(levelNumber, i, true) });
            continue;
        }

        const progress = i / (platformCount - 1);
        const baseTargetX = 120 + progress * (gameWidth - 240);
        const jitter = Math.round(seededBetween(levelNumber, i, -70, 70, 1));
        const targetX = (moveRight ? baseTargetX : gameWidth - baseTargetX) + jitter;
        const rawDeltaX = targetX - prevX;
        const direction = moveRight ? 1 : -1;
        const deltaX = clamp(Math.abs(rawDeltaX), minStepX, maxStepX) * direction;
        let nextX = clamp(prevX + deltaX, 110, gameWidth - 110);
        if (moveRight) {
            nextX = Math.max(nextX, prevX + minStepX * 0.66);
        } else {
            nextX = Math.min(nextX, prevX - minStepX * 0.66);
        }
        nextX = clamp(nextX, 110, gameWidth - 110);

        const centerY = 740;
        const driftCorrection = (centerY - prevY) * 0.34;
        const randomStepY = seededBetween(levelNumber, i, -90, 90, 2);
        const deltaY = randomStepY + driftCorrection;
        const nextY = clamp(prevY + deltaY, LEVEL_MIN_Y, LEVEL_MAX_Y);

        layout.push({
            x: nextX,
            y: nextY,
            scaleX: randomLedgeScale(levelNumber, i),
        });

        prevX = nextX;
        prevY = nextY;
    }

    return layout;
}

export function buildLayoutFromAnchor(
    levelNumber: number,
    anchorX: number,
    anchorY: number,
    gameWidth: number,
): PlatformConfig[] {
    const base = buildLayoutForLevel(levelNumber, gameWidth);
    const first = base[0];
    const deltaX = anchorX - first.x;
    const normalizedAnchorY = clamp(anchorY, ANCHOR_MIN_Y, ANCHOR_MAX_Y);
    const deltaY = normalizedAnchorY - first.y;
    return base.map((piece) => ({
        x: clamp(piece.x + deltaX, 110, gameWidth - 110),
        y: clamp(piece.y + deltaY, LEVEL_MIN_Y, LEVEL_MAX_Y),
        scaleX: piece.scaleX,
    }));
}

export function buildLevels(totalLevels: number, gameWidth: number): LevelConfig[] {
    const levels: LevelConfig[] = [];
    for (let levelNumber = 1; levelNumber <= totalLevels; levelNumber += 1) {
        const theme = BASE_LEVEL_THEMES[(levelNumber - 1) % BASE_LEVEL_THEMES.length];
        levels.push({
            title: `${theme.title} ${levelNumber}`,
            tint: theme.tint,
            platformLayout: buildLayoutForLevel(levelNumber, gameWidth),
            starCount: 10 + Math.min(16, Math.floor((levelNumber - 1) / 2)),
            targetBombs: 1 + Math.min(24, levelNumber - 1),
            bombSpeed: 140 + Math.min(260, (levelNumber - 1) * 4),
        });
    }
    return levels;
}

