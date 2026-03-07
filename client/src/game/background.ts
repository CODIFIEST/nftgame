import type * as Phaser from "phaser";
import { backgroundTargetPositionForLevel } from "./sceneMath";

export function applyBackgroundSection(
    scene: Phaser.Scene,
    background: Phaser.GameObjects.Image | null,
    levelNumber: number,
    animate: boolean,
): void {
    if (!background) {
        return;
    }
    const target = backgroundTargetPositionForLevel(levelNumber);
    if (!animate) {
        background.setPosition(target.x, target.y);
        console.log("[GameDebug] background section set", { level: levelNumber, section: target.sectionIndex });
        return;
    }

    scene.tweens.add({
        targets: background,
        x: target.x,
        y: target.y,
        duration: 2700,
        ease: "Sine.easeInOut",
    });
    console.log("[GameDebug] background section tween", { level: levelNumber, section: target.sectionIndex });
}
