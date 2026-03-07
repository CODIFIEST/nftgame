import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./constants";
import type { PlatformConfig } from "./levels";

type ResetStarsArgs = {
    scene: Phaser.Scene;
    stars: Phaser.Physics.Arcade.Group | undefined;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    player: Phaser.Physics.Arcade.Sprite;
    collectStar: (
        this: Phaser.Scene,
        a: Phaser.GameObjects.GameObject,
        b: Phaser.GameObjects.GameObject,
    ) => void;
    layout: PlatformConfig[];
    totalStars: number;
    clamp: (value: number, min: number, max: number) => number;
};

export function normalizePlayerSprite(player: Phaser.Physics.Arcade.Sprite, scene: Phaser.Scene): void {
    const dudeTexture = scene.textures.get("dude");
    const source = dudeTexture.getSourceImage() as { width?: number; height?: number };
    const sourceWidth = source?.width ?? 96;
    const sourceHeight = source?.height ?? 96;
    const maxWidth = 96;
    const maxHeight = 112;
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

    player.setScale(safeScale);
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setSize(
        Math.max(36, Math.floor(sourceWidth * 0.45)),
        Math.max(62, Math.floor(sourceHeight * 0.9)),
        true,
    );
    console.log("[GameDebug] normalized player sprite", {
        sourceWidth,
        sourceHeight,
        displayWidth: player.displayWidth,
        displayHeight: player.displayHeight,
        bodyWidth: body.width,
        bodyHeight: body.height,
    });
}

export function resetStars(args: ResetStarsArgs): Phaser.Physics.Arcade.Group {
    const { scene, platforms, player, collectStar, layout, totalStars, clamp } = args;
    const stars = args.stars ?? scene.physics.add.group();

    if (!args.stars) {
        scene.physics.add.collider(stars, platforms);
        scene.physics.add.overlap(player, stars, collectStar, undefined, scene);
    } else {
        stars.clear(true, true);
    }

    for (let i = 0; i < totalStars; i += 1) {
        const platform = layout[i % layout.length];
        const platformRow = Math.floor(i / layout.length);
        const estimatedPlatformWidth = 128 * (platform.scaleX ?? 1);
        const xJitter = Math.max(8, Math.min(26, estimatedPlatformWidth * 0.22));
        const x = clamp(platform.x + Phaser.Math.Between(-xJitter, xJitter), 40, GAME_WIDTH - 40);
        const y = clamp(platform.y - 170 - platformRow * 34, 25, GAME_HEIGHT - 130);
        const star = stars.create(x, y, "star") as Phaser.Physics.Arcade.Image;
        star.setBounceY(Phaser.Math.FloatBetween(0.05, 0.16));
        star.setCollideWorldBounds(true);
    }

    stars.children.iterate((child) => {
        const eachStar = child as Phaser.Physics.Arcade.Image;
        eachStar.setBounceY(Phaser.Math.FloatBetween(0.2, 0.8));
    });

    return stars;
}

export function levelBanner(scene: Phaser.Scene, text: string): void {
    const flash = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.22);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 320,
        ease: "Cubic.easeOut",
        onComplete: () => flash.destroy(),
    });

    const banner = scene.add.text(GAME_WIDTH / 2, 170, text, {
        fontFamily: "Georgia, serif",
        fontSize: "42px",
        color: "#ffffff",
        stroke: "#1a2538",
        strokeThickness: 8,
    });
    banner.setOrigin(0.5);
    scene.tweens.add({
        targets: banner,
        scale: { from: 0.84, to: 1.08 },
        yoyo: true,
        repeat: 1,
        duration: 280,
        ease: "Back.easeOut",
    });
    scene.tweens.add({
        targets: banner,
        alpha: { from: 1, to: 0 },
        y: 140,
        duration: 1200,
        onComplete: () => banner.destroy(),
    });
}
