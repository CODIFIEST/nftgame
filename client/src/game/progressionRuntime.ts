import type * as Phaser from "phaser";
import { anchorXForLevel, type LevelConfig } from "./levels";
import { sequentialRevealDurationMs } from "./platformRuntime";

type AdvanceAfterClearArgs = {
    scene: Phaser.Scene;
    level: number;
    levels: LevelConfig[];
    isLevelTransitioning: boolean;
    setIsLevelTransitioning: (value: boolean) => void;
    setLevel: (value: number) => void;
    player: Phaser.Physics.Arcade.Sprite;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    gameWidth: number;
    baseCameraZoom: number;
    background: Phaser.GameObjects.Image | null;
    applyBackgroundSection: (
        scene: Phaser.Scene,
        background: Phaser.GameObjects.Image | null,
        levelNumber: number,
        animate: boolean,
    ) => void;
    getCurrentAnchorLedge: (
        player: Phaser.Physics.Arcade.Sprite,
        platforms: Phaser.Physics.Arcade.StaticGroup,
    ) => { x: number; y: number };
    getCurrentAnchorPlatform: (
        player: Phaser.Physics.Arcade.Sprite,
        platforms: Phaser.Physics.Arcade.StaticGroup,
    ) => Phaser.Physics.Arcade.Image | null;
    playTone: (frequency: number, durationMs: number, gain?: number, type?: OscillatorType) => void;
    applyLevelTheme: (
        scene: Phaser.Scene,
        showBanner?: boolean,
        options?: {
            preservePlayer?: boolean;
            anchor?: { x: number; y: number };
            skipBackgroundPan?: boolean;
            platformTransitionMs?: number;
            playerTransitionMs?: number;
            sequentialReveal?: boolean;
        },
    ) => void;
    onFinalLevelCleared: () => void;
};

export function advanceAfterStarClear(args: AdvanceAfterClearArgs): void {
    if (args.level >= args.levels.length) {
        args.onFinalLevelCleared();
        return;
    }
    if (args.isLevelTransitioning) {
        return;
    }

    args.setIsLevelTransitioning(true);
    args.player.setVelocity(0, 0);
    const anchor = args.getCurrentAnchorLedge(args.player, args.platforms);
    const anchorPlatform = args.getCurrentAnchorPlatform(args.player, args.platforms);
    const nextLevel = args.level + 1;
    const desiredAnchorX = anchorXForLevel(nextLevel, args.gameWidth);
    const transitionDuration = 2700;
    const platformObjects = (args.platforms.getChildren() as Phaser.Physics.Arcade.Image[]) ?? [];
    const platformStartX = platformObjects.map((platform) => platform.x);
    const playerStartX = args.player.x;
    const playerStartY = args.player.y;
    const anchorPlatformStartX = anchorPlatform?.x ?? playerStartX;
    const anchorPlatformStartY = anchorPlatform?.y ?? playerStartY + 90;
    const transitionShift = anchorPlatformStartX - desiredAnchorX;
    const playerOffsetX = playerStartX - anchorPlatformStartX;
    const playerOffsetY = playerStartY - anchorPlatformStartY;

    args.scene.cameras.main.flash(180, 255, 250, 210, false);
    args.scene.tweens.add({
        targets: args.scene.cameras.main,
        zoom: args.baseCameraZoom + 0.06,
        duration: 140,
        yoyo: true,
        ease: "Sine.easeInOut",
    });
    args.playTone(780, 120, 0.03, "triangle");
    args.playTone(920, 120, 0.024, "triangle");
    args.scene.physics.pause();
    args.applyBackgroundSection(args.scene, args.background, nextLevel, true);
    args.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: transitionDuration,
        ease: "Sine.easeInOut",
        onUpdate: (tween) => {
            const t = tween.getValue();
            platformObjects.forEach((platform, index) => {
                platform.x = platformStartX[index] - transitionShift * t;
                platform.refreshBody();
            });
            if (anchorPlatform) {
                args.player.x = anchorPlatform.x + playerOffsetX;
                args.player.y = anchorPlatform.y + playerOffsetY;
            } else {
                args.player.x = playerStartX - transitionShift * t;
                args.player.y = playerStartY;
            }
        },
        onComplete: () => {
            args.setLevel(nextLevel);
            const revealMs = sequentialRevealDurationMs(args.levels[nextLevel - 1].platformLayout.length);
            args.applyLevelTheme(args.scene, true, {
                preservePlayer: true,
                anchor: { x: desiredAnchorX, y: anchor.y },
                skipBackgroundPan: true,
                sequentialReveal: true,
            });
            args.scene.time.delayedCall(revealMs + 80, () => {
                args.player.setVelocity(0, 0);
                args.scene.physics.resume();
                args.setIsLevelTransitioning(false);
            });
        },
    });
}
