import * as Phaser from "phaser";
import { GAME_WIDTH, PLAYER_BOMB_SAFE_DISTANCE } from "./constants";
import { bombStyleForLevel } from "./sceneMath";

type BombGroup = Phaser.Physics.Arcade.Group;
type ArcadeSprite = Phaser.Physics.Arcade.Sprite;
type ArcadeImage = Phaser.Physics.Arcade.Image;

export function applyBombStyle(bomb: ArcadeImage, currentLevel: number): void {
    const style = bombStyleForLevel(currentLevel);
    bomb.setTint(style.tint);
    bomb.setScale(style.scale);
    bomb.setAlpha(0.96);
}

export function spawnBomb(
    bombs: BombGroup,
    player: ArcadeSprite | null,
    speedBase: number,
    currentLevel: number,
): void {
    let x = Phaser.Math.Between(50, GAME_WIDTH - 50);
    if (player) {
        for (let attempt = 0; attempt < 8; attempt += 1) {
            const candidate = Phaser.Math.Between(50, GAME_WIDTH - 50);
            if (Math.abs(candidate - player.x) >= PLAYER_BOMB_SAFE_DISTANCE) {
                x = candidate;
                break;
            }
        }
    }
    const bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    applyBombStyle(bomb as ArcadeImage, currentLevel);
    bomb.setVelocity(Phaser.Math.Between(-speedBase, speedBase), Phaser.Math.Between(80, 160));
}

export function enforceBombSafeZone(
    bombs: BombGroup,
    player: ArcadeSprite | null,
    speedBase: number,
): void {
    if (!player) {
        return;
    }
    bombs.children.each((child) => {
        const bomb = child as ArcadeImage;
        if (!bomb.active) {
            return;
        }
        const dx = Math.abs(bomb.x - player.x);
        const dy = Math.abs(bomb.y - player.y);
        const tooClose = dx < PLAYER_BOMB_SAFE_DISTANCE && dy < 220;
        if (!tooClose) {
            return;
        }

        let nextX = bomb.x;
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const candidate = Phaser.Math.Between(50, GAME_WIDTH - 50);
            if (Math.abs(candidate - player.x) >= PLAYER_BOMB_SAFE_DISTANCE) {
                nextX = candidate;
                break;
            }
        }
        bomb.setPosition(nextX, 16);
        bomb.setVelocity(Phaser.Math.Between(-speedBase, speedBase), Phaser.Math.Between(80, 160));
    });
}

export function keepBombsVisible(
    bombs: BombGroup,
    visibleTopY: number,
    visibleLeftX = 0,
    visibleRightX = GAME_WIDTH,
): void {
    bombs.children.each((child) => {
        const bomb = child as ArcadeImage;
        if (!bomb.active) {
            return;
        }
        const body = bomb.body as Phaser.Physics.Arcade.Body;
        const radius = Math.max(10, bomb.displayWidth * 0.5);
        const minX = visibleLeftX + radius;
        const maxX = visibleRightX - radius;

        if (bomb.x < minX) {
            bomb.x = minX;
            body.velocity.x = Math.max(120, Math.abs(body.velocity.x));
        } else if (bomb.x > maxX) {
            bomb.x = maxX;
            body.velocity.x = -Math.max(120, Math.abs(body.velocity.x));
        }
        if (bomb.y < visibleTopY) {
            bomb.y = visibleTopY;
            body.velocity.y = Math.max(120, Math.abs(body.velocity.y));
        }
    });
}

export function syncBombCount(
    bombs: BombGroup,
    player: ArcadeSprite | null,
    currentLevel: number,
    targetBombs: number,
    bombSpeed: number,
): void {
    const currentCount = bombs.countActive(true);
    const missing = Math.max(0, targetBombs - currentCount);
    for (let i = 0; i < missing; i += 1) {
        spawnBomb(bombs, player, bombSpeed, currentLevel);
    }
    bombs.children.each((child) => {
        const bomb = child as ArcadeImage;
        if (bomb.active) {
            applyBombStyle(bomb, currentLevel);
        }
    });
}
