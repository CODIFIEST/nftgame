import type * as Phaser from "phaser";

type UpdatePlayerMotionArgs = {
    player: Phaser.Physics.Arcade.Sprite;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    touchLeftActive: boolean;
    touchRightActive: boolean;
    touchJumpActive: boolean;
    moveSpeed: number;
    jumpInitialVelocity: number;
    jumpHoldAccel: number;
    jumpHoldMaxMs: number;
    jumpReleaseCutoff: number;
    sceneDeltaMs: number;
    jumpHoldTimeMs: number;
    jumpPressedLastFrame: boolean;
};

export function updatePlayerMotion(args: UpdatePlayerMotionArgs): {
    jumpHoldTimeMs: number;
    jumpPressedLastFrame: boolean;
} {
    const moveLeft = Boolean(args.cursors.left.isDown || args.touchLeftActive);
    const moveRight = Boolean(args.cursors.right.isDown || args.touchRightActive);

    if (moveLeft && !moveRight) {
        args.player.setVelocityX(-args.moveSpeed);
    } else if (moveRight && !moveLeft) {
        args.player.setVelocityX(args.moveSpeed);
    } else {
        args.player.setVelocityX(0);
    }

    const jumpPressed = Boolean(args.cursors.up.isDown || args.touchJumpActive);
    const body = args.player.body as Phaser.Physics.Arcade.Body;
    const dt = args.sceneDeltaMs / 1000;
    let jumpHoldTimeMs = args.jumpHoldTimeMs;

    if (jumpPressed && !args.jumpPressedLastFrame && body.blocked.down) {
        args.player.setVelocityY(args.jumpInitialVelocity);
        jumpHoldTimeMs = 0;
    }

    if (jumpPressed && body.velocity.y < 0 && jumpHoldTimeMs < args.jumpHoldMaxMs) {
        args.player.setVelocityY(body.velocity.y + args.jumpHoldAccel * dt);
        jumpHoldTimeMs += dt * 1000;
    }

    if (!jumpPressed && body.velocity.y < args.jumpReleaseCutoff) {
        args.player.setVelocityY(args.jumpReleaseCutoff);
    }

    if (body.blocked.down && !jumpPressed) {
        jumpHoldTimeMs = 0;
    }

    return {
        jumpHoldTimeMs,
        jumpPressedLastFrame: jumpPressed,
    };
}
