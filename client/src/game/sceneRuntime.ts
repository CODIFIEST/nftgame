import type * as Phaser from "phaser";
import { keepBombsVisible } from "./bombs";
import { visibleHorizontalRange } from "./bounds";
import { updatePlayerMotion } from "./playerMotion";
import { setupGameScene } from "./sceneSetup";
import type { LevelConfig, PlatformConfig } from "./levels";

type CreateSceneRuntimeArgs = {
    scene: Phaser.Scene;
    hasRunStarted: boolean;
    level: number;
    levels: LevelConfig[];
    gameWidth: number;
    gameHeight: number;
    backgroundScale: number;
    baseCameraZoom: number;
    normalizePlayerSprite: (player: Phaser.Physics.Arcade.Sprite, scene: Phaser.Scene) => void;
    applyBackgroundSection: (scene: Phaser.Scene, level: number, skipTween?: boolean) => void;
    hitBomb: (
        this: Phaser.Scene,
        colliderPlayer: Phaser.GameObjects.GameObject,
    ) => Promise<void> | void;
    centerZoomedCamera: (scene: Phaser.Scene) => void;
    applyLevelTheme: (scene: Phaser.Scene, showBanner?: boolean) => void;
    verifyAllLevelFirstLedgeReachability: (scene: Phaser.Scene, levels: LevelConfig[]) => void;
};

type UpdateSceneRuntimeArgs = {
    sceneRef: Phaser.Scene | null;
    player: Phaser.Physics.Arcade.Sprite | null;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
    bombs: Phaser.Physics.Arcade.Group | null;
    isDead: boolean;
    hasRunStarted: boolean;
    isPaused: boolean;
    isLevelTransitioning: boolean;
    reducedMotion: boolean;
    cameraNearMissDistance: number;
    cameraNearMissCooldownMs: number;
    bombVisibleTopY: number;
    lastNearMissShakeAt: number;
    playTone: (frequency: number, durationMs: number, gain?: number, type?: OscillatorType) => void;
    level: number;
    gameHeight: number;
    gameWidth: number;
    touchLeftActive: boolean;
    touchRightActive: boolean;
    touchJumpActive: boolean;
    moveSpeed: number;
    jumpInitialVelocity: number;
    jumpHoldAccel: number;
    jumpHoldMaxMs: number;
    jumpReleaseCutoff: number;
    jumpHoldTimeMs: number;
    jumpPressedLastFrame: boolean;
    activePlatformLayout: PlatformConfig[];
    placePlayerAtLevelStart: (player: Phaser.Physics.Arcade.Sprite, layout: PlatformConfig[], level: number) => void;
};

export type UpdateSceneRuntimeResult = {
    jumpHoldTimeMs: number;
    jumpPressedLastFrame: boolean;
    lastNearMissShakeAt: number;
};

export function createSceneRuntime(args: CreateSceneRuntimeArgs): {
    background: Phaser.GameObjects.Image | null;
    glowOverlay: Phaser.GameObjects.Rectangle | null;
    player: Phaser.Physics.Arcade.Sprite;
    bombs: Phaser.Physics.Arcade.Group;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
} {
    const setup = setupGameScene(args.scene, {
        gameWidth: args.gameWidth,
        gameHeight: args.gameHeight,
        backgroundScale: args.backgroundScale,
        baseCameraZoom: args.baseCameraZoom,
        hasRunStarted: args.hasRunStarted,
        normalizePlayerSprite: args.normalizePlayerSprite,
        applyBackgroundSection: args.applyBackgroundSection,
        hitBomb: args.hitBomb,
        centerZoomedCamera: args.centerZoomedCamera,
    });
    args.applyLevelTheme(args.scene, true);
    args.verifyAllLevelFirstLedgeReachability(args.scene, args.levels);
    args.scene.physics.add.collider(setup.player, setup.platforms);
    args.scene.physics.add.collider(setup.bombs, setup.platforms);
    if (!args.hasRunStarted) {
        args.scene.physics.pause();
    }
    return setup;
}

export function updateSceneRuntime(args: UpdateSceneRuntimeArgs): UpdateSceneRuntimeResult {
    if (!args.player || !args.cursors || !args.bombs || args.isDead || !args.hasRunStarted || args.isPaused) {
        return {
            jumpHoldTimeMs: args.jumpHoldTimeMs,
            jumpPressedLastFrame: args.jumpPressedLastFrame,
            lastNearMissShakeAt: args.lastNearMissShakeAt,
        };
    }

    const now = args.sceneRef?.time.now ?? 0;
    let nearestBombDistance = Number.POSITIVE_INFINITY;
    args.bombs.children.each((child) => {
        const bomb = child as Phaser.Physics.Arcade.Image;
        if (!bomb?.active) {
            return;
        }
        const distance = Phaser.Math.Distance.Between(args.player!.x, args.player!.y, bomb.x, bomb.y);
        if (distance < nearestBombDistance) {
            nearestBombDistance = distance;
        }
    });

    const viewLeftX = args.sceneRef?.cameras.main.worldView.left ?? 0;
    const viewRightX = args.sceneRef?.cameras.main.worldView.right ?? args.gameWidth;
    keepBombsVisible(args.bombs, args.bombVisibleTopY, viewLeftX, viewRightX);

    let nextNearMiss = args.lastNearMissShakeAt;
    if (
        !args.reducedMotion &&
        nearestBombDistance < args.cameraNearMissDistance &&
        now - args.lastNearMissShakeAt > args.cameraNearMissCooldownMs
    ) {
        args.sceneRef?.cameras.main.shake(110, 0.0017);
        args.playTone(220, 45, 0.012, "triangle");
        nextNearMiss = now;
    }

    if (args.isLevelTransitioning) {
        args.player.setVelocityX(0);
        return {
            jumpHoldTimeMs: args.jumpHoldTimeMs,
            jumpPressedLastFrame: false,
            lastNearMissShakeAt: nextNearMiss,
        };
    }

    if (args.player.y > args.gameHeight + 120) {
        console.warn("[GameDebug] player fell below world, resetting position", { level: args.level });
        args.placePlayerAtLevelStart(args.player, args.activePlatformLayout, args.level);
        return {
            jumpHoldTimeMs: args.jumpHoldTimeMs,
            jumpPressedLastFrame: args.jumpPressedLastFrame,
            lastNearMissShakeAt: nextNearMiss,
        };
    }

    const motion = updatePlayerMotion({
        player: args.player,
        cursors: args.cursors,
        touchLeftActive: args.touchLeftActive,
        touchRightActive: args.touchRightActive,
        touchJumpActive: args.touchJumpActive,
        moveSpeed: args.moveSpeed,
        jumpInitialVelocity: args.jumpInitialVelocity,
        jumpHoldAccel: args.jumpHoldAccel,
        jumpHoldMaxMs: args.jumpHoldMaxMs,
        jumpReleaseCutoff: args.jumpReleaseCutoff,
        sceneDeltaMs: args.sceneRef?.game.loop.delta ?? 16.67,
        jumpHoldTimeMs: args.jumpHoldTimeMs,
        jumpPressedLastFrame: args.jumpPressedLastFrame,
    });

    const halfWidth = Math.max(14, args.player.displayWidth * 0.5);
    const { minX, maxX } = visibleHorizontalRange(viewLeftX, viewRightX, halfWidth);
    if (args.player.x < minX) {
        args.player.x = minX;
        args.player.setVelocityX(Math.max(0, args.player.body.velocity.x));
    } else if (args.player.x > maxX) {
        args.player.x = maxX;
        args.player.setVelocityX(Math.min(0, args.player.body.velocity.x));
    }

    return {
        jumpHoldTimeMs: motion.jumpHoldTimeMs,
        jumpPressedLastFrame: motion.jumpPressedLastFrame,
        lastNearMissShakeAt: nextNearMiss,
    };
}
