<script lang="ts">
    import axios from "axios";
    import * as Phaser from "phaser";
    import { onDestroy, onMount } from "svelte";
    import highscores from "../src/stores/highscores";
    import player1nft from "../src/stores/player1nft";
    import { playerImage } from "../src/stores/playerImage";
    import playerName from "../src/stores/playername";
    import { push } from "svelte-spa-router";

    type PlatformConfig = {
        x: number;
        y: number;
        scaleX?: number;
    };

    type LevelConfig = {
        title: string;
        tint: number;
        platformLayout: PlatformConfig[];
        starCount: number;
        targetBombs: number;
        bombSpeed: number;
    };

    const LEVELS: LevelConfig[] = [
        {
            title: "Rooftop Run",
            tint: 0x9bd5ff,
            starCount: 12,
            targetBombs: 1,
            bombSpeed: 140,
            platformLayout: [
                { x: 120, y: 720 },
                { x: 760, y: 650 },
                { x: 1120, y: 500 },
            ],
        },
        {
            title: "Factory Lift",
            tint: 0xffd38f,
            starCount: 14,
            targetBombs: 2,
            bombSpeed: 170,
            platformLayout: [
                { x: 240, y: 760 },
                { x: 620, y: 620 },
                { x: 1000, y: 470 },
                { x: 1260, y: 340 },
            ],
        },
        {
            title: "Storm Walk",
            tint: 0xbac3ff,
            starCount: 15,
            targetBombs: 3,
            bombSpeed: 190,
            platformLayout: [
                { x: 120, y: 670 },
                { x: 450, y: 520 },
                { x: 780, y: 650 },
                { x: 1120, y: 500 },
                { x: 1320, y: 380 },
            ],
        },
        {
            title: "Neon Tunnel",
            tint: 0xff9add,
            starCount: 16,
            targetBombs: 4,
            bombSpeed: 220,
            platformLayout: [
                { x: 170, y: 740 },
                { x: 420, y: 560 },
                { x: 710, y: 430 },
                { x: 980, y: 560 },
                { x: 1220, y: 390 },
            ],
        },
        {
            title: "Core Breach",
            tint: 0xff8d8d,
            starCount: 18,
            targetBombs: 5,
            bombSpeed: 245,
            platformLayout: [
                { x: 110, y: 690 },
                { x: 340, y: 520 },
                { x: 590, y: 670 },
                { x: 820, y: 470 },
                { x: 1070, y: 640 },
                { x: 1290, y: 430 },
            ],
        },
    ];

    const GAME_WIDTH = 1400;
    const GAME_HEIGHT = 1000;
    const GAME_CONTAINER_ID = "game-root";

    let game: Phaser.Game | null = null;
    let sceneRef: Phaser.Scene | null = null;
    let background: Phaser.GameObjects.Image | null = null;
    let farLayer: Phaser.GameObjects.TileSprite | null = null;
    let nearLayer: Phaser.GameObjects.TileSprite | null = null;
    let glowOverlay: Phaser.GameObjects.Rectangle | null = null;
    let platforms: Phaser.Physics.Arcade.StaticGroup;
    let stars: Phaser.Physics.Arcade.Group;
    let bombs: Phaser.Physics.Arcade.Group;
    let player: Phaser.Physics.Arcade.Sprite;
    let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    let audioContext: AudioContext | null = null;

    let score = 0;
    let level = 1;
    let comboMultiplier = 1;
    let lastCollectAt = 0;
    let scorePosted = false;
    let isDead = false;

    let showGameOver = false;
    let submittingScore = false;
    let latestScore = 0;
    let didBeatHighScore = false;
    let scoreSaveError = "";
    let levelThemeName = LEVELS[0].title;
    let uiScore = 0;
    let uiCombo = 1;
    let uiLevel = 1;

    $: highScoreValue = $highscores?.[0]?.score ?? 0;

    function getAudioContext(): AudioContext | null {
        if (audioContext) {
            return audioContext;
        }
        if (typeof window === "undefined") {
            return null;
        }

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
            return null;
        }

        audioContext = new AudioCtx();
        return audioContext;
    }

    function playTone(frequency: number, durationMs: number, gain = 0.03, type: OscillatorType = "sine") {
        const ctx = getAudioContext();
        if (!ctx) {
            return;
        }

        if (ctx.state === "suspended") {
            void ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = gain;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(gain, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
        oscillator.start(now);
        oscillator.stop(now + durationMs / 1000);
    }

    function activeLevelConfig(): LevelConfig {
        return LEVELS[Math.min(level - 1, LEVELS.length - 1)];
    }

    function resetSessionState() {
        score = 0;
        level = 1;
        comboMultiplier = 1;
        lastCollectAt = 0;
        scorePosted = false;
        isDead = false;
        showGameOver = false;
        submittingScore = false;
        latestScore = 0;
        didBeatHighScore = false;
        scoreSaveError = "";
        levelThemeName = LEVELS[0].title;
        uiScore = 0;
        uiCombo = 1;
        uiLevel = 1;
    }

    function buildPlatforms(scene: Phaser.Scene, layout: PlatformConfig[]) {
        if (!platforms) {
            platforms = scene.physics.add.staticGroup();
        } else {
            platforms.clear(true, true);
        }
        platforms.create(700, 1050, "ground").setScale(4).refreshBody();

        layout.forEach((piece) => {
            const platform = platforms.create(piece.x, piece.y, "ground");
            if (piece.scaleX) {
                platform.setScale(piece.scaleX, 1).refreshBody();
            }
        });
    }

    function spawnBomb(scene: Phaser.Scene, speedBase: number) {
        const x = player && player.x < GAME_WIDTH / 2
            ? Phaser.Math.Between(700, GAME_WIDTH - 50)
            : Phaser.Math.Between(50, 650);
        const bomb = bombs.create(x, 16, "bomb");
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(
            Phaser.Math.Between(-speedBase, speedBase),
            Phaser.Math.Between(80, 160),
        );
    }

    function syncBombCount(scene: Phaser.Scene) {
        const target = activeLevelConfig().targetBombs;
        const currentCount = bombs.countActive(true);
        const missing = Math.max(0, target - currentCount);
        for (let i = 0; i < missing; i += 1) {
            spawnBomb(scene, activeLevelConfig().bombSpeed);
        }
    }

    function resetStars() {
        if (!stars) {
            stars = sceneRef!.physics.add.group();
            sceneRef!.physics.add.collider(stars, platforms);
            sceneRef!.physics.add.overlap(player, stars, collectStar, undefined, sceneRef!);
        } else {
            stars.clear(true, true);
        }

        const totalStars = activeLevelConfig().starCount;
        for (let i = 0; i < totalStars; i += 1) {
            const star = stars.create(30 + i * 78, 0, "star") as Phaser.Physics.Arcade.Image;
            star.setBounceY(Phaser.Math.FloatBetween(0.2, 0.8));
        }

        stars.children.iterate((child) => {
            const eachStar = child as Phaser.Physics.Arcade.Image;
            eachStar.setBounceY(Phaser.Math.FloatBetween(0.2, 0.8));
        });
    }

    function levelBanner(scene: Phaser.Scene, text: string) {
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
            alpha: { from: 1, to: 0 },
            y: 140,
            duration: 1200,
            onComplete: () => banner.destroy(),
        });
    }

    function applyLevelTheme(scene: Phaser.Scene, showBanner = false) {
        const config = activeLevelConfig();
        levelThemeName = config.title;
        if (background) {
            background.setTint(config.tint);
        }
        if (farLayer) {
            farLayer.setTint(config.tint);
        }
        if (nearLayer) {
            nearLayer.setTint(config.tint);
        }
        if (glowOverlay) {
            glowOverlay.setFillStyle(config.tint, 0.08);
        }

        buildPlatforms(scene, config.platformLayout);
        resetStars();
        syncBombCount(scene);
        uiLevel = level;
        comboMultiplier = 1;
        uiCombo = 1;
        playTone(480 + level * 30, 120, 0.025, "triangle");
        playTone(610 + level * 30, 150, 0.02, "triangle");

        if (showBanner) {
            levelBanner(scene, `Level ${level}: ${config.title}`);
        }
    }

    async function saveScore() {
        const selectedNft = $player1nft;
        submittingScore = true;
        scoreSaveError = "";
        try {
            await axios.post("https://nftgame-server.vercel.app/scores", {
                token: selectedNft?.tokenAddress ?? "",
                imageURL: selectedNft?.imageURL ?? $playerImage ?? "",
                score,
                playerName: $playerName ?? "anonymous",
            });
        } catch (error) {
            scoreSaveError = "Unable to save score right now.";
            console.error("failed to save score", error);
        } finally {
            submittingScore = false;
        }
    }

    async function hitBomb(this: Phaser.Scene, colliderPlayer: Phaser.GameObjects.GameObject) {
        if (isDead || scorePosted) {
            return;
        }
        isDead = true;
        scorePosted = true;
        this.physics.pause();

        const body = colliderPlayer as Phaser.Physics.Arcade.Sprite;
        body.setTint(0xff0000);
        playTone(140, 300, 0.045, "sawtooth");

        latestScore = score;
        didBeatHighScore = score > highScoreValue;
        showGameOver = true;
        await saveScore();
    }

    function collectStar(this: Phaser.Scene, _: Phaser.GameObjects.GameObject, rawStar: Phaser.GameObjects.GameObject) {
        const star = rawStar as Phaser.Physics.Arcade.Image;
        star.disableBody(true, true);

        const now = this.time.now;
        comboMultiplier = now - lastCollectAt <= 1400 ? Math.min(6, comboMultiplier + 1) : 1;
        lastCollectAt = now;

        const points = 10 * comboMultiplier;
        score += points;
        uiScore = score;
        uiCombo = comboMultiplier;
        playTone(460 + comboMultiplier * 45, 90, 0.025, "square");

        const plusText = this.add.text(star.x, star.y - 20, `+${points}`, {
            fontFamily: "Verdana, sans-serif",
            fontSize: "24px",
            color: "#ffe780",
            stroke: "#413100",
            strokeThickness: 4,
        });
        plusText.setOrigin(0.5);
        this.tweens.add({
            targets: plusText,
            y: star.y - 60,
            alpha: 0,
            duration: 500,
            onComplete: () => plusText.destroy(),
        });

        const particles = this.add.particles(star.x, star.y, "star", {
            speed: { min: 45, max: 140 },
            scale: { start: 0.15, end: 0 },
            lifespan: 400,
            quantity: 8,
            gravityY: 230,
        });
        this.time.delayedCall(450, () => particles.destroy());

        if (stars.countActive(true) === 0) {
            if (level < LEVELS.length) {
                level += 1;
                applyLevelTheme(this, true);
            } else {
                resetStars();
                syncBombCount(this);
            }
        }
    }

    function preload(this: Phaser.Scene) {
        this.load.image("sky", "./newsky.png");
        this.load.image("sky-old", "./sky.png");
        this.load.image("cityline", "./buildingpixelated.png");
        this.load.image("ground", "./platform.png");
        this.load.image("star", "./star.png");
        this.load.image("bomb", "./bomb.png");
        this.load.image("dude", $playerImage || "./dude.png", {
            frameWidth: 180,
            frameHeight: 270,
        });
    }

    function create(this: Phaser.Scene) {
        sceneRef = this;
        background = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "sky");
        farLayer = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, GAME_WIDTH, GAME_HEIGHT, "sky-old");
        farLayer.setAlpha(0.28);
        nearLayer = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 260, GAME_WIDTH, 480, "cityline");
        nearLayer.setAlpha(0.4);
        glowOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x9bd5ff, 0.08);
        glowOverlay.setBlendMode(Phaser.BlendModes.SCREEN);

        player = this.physics.add.sprite(100, 450, "dude");
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);

        bombs = this.physics.add.group();
        this.physics.add.collider(player, bombs, hitBomb, undefined, this);

        cursors = this.input.keyboard.createCursorKeys();
        applyLevelTheme(this, true);
        this.physics.add.collider(player, platforms);
        this.physics.add.collider(bombs, platforms);
    }

    function update() {
        if (!player || !cursors || isDead) {
            return;
        }

        const drift = 0.15 + level * 0.04;
        if (farLayer) {
            farLayer.tilePositionX += drift;
        }
        if (nearLayer) {
            nearLayer.tilePositionX += drift * 1.7;
        }

        if (cursors.left.isDown) {
            player.setVelocityX(-180);
            if (nearLayer) {
                nearLayer.tilePositionX -= 1.6;
            }
        } else if (cursors.right.isDown) {
            player.setVelocityX(180);
            if (nearLayer) {
                nearLayer.tilePositionX += 1.6;
            }
        } else {
            player.setVelocityX(0);
        }

        if (cursors.up.isDown && player.body.touching.down) {
            player.setVelocityY(-460);
        }
    }

    function retryRun() {
        location.reload();
    }

    async function backToMenu() {
        await push("/");
        location.reload();
    }

    onMount(() => {
        resetSessionState();
        game = new Phaser.Game({
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            parent: GAME_CONTAINER_ID,
            physics: {
                default: "arcade",
                arcade: {
                    gravity: { y: 320 },
                    debug: false,
                },
            },
            scene: {
                preload,
                create,
                update,
            },
        });
    });

    onDestroy(() => {
        if (game) {
            game.destroy(true);
            game = null;
        }
    });
</script>

<div class="game-shell">
    <div id={GAME_CONTAINER_ID} class="game-canvas" />
    <div class="hud">
        <div class="hud-card player-card">
            <span class="label">Pilot</span>
            <span class="value">{$playerName || "Anonymous Panda"}</span>
        </div>
        <div class="hud-card">
            <span class="label">Level</span>
            <span class="value">{uiLevel}/{LEVELS.length}</span>
            <span class="sub">{levelThemeName}</span>
        </div>
        <div class="hud-card">
            <span class="label">Score</span>
            <span class="value">{uiScore}</span>
            <span class="sub">High {highScoreValue}</span>
        </div>
        <div class="hud-card combo-card">
            <span class="label">Combo</span>
            <span class="value">x{uiCombo}</span>
            <span class="sub">{uiCombo >= 4 ? "On fire" : "Build momentum"}</span>
        </div>
    </div>

    {#if showGameOver}
        <div class="game-over-overlay">
            <div class="game-over-card">
                <h2>Run Complete</h2>
                <p>Score: {latestScore}</p>
                <p>{didBeatHighScore ? "New personal best in this session." : "Try one more run."}</p>
                {#if submittingScore}
                    <p>Saving score...</p>
                {:else if scoreSaveError}
                    <p class="error">{scoreSaveError}</p>
                {:else}
                    <p>Score submitted.</p>
                {/if}
                <div class="actions">
                    <button on:click={retryRun}>Retry</button>
                    <button class="secondary" on:click={backToMenu}>Menu</button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(:root) {
        --ui-shell-shadow: rgba(4, 10, 26, 0.55);
        --ui-border: rgba(219, 234, 255, 0.24);
        --ui-ink: #edf5ff;
        --ui-muted: #a8bfde;
        --ui-warm: #ffd58f;
        --ui-cool: #8fd2ff;
    }

    .game-shell {
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 22px 52px var(--ui-shell-shadow);
    }

    .game-canvas {
        min-height: 500px;
        background: radial-gradient(circle at 20% 20%, #3e5a85 0%, #18253f 46%, #0c1423 100%);
    }

    .hud {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        pointer-events: none;
    }

    .hud-card {
        background: linear-gradient(155deg, rgba(9, 21, 46, 0.84), rgba(4, 12, 27, 0.76));
        border: 1px solid var(--ui-border);
        border-radius: 12px;
        padding: 8px 12px 9px;
        display: grid;
        gap: 2px;
        backdrop-filter: blur(3px);
    }

    .player-card .value {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .combo-card {
        box-shadow: inset 0 0 0 1px rgba(255, 145, 212, 0.25);
    }

    .label {
        color: var(--ui-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 11px;
        font-weight: 700;
    }

    .value {
        color: var(--ui-ink);
        font-family: "Trebuchet MS", "Lucida Sans Unicode", sans-serif;
        font-size: 20px;
        font-weight: 800;
        line-height: 1.1;
    }

    .sub {
        color: var(--ui-warm);
        font-size: 11px;
        font-weight: 600;
    }

    .game-over-overlay {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: rgba(8, 12, 20, 0.76);
        backdrop-filter: blur(2px);
    }

    .game-over-card {
        width: min(420px, 90vw);
        background: linear-gradient(165deg, rgba(23, 35, 61, 0.98), rgba(10, 17, 33, 0.96));
        color: #eef5ff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        padding: 22px 24px 20px;
        text-align: center;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
    }

    .game-over-card h2 {
        margin: 0 0 8px;
        font-size: 34px;
        letter-spacing: 0.03em;
        color: #fff0cb;
    }

    .game-over-card p {
        margin: 6px 0;
        color: #d7e6ff;
    }

    .error {
        color: #ffc1c1;
    }

    .actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 16px;
    }

    .actions button {
        border: none;
        border-radius: 10px;
        background: linear-gradient(140deg, #ffd37f, #ffbf63);
        color: #1f1a0f;
        font-weight: 700;
        padding: 10px 18px;
        cursor: pointer;
        transition: transform 120ms ease, filter 120ms ease;
    }

    .actions button.secondary {
        background: linear-gradient(140deg, #9ecbff, #74bcff);
    }

    .actions button:hover {
        transform: translateY(-1px);
        filter: brightness(1.03);
    }

    @media (max-width: 900px) {
        .game-shell {
            border-radius: 10px;
        }

        .hud {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .value {
            font-size: 17px;
        }
    }
</style>
