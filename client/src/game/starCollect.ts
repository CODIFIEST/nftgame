import type * as Phaser from "phaser";

export function nextComboMultiplier(
    nowMs: number,
    lastCollectAtMs: number,
    currentCombo: number,
    windowMs = 1400,
    maxCombo = 6,
): number {
    if (nowMs - lastCollectAtMs <= windowMs) {
        return Math.min(maxCombo, currentCombo + 1);
    }
    return 1;
}

export function pointsForCombo(combo: number): number {
    return 10 * combo;
}

export function renderStarCollectFx(
    scene: Phaser.Scene,
    star: Phaser.Physics.Arcade.Image,
    points: number,
): void {
    const plusText = scene.add.text(star.x, star.y - 20, `+${points}`, {
        fontFamily: "Verdana, sans-serif",
        fontSize: "24px",
        color: "#ffe780",
        stroke: "#413100",
        strokeThickness: 4,
    });
    plusText.setOrigin(0.5);
    scene.tweens.add({
        targets: plusText,
        y: star.y - 60,
        alpha: 0,
        duration: 500,
        onComplete: () => plusText.destroy(),
    });

    const particles = scene.add.particles("star");
    particles.createEmitter({
        x: star.x,
        y: star.y,
        speed: { min: 45, max: 140 },
        scale: { start: 0.15, end: 0 },
        lifespan: 400,
        quantity: 8,
        gravityY: 230,
    });
    scene.time.delayedCall(450, () => particles.destroy());
}
