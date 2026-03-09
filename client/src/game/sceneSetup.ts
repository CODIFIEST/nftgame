import * as Phaser from "phaser";

/** Arguments for setup game scene. */
type SetupGameSceneArgs = {
    gameWidth: number;
    gameHeight: number;
    backgroundScale: number;
    baseCameraZoom: number;
    hasRunStarted: boolean;
    normalizePlayerSprite: (player: Phaser.Physics.Arcade.Sprite, scene: Phaser.Scene) => void;
    applyBackgroundSection: (
        scene: Phaser.Scene,
        background: Phaser.GameObjects.Image | null,
        levelNumber: number,
        animate: boolean,
    ) => void;
    hitBomb: (
        this: Phaser.Scene,
        a: Phaser.GameObjects.GameObject,
        b: Phaser.GameObjects.GameObject,
    ) => void | Promise<void>;
    centerZoomedCamera: (scene: Phaser.Scene) => void;
};

/** Result shape returned by setup game scene. */
export type SetupGameSceneResult = {
    background: Phaser.GameObjects.Image;
    glowOverlay: Phaser.GameObjects.Rectangle;
    ambienceParticles: Phaser.GameObjects.Particles.ParticleEmitterManager;
    player: Phaser.Physics.Arcade.Sprite;
    bombs: Phaser.Physics.Arcade.Group;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
};

/** Performs setup game scene. */
export function setupGameScene(scene: Phaser.Scene, args: SetupGameSceneArgs): SetupGameSceneResult {
    scene.physics.world.timeScale = 1;
    scene.physics.world.setBounds(0, 0, args.gameWidth, args.gameHeight);
    scene.cameras.main.setBounds(0, 0, args.gameWidth, args.gameHeight);
    scene.cameras.main.setZoom(args.baseCameraZoom);
    args.centerZoomedCamera(scene);

    const background = scene.add.image(args.gameWidth / 2, args.gameHeight / 2, "sky");
    background.setDisplaySize(args.gameWidth * args.backgroundScale, args.gameHeight * args.backgroundScale);
    args.applyBackgroundSection(scene, background, 1, false);

    const glowOverlay = scene.add.rectangle(
        args.gameWidth / 2,
        args.gameHeight / 2,
        args.gameWidth,
        args.gameHeight,
        0x9bd5ff,
        0.05,
    );
    glowOverlay.setBlendMode(Phaser.BlendModes.SCREEN);

    const ambienceParticles = scene.add.particles("star");
    ambienceParticles.createEmitter({
        x: { min: 0, max: args.gameWidth },
        y: { min: -30, max: args.gameHeight + 10 },
        speedX: { min: -9, max: 9 },
        speedY: { min: 10, max: 22 },
        lifespan: 16000,
        quantity: 1,
        frequency: 230,
        alpha: { start: 0.22, end: 0.02 },
        scale: { start: 0.05, end: 0.01 },
        blendMode: Phaser.BlendModes.SCREEN,
    });

    const player = scene.physics.add.sprite(100, 450, "dude");
    args.normalizePlayerSprite(player, scene);
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    const bombs = scene.physics.add.group();
    scene.physics.add.collider(player, bombs, args.hitBomb, undefined, scene);

    const cursors = scene.input.keyboard.createCursorKeys();

    return {
        background,
        glowOverlay,
        ambienceParticles,
        player,
        bombs,
        cursors,
    };
}
