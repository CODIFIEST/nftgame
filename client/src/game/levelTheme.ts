import type * as Phaser from "phaser";
import { buildLayoutFromAnchor, type LevelConfig } from "./levels";

export type LevelThemeOptions = {
    preservePlayer?: boolean;
    anchor?: { x: number; y: number };
    skipBackgroundPan?: boolean;
    platformTransitionMs?: number;
    playerTransitionMs?: number;
    sequentialReveal?: boolean;
};

type ApplyLevelThemeArgs = {
    scene: Phaser.Scene;
    level: number;
    levels: LevelConfig[];
    gameWidth: number;
    showBanner: boolean;
    options: LevelThemeOptions;
    background: Phaser.GameObjects.Image | null;
    glowOverlay: Phaser.GameObjects.Rectangle | null;
    baseCameraZoom: number;
    reducedMotion: boolean;
    platforms: Phaser.Physics.Arcade.StaticGroup | undefined;
    player: Phaser.Physics.Arcade.Sprite;
    setLevelThemeName: (value: string) => void;
    setUiLevel: (value: number) => void;
    onLevelActivated: () => void;
    centerZoomedCamera: (scene: Phaser.Scene) => void;
    applyBackgroundSection: (
        scene: Phaser.Scene,
        background: Phaser.GameObjects.Image | null,
        levelNumber: number,
        animate: boolean,
    ) => void;
    buildPlatforms: (
        scene: Phaser.Scene,
        platforms: Phaser.Physics.Arcade.StaticGroup | undefined,
        layout: LevelConfig["platformLayout"],
    ) => Phaser.Physics.Arcade.StaticGroup;
    animatePlatformsToLayout: (
        scene: Phaser.Scene,
        platforms: Phaser.Physics.Arcade.StaticGroup | undefined,
        layout: LevelConfig["platformLayout"],
        durationMs: number,
    ) => Phaser.Physics.Arcade.StaticGroup;
    buildPlatformsSequential: (
        scene: Phaser.Scene,
        platforms: Phaser.Physics.Arcade.StaticGroup | undefined,
        layout: LevelConfig["platformLayout"],
        preservePlayerOnAnchor: boolean,
        player: Phaser.Physics.Arcade.Sprite,
    ) => { platforms: Phaser.Physics.Arcade.StaticGroup; revealMs: number };
    placePlayerAtLevelStart: (
        player: Phaser.Physics.Arcade.Sprite,
        layout: LevelConfig["platformLayout"],
        level: number,
    ) => void;
    resetStars: (platforms: Phaser.Physics.Arcade.StaticGroup) => void;
    syncBombCount: () => void;
    enforceBombSafeZone: (bombSpeed: number) => void;
    playTone: (frequency: number, durationMs: number, gain?: number, type?: OscillatorType) => void;
    levelBanner: (scene: Phaser.Scene, text: string) => void;
};

export function applyLevelTheme(args: ApplyLevelThemeArgs): Phaser.Physics.Arcade.StaticGroup {
    const config = args.levels[Math.min(args.level - 1, args.levels.length - 1)];
    console.log("[GameDebug] applyLevelTheme", { level: args.level, title: config.title, showBanner: args.showBanner });

    if (args.options.anchor) {
        config.platformLayout = buildLayoutFromAnchor(
            args.level,
            args.options.anchor.x,
            args.options.anchor.y,
            args.gameWidth,
        );
    }

    args.setLevelThemeName(config.title);
    args.background?.clearTint();
    args.glowOverlay?.setFillStyle(config.tint, 0.05);

    if (!args.options.skipBackgroundPan) {
        args.applyBackgroundSection(args.scene, args.background, args.level, args.showBanner && args.level > 1);
    }

    args.scene.cameras.main.setZoom(args.baseCameraZoom);
    args.centerZoomedCamera(args.scene);

    const finalizeSpawns = () => {
        args.resetStars(nextPlatforms as Phaser.Physics.Arcade.StaticGroup);
        args.syncBombCount();
        args.enforceBombSafeZone(config.bombSpeed);
    };

    let nextPlatforms = args.platforms;
    if (args.options.sequentialReveal) {
        const sequential = args.buildPlatformsSequential(
            args.scene,
            nextPlatforms,
            config.platformLayout,
            Boolean(args.options.preservePlayer),
            args.player,
        );
        nextPlatforms = sequential.platforms;
        args.scene.time.delayedCall(sequential.revealMs, finalizeSpawns);
    } else if (args.options.platformTransitionMs && args.options.platformTransitionMs > 0) {
        nextPlatforms = args.animatePlatformsToLayout(
            args.scene,
            nextPlatforms,
            config.platformLayout,
            args.options.platformTransitionMs,
        );
        args.resetStars(nextPlatforms as Phaser.Physics.Arcade.StaticGroup);
        if (!args.options.preservePlayer) {
            args.placePlayerAtLevelStart(args.player, config.platformLayout, args.level);
        } else if (args.options.playerTransitionMs && args.options.playerTransitionMs > 0) {
            const startLedge = config.platformLayout[0];
            const targetY = startLedge.y - Math.max(120, Math.floor(args.player.displayHeight * 0.85));
            args.scene.tweens.add({
                targets: args.player,
                x: startLedge.x,
                y: targetY,
                duration: args.options.playerTransitionMs,
                ease: "Sine.easeInOut",
            });
        }
        args.syncBombCount();
        args.enforceBombSafeZone(config.bombSpeed);
    } else {
        nextPlatforms = args.buildPlatforms(args.scene, nextPlatforms, config.platformLayout);
        args.resetStars(nextPlatforms as Phaser.Physics.Arcade.StaticGroup);
        if (!args.options.preservePlayer) {
            args.placePlayerAtLevelStart(args.player, config.platformLayout, args.level);
        }
        args.syncBombCount();
        args.enforceBombSafeZone(config.bombSpeed);
    }

    args.setUiLevel(args.level);
    args.onLevelActivated();
    args.playTone(480 + args.level * 30, 120, 0.025, "triangle");
    args.playTone(610 + args.level * 30, 150, 0.02, "triangle");
    if (!args.reducedMotion) {
        args.scene.cameras.main.flash(220, 255, 255, 255, false);
    }

    if (args.showBanner) {
        args.levelBanner(args.scene, `Level ${args.level}: ${config.title}`);
    }

    return nextPlatforms as Phaser.Physics.Arcade.StaticGroup;
}
