import type * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./constants";
import type { PlatformConfig } from "./levels";

type PlatformGroup = Phaser.Physics.Arcade.StaticGroup | undefined;
type ArcadeImage = Phaser.Physics.Arcade.Image;
type PlayerSprite = Phaser.Physics.Arcade.Sprite | undefined;

function platformTargetsForLayout(layout: PlatformConfig[]): PlatformConfig[] {
    return [{ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 10, scaleX: 4 }, ...layout];
}

export function buildPlatforms(
    scene: Phaser.Scene,
    platforms: PlatformGroup,
    layout: PlatformConfig[],
): Phaser.Physics.Arcade.StaticGroup {
    const nextPlatforms = platforms ?? scene.physics.add.staticGroup();
    if (platforms) {
        nextPlatforms.clear(true, true);
    }
    nextPlatforms.create(GAME_WIDTH / 2, GAME_HEIGHT - 10, "ground").setScale(4, 1).refreshBody();

    layout.forEach((piece) => {
        const platform = nextPlatforms.create(piece.x, piece.y, "ground");
        if (piece.scaleX) {
            platform.setScale(piece.scaleX, 1).refreshBody();
        }
    });
    return nextPlatforms;
}

export function animatePlatformsToLayout(
    scene: Phaser.Scene,
    platforms: PlatformGroup,
    layout: PlatformConfig[],
    durationMs: number,
): Phaser.Physics.Arcade.StaticGroup {
    const nextPlatforms = platforms ?? buildPlatforms(scene, platforms, layout);
    const targets = platformTargetsForLayout(layout);
    const current = nextPlatforms.getChildren() as ArcadeImage[];

    while (current.length < targets.length) {
        const target = targets[current.length];
        const created = nextPlatforms.create(target.x, target.y, "ground") as ArcadeImage;
        created.setScale(target.scaleX ?? 1, 1).refreshBody();
        current.push(created);
    }
    while (current.length > targets.length) {
        const stale = current.pop();
        stale?.destroy();
    }

    current.forEach((platform, index) => {
        const target = targets[index];
        scene.tweens.add({
            targets: platform,
            x: target.x,
            y: target.y,
            scaleX: target.scaleX ?? 1,
            scaleY: 1,
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

export function sequentialRevealDurationMs(layoutLength: number): number {
    const intervalMs = 240;
    return Math.max(460, (layoutLength - 1) * intervalMs + 420);
}

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
    const ground = nextPlatforms.create(GAME_WIDTH / 2, GAME_HEIGHT - 10, "ground");
    ground.setScale(4, 1).refreshBody();
    const anchorPlatform = nextPlatforms.create(anchor.x, anchor.y, "ground");
    anchorPlatform.setScale(anchor.scaleX ?? 0.72, 1).refreshBody();

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
            const platform = nextPlatforms.create(piece.x, piece.y + 18, "ground");
            platform.setScale(piece.scaleX ?? 1, 1).setAlpha(0).refreshBody();
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
