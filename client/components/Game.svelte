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

    type BombStyle = {
        tint: number;
        scale: number;
    };

    type LevelThemeOptions = {
        preservePlayer?: boolean;
        anchor?: { x: number; y: number };
        skipBackgroundPan?: boolean;
        platformTransitionMs?: number;
        playerTransitionMs?: number;
        sequentialReveal?: boolean;
    };

    const BASE_LEVEL_THEMES: Pick<LevelConfig, "title" | "tint">[] = [
        {
            title: "Rooftop Run",
            tint: 0x9bd5ff,
        },
        {
            title: "Factory Lift",
            tint: 0xffd38f,
        },
        {
            title: "Storm Walk",
            tint: 0xbac3ff,
        },
        {
            title: "Neon Tunnel",
            tint: 0xff9add,
        },
        {
            title: "Core Breach",
            tint: 0xff8d8d,
        },
    ];

    function clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    function rowIndexForLevel(levelNumber: number): number {
        return Math.floor((levelNumber - 1) / 5);
    }

    function movesRightForLevel(levelNumber: number): boolean {
        return rowIndexForLevel(levelNumber) % 2 === 0;
    }

    function anchorXForLevel(levelNumber: number): number {
        return movesRightForLevel(levelNumber) ? 160 : GAME_WIDTH - 160;
    }

    function seededUnit(levelNumber: number, index: number): number {
        const seed = Math.sin((levelNumber + 1) * 9283 + (index + 1) * 1237) * 43758.5453;
        return seed - Math.floor(seed);
    }

    function randomLedgeScale(levelNumber: number, index: number, isAnchor = false): number {
        const r = seededUnit(levelNumber, index);
        const min = isAnchor ? 0.56 : 0.34;
        const max = isAnchor ? 0.78 : 0.62;
        return min + (max - min) * r;
    }

    function buildLayoutForLevel(levelNumber: number): PlatformConfig[] {
        const platformCount = 5 + Math.min(5, Math.floor(levelNumber / 12));
        const maxStepX = 410;
        const minStepX = 230;
        const minY = LEVEL_MIN_Y;
        const maxY = LEVEL_MAX_Y;
        const moveRight = movesRightForLevel(levelNumber);
        const layout: PlatformConfig[] = [];

        let prevX = moveRight ? 180 : GAME_WIDTH - 180;
        let prevY = 850;

        for (let i = 0; i < platformCount; i += 1) {
            if (i === 0) {
                layout.push({ x: prevX, y: prevY, scaleX: randomLedgeScale(levelNumber, i, true) });
                continue;
            }

            const progress = i / (platformCount - 1);
            const baseTargetX = 120 + progress * (GAME_WIDTH - 240);
            const targetX = (moveRight ? baseTargetX : GAME_WIDTH - baseTargetX) + Phaser.Math.Between(-70, 70);
            const rawDeltaX = targetX - prevX;
            const direction = moveRight ? 1 : -1;
            const deltaX = clamp(Math.abs(rawDeltaX), minStepX, maxStepX) * direction;
            let nextX = clamp(prevX + deltaX, 110, GAME_WIDTH - 110);
            if (moveRight) {
                nextX = Math.max(nextX, prevX + minStepX * 0.66);
            } else {
                nextX = Math.min(nextX, prevX - minStepX * 0.66);
            }
            nextX = clamp(nextX, 110, GAME_WIDTH - 110);

            // Neutral vertical walk: symmetric random step plus mild pull to center to prevent drift.
            const centerY = 740;
            const driftCorrection = (centerY - prevY) * 0.34;
            const deltaY = Phaser.Math.Between(-90, 90) + driftCorrection;
            let nextY = prevY + deltaY;
            nextY = clamp(nextY, minY, maxY);

            layout.push({
                x: nextX,
                y: nextY,
                scaleX: randomLedgeScale(levelNumber, i),
            });

            prevX = nextX;
            prevY = nextY;
        }

        return layout;
    }

    function buildLayoutFromAnchor(levelNumber: number, anchorX: number, anchorY: number): PlatformConfig[] {
        const base = buildLayoutForLevel(levelNumber);
        const first = base[0];
        const deltaX = anchorX - first.x;
        const normalizedAnchorY = clamp(anchorY, ANCHOR_MIN_Y, ANCHOR_MAX_Y);
        const deltaY = normalizedAnchorY - first.y;
        return base.map((piece) => ({
            x: clamp(piece.x + deltaX, 110, GAME_WIDTH - 110),
            y: clamp(piece.y + deltaY, LEVEL_MIN_Y, LEVEL_MAX_Y),
            scaleX: piece.scaleX,
        }));
    }

    function buildLevels(totalLevels: number): LevelConfig[] {
        const levels: LevelConfig[] = [];
        for (let levelNumber = 1; levelNumber <= totalLevels; levelNumber += 1) {
            const theme = BASE_LEVEL_THEMES[(levelNumber - 1) % BASE_LEVEL_THEMES.length];
            levels.push({
                title: `${theme.title} ${levelNumber}`,
                tint: theme.tint,
                platformLayout: buildLayoutForLevel(levelNumber),
                starCount: 10 + Math.min(16, Math.floor((levelNumber - 1) / 2)),
                targetBombs: 1 + Math.min(24, levelNumber - 1),
                bombSpeed: 140 + Math.min(260, (levelNumber - 1) * 4),
            });
        }
        return levels;
    }

    const GAME_WIDTH = 1400;
    const GAME_HEIGHT = 1000;
    const TOTAL_LEVELS = 100;
    const LEVELS: LevelConfig[] = buildLevels(TOTAL_LEVELS);
    const BASE_CAMERA_ZOOM = 1.06;
    const BACKGROUND_SCALE = 5;
    const BACKGROUND_SECTION_GRID = 5;
    const GAME_CONTAINER_ID = "game-root";
    const PLAYER_NAME_KEY = "nftgame.playerName";
    const PLAYER_NFT_KEY = "nftgame.playerNft";
    const PLAYER_IMAGE_KEY = "nftgame.playerImage";
    const PLAYER_MOVE_SPEED = 190;
    const JUMP_INITIAL_VELOCITY = -320;
    const JUMP_HOLD_ACCEL = -760;
    const JUMP_HOLD_MAX_MS = 210;
    const JUMP_RELEASE_CUTOFF = -120;
    const WORLD_GRAVITY_Y = 320;
    const API_BASE_URL = "https://nftgame-server.vercel.app";
    const PLAYER_BOMB_SAFE_DISTANCE = 260;
    const PENDING_SCORES_KEY = "nftgame.pendingScores";
    const SCORE_POST_TIMEOUT_MS = 12000;
    const SCORE_RETRY_DELAYS_MS = [700, 1800, 3500];
    const CAMERA_NEAR_MISS_DISTANCE = 135;
    const CAMERA_NEAR_MISS_COOLDOWN_MS = 550;
    const LEVEL_MIN_Y = 460;
    const LEVEL_MAX_Y = 860;
    const ANCHOR_MIN_Y = 650;
    const ANCHOR_MAX_Y = 860;
    const BOMB_VISIBLE_TOP_Y = 80;

    let game: Phaser.Game | null = null;
    let sceneRef: Phaser.Scene | null = null;
    let background: Phaser.GameObjects.Image | null = null;
    let glowOverlay: Phaser.GameObjects.Rectangle | null = null;
    let ambienceParticles: Phaser.GameObjects.Particles.ParticleEmitterManager | null = null;
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
    let debugTimerId: number | undefined;
    let onWindowError: ((event: ErrorEvent) => void) | undefined;
    let onUnhandledRejection: ((event: PromiseRejectionEvent) => void) | undefined;
    let runtimeSpriteObjectUrl: string | null = null;
    let jumpHoldTimeMs = 0;
    let jumpPressedLastFrame = false;
    let onWindowOnline: (() => void) | undefined;
    let pendingSyncCount = 0;
    let scorePulse = false;
    let comboPulse = false;
    let levelPulse = false;
    let scorePulseTimer: number | undefined;
    let comboPulseTimer: number | undefined;
    let levelPulseTimer: number | undefined;
    let lastNearMissShakeAt = 0;
    let isLevelTransitioning = false;
    let touchLeftActive = false;
    let touchRightActive = false;
    let touchJumpActive = false;

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

    function estimateMaxJumpRisePx(): number {
        const dt = 1 / 120;
        let vy = JUMP_INITIAL_VELOCITY;
        let y = 0;
        let maxRise = 0;
        let holdTime = 0;

        for (let i = 0; i < 600; i += 1) {
            if (vy < 0 && holdTime < JUMP_HOLD_MAX_MS) {
                vy += JUMP_HOLD_ACCEL * dt;
                holdTime += dt * 1000;
            }

            vy += WORLD_GRAVITY_Y * dt;
            y += vy * dt;
            maxRise = Math.max(maxRise, -y);
            if (vy > 0 && y >= 0) {
                break;
            }
        }

        return maxRise;
    }

    function verifyAllLevelFirstLedgeReachability(scene: Phaser.Scene) {
        const groundTexture = scene.textures.get("ground").getSourceImage() as { height?: number };
        const groundHeight = groundTexture?.height ?? 64;
        const groundTop = 1050 - groundHeight / 2;
        const maxJumpRise = estimateMaxJumpRisePx();
        const safetyMargin = 12;

        LEVELS.forEach((cfg, idx) => {
            const lowestLedgeY = Math.max(...cfg.platformLayout.map((piece) => piece.y));
            const lowestLedgeTop = lowestLedgeY - groundHeight / 2;
            const riseRequired = groundTop - lowestLedgeTop;
            const reachable = riseRequired <= maxJumpRise - safetyMargin;
            const payload = {
                level: idx + 1,
                title: cfg.title,
                riseRequired: Math.round(riseRequired),
                maxJumpRise: Math.round(maxJumpRise),
                reachable,
            };
            if (!reachable) {
                console.error("[GameDebug] first ledge unreachable with current jump model", payload);
            } else {
                console.log("[GameDebug] first ledge reachable", payload);
            }
        });
    }

    function dataUrlToObjectUrl(dataUrl: string): string | null {
        const matches = dataUrl.match(/^data:(.*?);base64,(.*)$/);
        if (!matches) {
            return null;
        }
        const mimeType = matches[1] || "image/png";
        const base64 = matches[2];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i += 1) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        return URL.createObjectURL(blob);
    }

    function runSanityChecks() {
        console.group("[GameDebug] Sanity checks");
        console.assert(Array.isArray(LEVELS) && LEVELS.length > 0, "LEVELS config missing");
        console.assert(Boolean(document.getElementById(GAME_CONTAINER_ID)), "Game container is missing");
        console.assert(GAME_WIDTH > 0 && GAME_HEIGHT > 0, "Invalid game dimensions");
        console.log("Store snapshot", {
            playerName: $playerName,
            hasPlayerImage: Boolean($playerImage),
            hasSelectedNft: Boolean($player1nft),
            highScoresLoaded: Array.isArray($highscores),
            highScoreValue,
        });
        console.groupEnd();
    }

    function hydratePersistedPlayerState() {
        if (typeof window === "undefined") {
            return;
        }

        const persistedName = sessionStorage.getItem(PLAYER_NAME_KEY);
        if (persistedName && !$playerName) {
            playerName.set(persistedName);
        }

        const persistedImage = sessionStorage.getItem(PLAYER_IMAGE_KEY);
        if (persistedImage && !$playerImage) {
            playerImage.set(persistedImage);
        }

        const persistedNft = sessionStorage.getItem(PLAYER_NFT_KEY);
        if (persistedNft && !$player1nft) {
            try {
                player1nft.set(JSON.parse(persistedNft));
            } catch (error) {
                console.error("[GameDebug] failed to parse persisted NFT", error);
            }
        }
    }

    function getPersistedNft():
        | { tokenAddress?: string; imageURL?: string }
        | null {
        if (typeof window === "undefined") {
            return null;
        }
        const persistedNft = sessionStorage.getItem(PLAYER_NFT_KEY);
        if (!persistedNft) {
            return null;
        }
        try {
            return JSON.parse(persistedNft) as { tokenAddress?: string; imageURL?: string };
        } catch (error) {
            console.error("[GameDebug] failed to parse persisted NFT for score save", error);
            return null;
        }
    }

    function readPendingScores():
        Array<{ token: string; imageURL: string; score: number; playerName: string }> {
        if (typeof window === "undefined") {
            return [];
        }
        const raw = localStorage.getItem(PENDING_SCORES_KEY);
        if (!raw) {
            return [];
        }
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function refreshPendingSyncCount() {
        pendingSyncCount = readPendingScores().length;
    }

    function writePendingScores(
        scores: Array<{ token: string; imageURL: string; score: number; playerName: string }>,
    ) {
        if (typeof window === "undefined") {
            return;
        }
        localStorage.setItem(PENDING_SCORES_KEY, JSON.stringify(scores));
        pendingSyncCount = scores.length;
    }

    function queuePendingScore(payload: { token: string; imageURL: string; score: number; playerName: string }) {
        const existing = readPendingScores();
        existing.push(payload);
        // Keep queue bounded.
        if (existing.length > 40) {
            existing.splice(0, existing.length - 40);
        }
        writePendingScores(existing);
        console.warn("[GameDebug] queued pending score for retry", payload);
    }

    async function postScorePayload(payload: { token: string; imageURL: string; score: number; playerName: string }) {
        await axios.post(`${API_BASE_URL}/scores`, payload, { timeout: SCORE_POST_TIMEOUT_MS });
    }

    async function postScoreWithRetry(payload: { token: string; imageURL: string; score: number; playerName: string }) {
        let lastError: unknown = null;
        for (let attempt = 0; attempt <= SCORE_RETRY_DELAYS_MS.length; attempt += 1) {
            try {
                await postScorePayload(payload);
                return;
            } catch (error) {
                lastError = error;
                if (attempt < SCORE_RETRY_DELAYS_MS.length) {
                    const waitMs = SCORE_RETRY_DELAYS_MS[attempt];
                    await new Promise((resolve) => setTimeout(resolve, waitMs));
                }
            }
        }
        throw lastError;
    }

    async function flushPendingScores() {
        const pending = readPendingScores();
        if (pending.length === 0) {
            return;
        }
        console.log("[GameDebug] attempting to flush pending scores", { count: pending.length });
        const remaining: typeof pending = [];
        for (const payload of pending) {
            try {
                await postScoreWithRetry(payload);
            } catch {
                remaining.push(payload);
            }
        }
        writePendingScores(remaining);
        console.log("[GameDebug] pending score flush complete", { remaining: remaining.length });
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
        jumpHoldTimeMs = 0;
        jumpPressedLastFrame = false;
        lastNearMissShakeAt = 0;
        isLevelTransitioning = false;
    }

    function buildPlatforms(scene: Phaser.Scene, layout: PlatformConfig[]) {
        console.log("[GameDebug] buildPlatforms", { count: layout.length, level });
        if (!platforms) {
            platforms = scene.physics.add.staticGroup();
        } else {
            platforms.clear(true, true);
        }
        platforms.create(GAME_WIDTH / 2, GAME_HEIGHT - 10, "ground").setScale(4, 1).refreshBody();

        layout.forEach((piece) => {
            const platform = platforms.create(piece.x, piece.y, "ground");
            if (piece.scaleX) {
                platform.setScale(piece.scaleX, 1).refreshBody();
            }
        });
    }

    function platformTargetsForLayout(layout: PlatformConfig[]): PlatformConfig[] {
        return [{ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 10, scaleX: 4 }, ...layout];
    }

    function animatePlatformsToLayout(scene: Phaser.Scene, layout: PlatformConfig[], durationMs: number) {
        if (!platforms) {
            buildPlatforms(scene, layout);
            return;
        }
        const targets = platformTargetsForLayout(layout);
        const current = platforms.getChildren() as Phaser.Physics.Arcade.Image[];

        while (current.length < targets.length) {
            const target = targets[current.length];
            const created = platforms.create(target.x, target.y, "ground") as Phaser.Physics.Arcade.Image;
            created.setScale(target.scaleX ?? 1, 1).refreshBody();
            current.push(created);
        }
        while (current.length > targets.length) {
            const stale = current.pop();
            stale?.destroy();
        }

        current.forEach((platform, index) => {
            const target = targets[index];
            scene.tweens.add({
                targets: platform,
                x: target.x,
                y: target.y,
                scaleX: target.scaleX ?? 1,
                scaleY: 1,
                duration: durationMs,
                ease: "Sine.easeInOut",
                onUpdate: () => {
                    platform.refreshBody();
                },
                onComplete: () => {
                    platform.refreshBody();
                },
            });
        });
    }

    function sequentialRevealDurationMs(layoutLength: number): number {
        const intervalMs = 240;
        return Math.max(460, (layoutLength - 1) * intervalMs + 420);
    }

    function buildPlatformsSequential(
        scene: Phaser.Scene,
        layout: PlatformConfig[],
        preservePlayerOnAnchor: boolean,
    ): number {
        if (!platforms) {
            platforms = scene.physics.add.staticGroup();
        } else {
            platforms.clear(true, true);
        }

        const anchor = layout[0];
        const ground = platforms.create(GAME_WIDTH / 2, GAME_HEIGHT - 10, "ground");
        ground.setScale(4, 1).refreshBody();
        const anchorPlatform = platforms.create(anchor.x, anchor.y, "ground");
        anchorPlatform.setScale(anchor.scaleX ?? 0.72, 1).refreshBody();

        if (preservePlayerOnAnchor && player) {
            player.x = anchor.x;
            player.y = anchor.y - Math.max(120, Math.floor(player.displayHeight * 0.85));
            player.setVelocity(0, 0);
        }

        const remaining = layout
            .slice(1)
            .sort((a, b) => {
                const da = Math.abs(a.x - anchor.x) + Math.abs(a.y - anchor.y);
                const db = Math.abs(b.x - anchor.x) + Math.abs(b.y - anchor.y);
                return da - db;
            });

        const intervalMs = 240;
        remaining.forEach((piece, idx) => {
            scene.time.delayedCall((idx + 1) * intervalMs, () => {
                const platform = platforms.create(piece.x, piece.y + 18, "ground");
                platform.setScale(piece.scaleX ?? 1, 1).setAlpha(0).refreshBody();
                scene.tweens.add({
                    targets: platform,
                    y: piece.y,
                    alpha: 1,
                    duration: 360,
                    ease: "Sine.easeOut",
                    onUpdate: () => platform.refreshBody(),
                    onComplete: () => platform.refreshBody(),
                });
            });
        });

        return sequentialRevealDurationMs(layout.length);
    }

    function placePlayerAtLevelStart() {
        if (!player) {
            return;
        }
        const layout = activeLevelConfig().platformLayout;
        const startLedge = layout[0];
        const spawnX = startLedge.x;
        const spawnY = startLedge.y - Math.max(120, Math.floor(player.displayHeight * 0.85));
        const body = player.body as Phaser.Physics.Arcade.Body;
        body.reset(spawnX, spawnY);
        player.clearTint();
        player.setVelocity(0, 0);
        console.log("[GameDebug] repositioned player for new level", {
            level,
            spawnX,
            spawnY,
            startLedgeY: startLedge.y,
        });
    }

    function getCurrentAnchorLedge(): { x: number; y: number } {
        if (!player || !platforms) {
            return { x: 180, y: 850 };
        }
        const candidates = platforms.getChildren() as Phaser.Physics.Arcade.Image[];
        const playerFootY = player.y + player.displayHeight * 0.45;
        let best = candidates[0];
        let bestScore = Number.POSITIVE_INFINITY;
        candidates.forEach((platform) => {
            const dx = Math.abs(platform.x - player.x);
            const dy = Math.abs(platform.y - playerFootY);
            const score = dx + dy * 1.2;
            if (score < bestScore) {
                best = platform;
                bestScore = score;
            }
        });
        return { x: best?.x ?? player.x, y: best?.y ?? player.y + 90 };
    }

    function getCurrentAnchorPlatform(): Phaser.Physics.Arcade.Image | null {
        if (!player || !platforms) {
            return null;
        }
        const candidates = platforms.getChildren() as Phaser.Physics.Arcade.Image[];
        const playerFootY = player.y + player.displayHeight * 0.45;
        const onTopCandidates = candidates.filter((platform) => {
            const dx = Math.abs(platform.x - player.x);
            const dy = Math.abs(platform.y - playerFootY);
            const halfWidth = (platform.displayWidth || 120) / 2;
            return dx <= halfWidth + 24 && dy <= 84;
        });
        const pool = onTopCandidates.length > 0 ? onTopCandidates : candidates;

        let best: Phaser.Physics.Arcade.Image | null = null;
        let bestScore = Number.POSITIVE_INFINITY;
        pool.forEach((platform) => {
            const dx = Math.abs(platform.x - player.x);
            const dy = Math.abs(platform.y - playerFootY);
            const score = dy * 1.6 + dx;
            if (score < bestScore) {
                best = platform;
                bestScore = score;
            }
        });
        return best;
    }

    function centerZoomedCamera(scene: Phaser.Scene) {
        const camera = scene.cameras.main;
        const visibleWidth = GAME_WIDTH / camera.zoom;
        const visibleHeight = GAME_HEIGHT / camera.zoom;
        camera.setScroll((GAME_WIDTH - visibleWidth) / 2, (GAME_HEIGHT - visibleHeight) / 2);
    }

    function backgroundTargetPositionForLevel(levelNumber: number) {
        const sectionIndex = (levelNumber - 1) % (BACKGROUND_SECTION_GRID * BACKGROUND_SECTION_GRID);
        const rowFromBottom = Math.floor(sectionIndex / BACKGROUND_SECTION_GRID);
        const indexInRow = sectionIndex % BACKGROUND_SECTION_GRID;
        const col = rowFromBottom % 2 === 0 ? indexInRow : BACKGROUND_SECTION_GRID - 1 - indexInRow;
        const u = (col + 0.5) / BACKGROUND_SECTION_GRID;
        const v = 1 - (rowFromBottom + 0.5) / BACKGROUND_SECTION_GRID;
        const displayWidth = GAME_WIDTH * BACKGROUND_SCALE;
        const displayHeight = GAME_HEIGHT * BACKGROUND_SCALE;
        return {
            x: GAME_WIDTH / 2 + displayWidth * (0.5 - u),
            y: GAME_HEIGHT / 2 + displayHeight * (0.5 - v),
            sectionIndex: sectionIndex + 1,
        };
    }

    function applyBackgroundSection(scene: Phaser.Scene, levelNumber: number, animate: boolean) {
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

    function normalizePlayerSprite(scene: Phaser.Scene) {
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

    function spawnBomb(scene: Phaser.Scene, speedBase: number) {
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
        applyBombStyle(bomb as Phaser.Physics.Arcade.Image);
        bomb.setVelocity(
            Phaser.Math.Between(-speedBase, speedBase),
            Phaser.Math.Between(80, 160),
        );
    }

    function bombStyleForLevel(currentLevel: number): BombStyle {
        const tier = Math.min(4, Math.floor((currentLevel - 1) / 20));
        const styles: BombStyle[] = [
            { tint: 0xffffff, scale: 1 },
            { tint: 0xffe29b, scale: 1.04 },
            { tint: 0xffb59b, scale: 1.08 },
            { tint: 0xff9bcf, scale: 1.12 },
            { tint: 0xff8f8f, scale: 1.16 },
        ];
        return styles[tier];
    }

    function applyBombStyle(bomb: Phaser.Physics.Arcade.Image) {
        const style = bombStyleForLevel(level);
        bomb.setTint(style.tint);
        bomb.setScale(style.scale);
        bomb.setAlpha(0.96);
    }

    function enforceBombSafeZone(scene: Phaser.Scene, speedBase: number) {
        if (!player) {
            return;
        }
        bombs.children.each((child) => {
            const bomb = child as Phaser.Physics.Arcade.Image;
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
            bomb.setVelocity(
                Phaser.Math.Between(-speedBase, speedBase),
                Phaser.Math.Between(80, 160),
            );
        });
    }

    function syncBombCount(scene: Phaser.Scene) {
        const target = activeLevelConfig().targetBombs;
        const currentCount = bombs.countActive(true);
        const missing = Math.max(0, target - currentCount);
        console.log("[GameDebug] syncBombCount", { target, currentCount, missing, level });
        for (let i = 0; i < missing; i += 1) {
            spawnBomb(scene, activeLevelConfig().bombSpeed);
        }
        bombs.children.each((child) => {
            const bomb = child as Phaser.Physics.Arcade.Image;
            if (bomb?.active) {
                applyBombStyle(bomb);
            }
        });
    }

    function keepBombsVisible() {
        bombs?.children.each((child) => {
            const bomb = child as Phaser.Physics.Arcade.Image;
            if (!bomb?.active) {
                return;
            }
            if (bomb.y < BOMB_VISIBLE_TOP_Y) {
                bomb.y = BOMB_VISIBLE_TOP_Y;
                const body = bomb.body as Phaser.Physics.Arcade.Body;
                body.velocity.y = Math.max(120, Math.abs(body.velocity.y));
            }
        });
    }

    function resetStars() {
        console.log("[GameDebug] resetStars", { level, total: activeLevelConfig().starCount });
        if (!stars) {
            stars = sceneRef!.physics.add.group();
            sceneRef!.physics.add.collider(stars, platforms);
            sceneRef!.physics.add.overlap(player, stars, collectStar, undefined, sceneRef!);
        } else {
            stars.clear(true, true);
        }

        const totalStars = activeLevelConfig().starCount;
        const layout = activeLevelConfig().platformLayout;
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
    }

    function levelBanner(scene: Phaser.Scene, text: string) {
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

    function triggerHudPulse(kind: "score" | "combo" | "level") {
        const durationMs = 220;
        if (kind === "score") {
            scorePulse = false;
            if (scorePulseTimer) {
                clearTimeout(scorePulseTimer);
            }
            scorePulse = true;
            scorePulseTimer = window.setTimeout(() => {
                scorePulse = false;
            }, durationMs);
            return;
        }
        if (kind === "combo") {
            comboPulse = false;
            if (comboPulseTimer) {
                clearTimeout(comboPulseTimer);
            }
            comboPulse = true;
            comboPulseTimer = window.setTimeout(() => {
                comboPulse = false;
            }, durationMs);
            return;
        }
        levelPulse = false;
        if (levelPulseTimer) {
            clearTimeout(levelPulseTimer);
        }
        levelPulse = true;
        levelPulseTimer = window.setTimeout(() => {
            levelPulse = false;
        }, durationMs + 80);
    }

    function applyLevelTheme(scene: Phaser.Scene, showBanner = false, options: LevelThemeOptions = {}) {
        const config = activeLevelConfig();
        console.log("[GameDebug] applyLevelTheme", { level, title: config.title, showBanner });
        if (options.anchor) {
            config.platformLayout = buildLayoutFromAnchor(level, options.anchor.x, options.anchor.y);
        }
        levelThemeName = config.title;
        if (background) {
            background.clearTint();
        }
        if (glowOverlay) {
            glowOverlay.setFillStyle(config.tint, 0.05);
        }
        if (!options.skipBackgroundPan) {
            applyBackgroundSection(scene, level, showBanner && level > 1);
        }
        scene.cameras.main.setZoom(BASE_CAMERA_ZOOM);
        centerZoomedCamera(scene);

        const finalizeSpawns = () => {
            resetStars();
            syncBombCount(scene);
            enforceBombSafeZone(scene, config.bombSpeed);
        };

        if (options.sequentialReveal) {
            const revealMs = buildPlatformsSequential(scene, config.platformLayout, Boolean(options.preservePlayer));
            scene.time.delayedCall(revealMs, finalizeSpawns);
        } else if (options.platformTransitionMs && options.platformTransitionMs > 0) {
            animatePlatformsToLayout(scene, config.platformLayout, options.platformTransitionMs);
            resetStars();
            if (!options.preservePlayer) {
                placePlayerAtLevelStart();
            } else if (options.playerTransitionMs && options.playerTransitionMs > 0 && player) {
                const startLedge = config.platformLayout[0];
                const targetY = startLedge.y - Math.max(120, Math.floor(player.displayHeight * 0.85));
                scene.tweens.add({
                    targets: player,
                    x: startLedge.x,
                    y: targetY,
                    duration: options.playerTransitionMs,
                    ease: "Sine.easeInOut",
                });
            }
            syncBombCount(scene);
            enforceBombSafeZone(scene, config.bombSpeed);
        } else {
            buildPlatforms(scene, config.platformLayout);
            resetStars();
            if (!options.preservePlayer) {
                placePlayerAtLevelStart();
            }
            syncBombCount(scene);
            enforceBombSafeZone(scene, config.bombSpeed);
        }
        uiLevel = level;
        comboMultiplier = 1;
        uiCombo = 1;
        triggerHudPulse("level");
        playTone(480 + level * 30, 120, 0.025, "triangle");
        playTone(610 + level * 30, 150, 0.02, "triangle");
        scene.cameras.main.flash(220, 255, 255, 255, false);

        if (showBanner) {
            levelBanner(scene, `Level ${level}: ${config.title}`);
        }
    }

    async function saveScore() {
        const selectedNft = $player1nft ?? getPersistedNft();
        submittingScore = true;
        scoreSaveError = "";
        const payload = {
            token: selectedNft?.tokenAddress ?? "",
            imageURL: selectedNft?.imageURL ?? "",
            score,
            playerName: $playerName ?? "anonymous",
        };
        try {
            await postScoreWithRetry(payload);
            console.log("[GameDebug] score payload uses original NFT", {
                token: payload.token,
                imageURL: payload.imageURL,
            });
        } catch (error) {
            queuePendingScore(payload);
            scoreSaveError = "Score saved locally and will auto-sync when connection returns.";
            console.error("failed to save score", error);
        } finally {
            submittingScore = false;
        }
    }

    async function hitBomb(this: Phaser.Scene, colliderPlayer: Phaser.GameObjects.GameObject) {
        console.log("[GameDebug] hitBomb", { isDead, scorePosted, score });
        if (isDead || scorePosted) {
            return;
        }
        isDead = true;
        scorePosted = true;
        isLevelTransitioning = false;
        this.physics.pause();
        this.physics.world.timeScale = 0.38;

        const body = colliderPlayer as Phaser.Physics.Arcade.Sprite;
        body.setTint(0xff0000);
        playTone(140, 300, 0.045, "sawtooth");
        this.cameras.main.shake(300, 0.013);
        this.cameras.main.flash(180, 255, 80, 80, false);
        this.tweens.add({
            targets: this.cameras.main,
            zoom: BASE_CAMERA_ZOOM + 0.08,
            duration: 220,
            ease: "Quad.easeOut",
        });
        await new Promise<void>((resolve) => {
            this.time.delayedCall(260, () => resolve());
        });
        this.physics.world.timeScale = 1;

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
        triggerHudPulse("score");
        triggerHudPulse("combo");
        console.log("[GameDebug] collectStar", { score, comboMultiplier, points, level });
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

        const particles = this.add.particles("star");
        particles.createEmitter({
            x: star.x,
            y: star.y,
            speed: { min: 45, max: 140 },
            scale: { start: 0.15, end: 0 },
            lifespan: 400,
            quantity: 8,
            gravityY: 230,
        });
        this.time.delayedCall(450, () => particles.destroy());

        if (stars.countActive(true) === 0) {
            if (level < LEVELS.length) {
                if (isLevelTransitioning) {
                    return;
                }
                isLevelTransitioning = true;
                player.setVelocity(0, 0);
                const anchor = getCurrentAnchorLedge();
                const anchorPlatform = getCurrentAnchorPlatform();
                const nextLevel = level + 1;
                const desiredAnchorX = anchorXForLevel(nextLevel);
                const transitionDuration = 2700;
                const platformObjects = (platforms.getChildren() as Phaser.Physics.Arcade.Image[]) ?? [];
                const platformStartX = platformObjects.map((platform) => platform.x);
                const playerStartX = player.x;
                const playerStartY = player.y;
                const anchorPlatformStartX = anchorPlatform?.x ?? playerStartX;
                const anchorPlatformStartY = anchorPlatform?.y ?? playerStartY + 90;
                const transitionShift = anchorPlatformStartX - desiredAnchorX;
                const playerOffsetX = playerStartX - anchorPlatformStartX;
                const playerOffsetY = playerStartY - anchorPlatformStartY;
                this.cameras.main.flash(180, 255, 250, 210, false);
                this.tweens.add({
                    targets: this.cameras.main,
                    zoom: BASE_CAMERA_ZOOM + 0.06,
                    duration: 140,
                    yoyo: true,
                    ease: "Sine.easeInOut",
                });
                playTone(780, 120, 0.03, "triangle");
                playTone(920, 120, 0.024, "triangle");
                this.physics.pause();
                applyBackgroundSection(this, nextLevel, true);
                this.tweens.addCounter({
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
                            player.x = anchorPlatform.x + playerOffsetX;
                            player.y = anchorPlatform.y + playerOffsetY;
                        } else {
                            player.x = playerStartX - transitionShift * t;
                            player.y = playerStartY;
                        }
                    },
                    onComplete: () => {
                        level = nextLevel;
                        const anchoredX = desiredAnchorX;
                        const revealMs = sequentialRevealDurationMs(activeLevelConfig().platformLayout.length);
                        applyLevelTheme(this, true, {
                            preservePlayer: true,
                            anchor: { x: anchoredX, y: anchor.y },
                            skipBackgroundPan: true,
                            sequentialReveal: true,
                        });
                        this.time.delayedCall(revealMs + 80, () => {
                            player.setVelocity(0, 0);
                            this.physics.resume();
                            isLevelTransitioning = false;
                        });
                    },
                });
            } else {
                resetStars();
                syncBombCount(this);
            }
        }
    }

    function preload(this: Phaser.Scene) {
        console.log("[GameDebug] preload start");
        this.load.on("start", () => console.log("[GameDebug] asset load start"));
        this.load.on("complete", () => console.log("[GameDebug] asset load complete"));
        this.load.on("loaderror", (file: unknown) => console.error("[GameDebug] asset load error", file));
        const persistedImage =
            $playerImage || (typeof window !== "undefined" ? sessionStorage.getItem(PLAYER_IMAGE_KEY) : null) || "./dude.png";
        if (runtimeSpriteObjectUrl) {
            URL.revokeObjectURL(runtimeSpriteObjectUrl);
            runtimeSpriteObjectUrl = null;
        }
        let selectedPlayerImage = persistedImage;
        if (persistedImage.startsWith("data:")) {
            const objectUrl = dataUrlToObjectUrl(persistedImage);
            if (objectUrl) {
                runtimeSpriteObjectUrl = objectUrl;
                selectedPlayerImage = objectUrl;
                console.log("[GameDebug] converted data URI sprite to object URL for Phaser loader");
            }
        }
        this.load.image("sky", "./newsky.png");
        this.load.image("ground", "./platform.png");
        this.load.image("star", "./star.png");
        this.load.image("bomb", "./bomb.png");
        this.load.image("dude", selectedPlayerImage, {
            frameWidth: 180,
            frameHeight: 270,
        });
    }

    function create(this: Phaser.Scene) {
        console.log("[GameDebug] create start");
        sceneRef = this;
        this.physics.world.timeScale = 1;
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.cameras.main.setZoom(BASE_CAMERA_ZOOM);
        centerZoomedCamera(this);
        background = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "sky");
        background.setDisplaySize(GAME_WIDTH * BACKGROUND_SCALE, GAME_HEIGHT * BACKGROUND_SCALE);
        applyBackgroundSection(this, 1, false);
        glowOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x9bd5ff, 0.05);
        glowOverlay.setBlendMode(Phaser.BlendModes.SCREEN);
        ambienceParticles = this.add.particles("star");
        ambienceParticles.createEmitter({
            x: { min: 0, max: GAME_WIDTH },
            y: { min: -30, max: GAME_HEIGHT + 10 },
            speedX: { min: -9, max: 9 },
            speedY: { min: 10, max: 22 },
            lifespan: 16000,
            quantity: 1,
            frequency: 230,
            alpha: { start: 0.22, end: 0.02 },
            scale: { start: 0.05, end: 0.01 },
            blendMode: Phaser.BlendModes.SCREEN,
        });

        player = this.physics.add.sprite(100, 450, "dude");
        normalizePlayerSprite(this);
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);

        bombs = this.physics.add.group();
        this.physics.add.collider(player, bombs, hitBomb, undefined, this);

        cursors = this.input.keyboard.createCursorKeys();
        applyLevelTheme(this, true);
        this.physics.add.collider(player, platforms);
        this.physics.add.collider(bombs, platforms);
        console.log("[GameDebug] create complete");
    }

    function update() {
        if (!player || !cursors || isDead) {
            return;
        }

        const now = sceneRef?.time.now ?? 0;
        let nearestBombDistance = Number.POSITIVE_INFINITY;
        bombs?.children.each((child) => {
            const bomb = child as Phaser.Physics.Arcade.Image;
            if (!bomb?.active) {
                return;
            }
            const distance = Phaser.Math.Distance.Between(player.x, player.y, bomb.x, bomb.y);
            if (distance < nearestBombDistance) {
                nearestBombDistance = distance;
            }
        });
        keepBombsVisible();
        if (
            nearestBombDistance < CAMERA_NEAR_MISS_DISTANCE &&
            now - lastNearMissShakeAt > CAMERA_NEAR_MISS_COOLDOWN_MS
        ) {
            sceneRef?.cameras.main.shake(110, 0.0017);
            playTone(220, 45, 0.012, "triangle");
            lastNearMissShakeAt = now;
        }

        if (isLevelTransitioning) {
            player.setVelocityX(0);
            jumpPressedLastFrame = false;
            return;
        }

        if (player.y > GAME_HEIGHT + 120) {
            console.warn("[GameDebug] player fell below world, resetting position", { level });
            placePlayerAtLevelStart();
            return;
        }

        const moveLeft = Boolean(cursors.left.isDown || touchLeftActive);
        const moveRight = Boolean(cursors.right.isDown || touchRightActive);

        if (moveLeft && !moveRight) {
            player.setVelocityX(-PLAYER_MOVE_SPEED);
        } else if (moveRight && !moveLeft) {
            player.setVelocityX(PLAYER_MOVE_SPEED);
        } else {
            player.setVelocityX(0);
        }

        const jumpPressed = Boolean(cursors.up.isDown || touchJumpActive);
        const body = player.body as Phaser.Physics.Arcade.Body;
        const dt = (sceneRef?.game.loop.delta ?? 16.67) / 1000;

        if (jumpPressed && !jumpPressedLastFrame && body.blocked.down) {
            player.setVelocityY(JUMP_INITIAL_VELOCITY);
            jumpHoldTimeMs = 0;
        }

        if (jumpPressed && body.velocity.y < 0 && jumpHoldTimeMs < JUMP_HOLD_MAX_MS) {
            player.setVelocityY(body.velocity.y + JUMP_HOLD_ACCEL * dt);
            jumpHoldTimeMs += dt * 1000;
        }

        if (!jumpPressed && body.velocity.y < JUMP_RELEASE_CUTOFF) {
            player.setVelocityY(JUMP_RELEASE_CUTOFF);
        }

        if (body.blocked.down && !jumpPressed) {
            jumpHoldTimeMs = 0;
        }

        jumpPressedLastFrame = jumpPressed;
    }

    function retryRun() {
        location.reload();
    }

    function setTouchControl(control: "left" | "right" | "jump", active: boolean) {
        if (control === "left") {
            touchLeftActive = active;
            return;
        }
        if (control === "right") {
            touchRightActive = active;
            return;
        }
        touchJumpActive = active;
    }

    async function backToMenu() {
        await push("/");
        location.reload();
    }

    onMount(() => {
        console.log("[GameDebug] onMount start");
        hydratePersistedPlayerState();
        resetSessionState();
        runSanityChecks();
        refreshPendingSyncCount();
        void flushPendingScores();

        onWindowOnline = () => {
            void flushPendingScores();
        };
        window.addEventListener("online", onWindowOnline);

        onWindowError = (event: ErrorEvent) => {
            console.error("[GameDebug] window error", event.error ?? event.message);
        };
        onUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error("[GameDebug] unhandled rejection", event.reason);
        };
        window.addEventListener("error", onWindowError);
        window.addEventListener("unhandledrejection", onUnhandledRejection);

        game = new Phaser.Game({
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            parent: GAME_CONTAINER_ID,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
            },
            physics: {
                default: "arcade",
                arcade: {
                    gravity: { y: WORLD_GRAVITY_Y },
                    debug: false,
                },
            },
            scene: {
                preload,
                create,
                update,
            },
        });
        console.log("[GameDebug] Phaser.Game created", game);
        const createdCanvas = document.querySelector(`#${GAME_CONTAINER_ID} canvas`) as HTMLCanvasElement | null;
        if (createdCanvas) {
            console.log("[GameDebug] canvas size", {
                cssWidth: createdCanvas.style.width,
                cssHeight: createdCanvas.style.height,
                width: createdCanvas.width,
                height: createdCanvas.height,
            });
        } else {
            console.warn("[GameDebug] canvas element not found immediately after game creation");
        }

        debugTimerId = window.setTimeout(() => {
            if (!sceneRef) {
                console.error("[GameDebug] Scene did not initialize within 3s.");
            } else {
                console.log("[GameDebug] Scene initialized successfully.");
            }
        }, 3000);
    });

    onDestroy(() => {
        console.log("[GameDebug] onDestroy");
        if (debugTimerId) {
            clearTimeout(debugTimerId);
        }
        if (scorePulseTimer) {
            clearTimeout(scorePulseTimer);
        }
        if (comboPulseTimer) {
            clearTimeout(comboPulseTimer);
        }
        if (levelPulseTimer) {
            clearTimeout(levelPulseTimer);
        }
        if (onWindowError) {
            window.removeEventListener("error", onWindowError);
        }
        if (onUnhandledRejection) {
            window.removeEventListener("unhandledrejection", onUnhandledRejection);
        }
        if (onWindowOnline) {
            window.removeEventListener("online", onWindowOnline);
        }
        if (game) {
            game.destroy(true);
            game = null;
        }
        if (runtimeSpriteObjectUrl) {
            URL.revokeObjectURL(runtimeSpriteObjectUrl);
            runtimeSpriteObjectUrl = null;
        }
        ambienceParticles = null;
    });
</script>

<div class="game-shell">
    <div id={GAME_CONTAINER_ID} class="game-canvas" />
    {#if pendingSyncCount > 0}
        <div class="sync-badge">Pending Sync: {pendingSyncCount}</div>
    {/if}
    <div class="hud">
        <div class="hud-card player-card">
            <span class="label">Pilot</span>
            <span class="value">{$playerName || "Anonymous Panda"}</span>
        </div>
        <div class="hud-card" class:level-pop={levelPulse}>
            <span class="label">Level</span>
            <span class="value">{uiLevel}/{LEVELS.length}</span>
            <span class="sub">{levelThemeName}</span>
        </div>
        <div class="hud-card" class:score-pop={scorePulse}>
            <span class="label">Score</span>
            <span class="value">{uiScore}</span>
            <span class="sub">High {highScoreValue}</span>
        </div>
        <div class="hud-card combo-card" class:combo-pop={comboPulse}>
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

    <div class="mobile-controls">
        <button
            class="control-btn"
            class:active={touchLeftActive}
            on:touchstart|preventDefault={() => setTouchControl("left", true)}
            on:touchend|preventDefault={() => setTouchControl("left", false)}
            on:touchcancel|preventDefault={() => setTouchControl("left", false)}
        >
            ◀
        </button>
        <button
            class="control-btn jump-btn"
            class:active={touchJumpActive}
            on:touchstart|preventDefault={() => setTouchControl("jump", true)}
            on:touchend|preventDefault={() => setTouchControl("jump", false)}
            on:touchcancel|preventDefault={() => setTouchControl("jump", false)}
        >
            ▲
        </button>
        <button
            class="control-btn"
            class:active={touchRightActive}
            on:touchstart|preventDefault={() => setTouchControl("right", true)}
            on:touchend|preventDefault={() => setTouchControl("right", false)}
            on:touchcancel|preventDefault={() => setTouchControl("right", false)}
        >
            ▶
        </button>
    </div>
</div>

<style>
    :global(html),
    :global(body),
    :global(#app) {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
    }

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
        width: 100%;
        height: 100%;
        border-radius: 0;
        overflow: hidden;
        box-shadow: none;
        touch-action: none;
    }

    .game-canvas {
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at 20% 20%, #3e5a85 0%, #18253f 46%, #0c1423 100%);
    }

    .game-canvas :global(canvas) {
        display: block;
        max-width: 100%;
        max-height: 100%;
        margin: 0 auto;
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

    .sync-badge {
        position: absolute;
        top: 12px;
        right: 16px;
        z-index: 25;
        border: 1px solid rgba(255, 180, 180, 0.7);
        background: rgba(83, 15, 15, 0.85);
        color: #ffe3e3;
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        backdrop-filter: blur(3px);
    }

    .hud-card {
        background: linear-gradient(155deg, rgba(9, 21, 46, 0.42), rgba(4, 12, 27, 0.34));
        border: 1px solid rgba(219, 234, 255, 0.16);
        border-radius: 12px;
        padding: 8px 12px 9px;
        display: grid;
        gap: 2px;
        backdrop-filter: blur(2px);
    }

    .player-card .value {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .combo-card {
        box-shadow: inset 0 0 0 1px rgba(255, 145, 212, 0.25);
    }

    .score-pop {
        animation: hudScorePop 220ms ease-out;
    }

    .combo-pop {
        animation: hudComboPop 220ms ease-out;
    }

    .level-pop {
        animation: hudLevelPop 280ms ease-out;
    }

    @keyframes hudScorePop {
        0% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(255, 233, 164, 0);
        }
        50% {
            transform: scale(1.05);
            box-shadow: 0 0 24px rgba(255, 219, 116, 0.44);
        }
        100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(255, 233, 164, 0);
        }
    }

    @keyframes hudComboPop {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.06);
            box-shadow: 0 0 24px rgba(255, 130, 196, 0.38);
        }
        100% {
            transform: scale(1);
            box-shadow: inset 0 0 0 1px rgba(255, 145, 212, 0.25);
        }
    }

    @keyframes hudLevelPop {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.04);
            box-shadow: 0 0 20px rgba(143, 210, 255, 0.35);
        }
        100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(143, 210, 255, 0);
        }
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

    .mobile-controls {
        position: absolute;
        left: 0;
        right: 0;
        bottom: max(16px, env(safe-area-inset-bottom));
        display: none;
        justify-content: center;
        gap: 14px;
        z-index: 35;
        pointer-events: none;
    }

    .control-btn {
        pointer-events: auto;
        width: 66px;
        height: 66px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: rgba(6, 14, 30, 0.76);
        color: #eef4ff;
        font-size: 28px;
        font-weight: 800;
        line-height: 1;
        backdrop-filter: blur(3px);
        user-select: none;
        -webkit-user-select: none;
    }

    .control-btn.jump-btn {
        margin: 0 10px;
    }

    .control-btn.active {
        background: rgba(255, 215, 138, 0.94);
        color: #1f1300;
        transform: scale(0.95);
    }

    @media (max-width: 900px) {
        .hud {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .value {
            font-size: 17px;
        }

        .mobile-controls {
            display: flex;
        }
    }

    @media (hover: none) and (pointer: coarse) {
        .mobile-controls {
            display: flex;
        }
    }
</style>
