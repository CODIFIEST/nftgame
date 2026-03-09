import type * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./constants";
import type { PlatformConfig } from "./levels";

/** Convenience alias for the static platform group used by Arcade physics. */
type PlatformGroup = Phaser.Physics.Arcade.StaticGroup | undefined;
/** Convenience alias for an Arcade image object. */
type ArcadeImage = Phaser.Physics.Arcade.Image;
/** Optional player sprite reference used during level transitions. */
type PlayerSprite = Phaser.Physics.Arcade.Sprite | undefined;

const GROUND_TEXTURE_KEY = "ground";
const FLOOR_OVERHANG_PX = 120;
const MIN_PLATFORM_WIDTH_PX = 48;
const PLATFORM_WIDTH_QUANTIZE_PX = 8;

/** Reads the base ground texture dimensions in pixels. */
function baseGroundSize(scene: Phaser.Scene): { width: number; height: number } {
    const source = scene.textures.get(GROUND_TEXTURE_KEY).getSourceImage() as { width?: number; height?: number };
    return {
        width: Math.max(1, source?.width ?? 256),
        height: Math.max(1, source?.height ?? 52),
    };
}

/** Snaps widths to a small grid so texture variants can be reused. */
function quantizeWidth(width: number): number {
    return Math.max(
        MIN_PLATFORM_WIDTH_PX,
        Math.round(width / PLATFORM_WIDTH_QUANTIZE_PX) * PLATFORM_WIDTH_QUANTIZE_PX,
    );
}

/** Creates or reuses a tiled ground texture variant for the requested width. */
function ensureGroundWidthVariant(scene: Phaser.Scene, targetWidth: number): string {
    const { width: baseWidth, height: baseHeight } = baseGroundSize(scene);
    const finalWidth = quantizeWidth(targetWidth);
    if (Math.abs(finalWidth - baseWidth) <= PLATFORM_WIDTH_QUANTIZE_PX) {
        return GROUND_TEXTURE_KEY;
    }

    const key = `${GROUND_TEXTURE_KEY}-w-${finalWidth}`;
    if (scene.textures.exists(key)) {
        return key;
    }

    const sourceImage = scene.textures.get(GROUND_TEXTURE_KEY).getSourceImage() as HTMLCanvasElement | HTMLImageElement;
    const variant = scene.textures.createCanvas(key, finalWidth, baseHeight);
    const ctx = variant.context;
    ctx.clearRect(0, 0, finalWidth, baseHeight);

    for (let x = 0; x < finalWidth; x += baseWidth) {
        const sliceWidth = Math.min(baseWidth, finalWidth - x);
        ctx.drawImage(sourceImage, 0, 0, sliceWidth, baseHeight, x, 0, sliceWidth, baseHeight);
    }
    variant.refresh();
    return key;
}

/** Applies width-specific texture sizing and refreshes the static body. */
function applyPlatformWidth(scene: Phaser.Scene, platform: ArcadeImage, scaleX = 1): void {
    const { width: baseWidth, height: baseHeight } = baseGroundSize(scene);
    const desiredWidth = Math.max(MIN_PLATFORM_WIDTH_PX, baseWidth * (scaleX ?? 1));
    const textureKey = ensureGroundWidthVariant(scene, desiredWidth);
    const finalWidth = textureKey === GROUND_TEXTURE_KEY ? baseWidth : Number(textureKey.split("-w-")[1] ?? baseWidth);

    platform.setTexture(textureKey);
    platform.setDisplaySize(finalWidth, baseHeight);
    platform.setScale(1, 1);
    platform.refreshBody();
}

/** Calculates floor scale so the base floor reaches past both viewport edges. */
function floorScaleX(scene: Phaser.Scene): number {
    const { width: baseWidth } = baseGroundSize(scene);
    return (GAME_WIDTH + FLOOR_OVERHANG_PX * 2) / baseWidth;
}

/** Builds tween targets that include floor plus all level layout platforms. */
function platformTargetsForLayout(scene: Phaser.Scene, layout: PlatformConfig[]): PlatformConfig[] {
    return [{ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 10, scaleX: floorScaleX(scene) }, ...layout];
}

/** Creates floor and level platforms immediately for a new layout. */
export function buildPlatforms(
    scene: Phaser.Scene,
    platforms: PlatformGroup,
    layout: PlatformConfig[],
): Phaser.Physics.Arcade.StaticGroup {
    const nextPlatforms = platforms ?? scene.physics.add.staticGroup();
    if (platforms) {
        nextPlatforms.clear(true, true);
    }
    const floor = nextPlatforms.create(GAME_WIDTH / 2, GAME_HEIGHT - 10, GROUND_TEXTURE_KEY) as ArcadeImage;
    applyPlatformWidth(scene, floor, floorScaleX(scene));

    layout.forEach((piece) => {
        const platform = nextPlatforms.create(piece.x, piece.y, GROUND_TEXTURE_KEY) as ArcadeImage;
        applyPlatformWidth(scene, platform, piece.scaleX ?? 1);
    });
    return nextPlatforms;
}

/** Tweens an existing platform set so it matches a new target layout. */
export function animatePlatformsToLayout(
    scene: Phaser.Scene,
    platforms: PlatformGroup,
    layout: PlatformConfig[],
    durationMs: number,
): Phaser.Physics.Arcade.StaticGroup {
    const nextPlatforms = platforms ?? buildPlatforms(scene, platforms, layout);
    const targets = platformTargetsForLayout(scene, layout);
    const current = nextPlatforms.getChildren() as ArcadeImage[];

    while (current.length < targets.length) {
        const target = targets[current.length];
        const created = nextPlatforms.create(target.x, target.y, GROUND_TEXTURE_KEY) as ArcadeImage;
        applyPlatformWidth(scene, created, target.scaleX ?? 1);
        current.push(created);
    }
    while (current.length > targets.length) {
        const stale = current.pop();
        stale?.destroy();
    }

    current.forEach((platform, index) => {
        const target = targets[index];
        applyPlatformWidth(scene, platform, target.scaleX ?? 1);
        scene.tweens.add({
            targets: platform,
            x: target.x,
            y: target.y,
            duration: durationMs,
            ease: "Sine.easeInOut",
            onUpdate: () => {
                platform.refreshBody();
            },
            onComplete: () => {
                platform.refreshBody();
            },
        });
    });

    return nextPlatforms;
}

/** Returns total reveal time for sequential platform spawn animation. */
export function sequentialRevealDurationMs(layoutLength: number): number {
    const intervalMs = 240;
    return Math.max(460, (layoutLength - 1) * intervalMs + 420);
}

/** Rebuilds platforms with a staggered reveal effect for level transitions. */
export function buildPlatformsSequential(
    scene: Phaser.Scene,
    platforms: PlatformGroup,
    layout: PlatformConfig[],
    preservePlayerOnAnchor: boolean,
    player?: PlayerSprite,
): { platforms: Phaser.Physics.Arcade.StaticGroup; revealMs: number } {
    const nextPlatforms = platforms ?? scene.physics.add.staticGroup();
    if (platforms) {
        nextPlatforms.clear(true, true);
    }

    const anchor = layout[0];
    const ground = nextPlatforms.create(GAME_WIDTH / 2, GAME_HEIGHT - 10, GROUND_TEXTURE_KEY) as ArcadeImage;
    applyPlatformWidth(scene, ground, floorScaleX(scene));
    const anchorPlatform = nextPlatforms.create(anchor.x, anchor.y, GROUND_TEXTURE_KEY) as ArcadeImage;
    applyPlatformWidth(scene, anchorPlatform, anchor.scaleX ?? 0.72);

    if (preservePlayerOnAnchor && player) {
        player.x = anchor.x;
        player.y = anchor.y - Math.max(120, Math.floor(player.displayHeight * 0.85));
        player.setVelocity(0, 0);
    }

    const remaining = layout
        .slice(1)
        .sort((a, b) => {
            const da = Math.abs(a.x - anchor.x) + Math.abs(a.y - anchor.y);
            const db = Math.abs(b.x - anchor.x) + Math.abs(b.y - anchor.y);
            return da - db;
        });

    const intervalMs = 240;
    remaining.forEach((piece, idx) => {
        scene.time.delayedCall((idx + 1) * intervalMs, () => {
            const platform = nextPlatforms.create(piece.x, piece.y + 18, GROUND_TEXTURE_KEY) as ArcadeImage;
            applyPlatformWidth(scene, platform, piece.scaleX ?? 1);
            platform.setAlpha(0).refreshBody();
            scene.tweens.add({
                targets: platform,
                y: piece.y,
                alpha: 1,
                duration: 360,
                ease: "Sine.easeOut",
                onUpdate: () => platform.refreshBody(),
                onComplete: () => platform.refreshBody(),
            });
        });
    });

    return { platforms: nextPlatforms, revealMs: sequentialRevealDurationMs(layout.length) };
}

/** Repositions the player above the first ledge for the active level. */
export function placePlayerAtLevelStart(
    player: Phaser.Physics.Arcade.Sprite | undefined,
    layout: PlatformConfig[],
    level: number,
): void {
    if (!player) {
        return;
    }
    const startLedge = layout[0];
    const spawnX = startLedge.x;
    const spawnY = startLedge.y - Math.max(120, Math.floor(player.displayHeight * 0.85));
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.reset(spawnX, spawnY);
    player.clearTint();
    player.setVelocity(0, 0);
    console.log("[GameDebug] repositioned player for new level", {
        level,
        spawnX,
        spawnY,
        startLedgeY: startLedge.y,
    });
}

/** Finds the closest ledge near the player's feet to use as an anchor point. */
export function getCurrentAnchorLedge(
    player: Phaser.Physics.Arcade.Sprite | undefined,
    platforms: PlatformGroup,
): { x: number; y: number } {
    if (!player || !platforms) {
        return { x: 180, y: 850 };
    }
    const candidates = platforms.getChildren() as ArcadeImage[];
    const playerFootY = player.y + player.displayHeight * 0.45;
    let best = candidates[0];
    let bestScore = Number.POSITIVE_INFINITY;
    candidates.forEach((platform) => {
        const dx = Math.abs(platform.x - player.x);
        const dy = Math.abs(platform.y - playerFootY);
        const score = dx + dy * 1.2;
        if (score < bestScore) {
            best = platform;
            bestScore = score;
        }
    });
    return { x: best?.x ?? player.x, y: best?.y ?? player.y + 90 };
}

/** Returns the best platform candidate currently under or near the player. */
export function getCurrentAnchorPlatform(
    player: Phaser.Physics.Arcade.Sprite | undefined,
    platforms: PlatformGroup,
): Phaser.Physics.Arcade.Image | null {
    if (!player || !platforms) {
        return null;
    }
    const candidates = platforms.getChildren() as ArcadeImage[];
    const playerFootY = player.y + player.displayHeight * 0.45;
    const onTopCandidates = candidates.filter((platform) => {
        const dx = Math.abs(platform.x - player.x);
        const dy = Math.abs(platform.y - playerFootY);
        const halfWidth = (platform.displayWidth || 120) / 2;
        return dx <= halfWidth + 24 && dy <= 84;
    });
    const pool = onTopCandidates.length > 0 ? onTopCandidates : candidates;

    let best: ArcadeImage | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    pool.forEach((platform) => {
        const dx = Math.abs(platform.x - player.x);
        const dy = Math.abs(platform.y - playerFootY);
        const score = dy * 1.6 + dx;
        if (score < bestScore) {
            best = platform;
            bestScore = score;
        }
    });
    return best;
}
