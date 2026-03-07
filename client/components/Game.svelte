<script lang="ts">
    import * as Phaser from "phaser";
    import { onDestroy, onMount } from "svelte";
    import { assertGameRuntimeConfig, getApiBaseUrl } from "../src/config/runtime";
    import {
        BACKGROUND_SCALE,
        BASE_CAMERA_ZOOM,
        BOMB_VISIBLE_TOP_Y,
        CAMERA_NEAR_MISS_COOLDOWN_MS,
        CAMERA_NEAR_MISS_DISTANCE,
        GAME_CONTAINER_ID,
        GAME_HEIGHT,
        GAME_WIDTH,
        JUMP_HOLD_ACCEL,
        JUMP_HOLD_MAX_MS,
        JUMP_INITIAL_VELOCITY,
        JUMP_RELEASE_CUTOFF,
        PLAYER_IMAGE_KEY,
        PLAYER_MOVE_SPEED,
        PLAYER_NAME_KEY,
        PLAYER_NFT_KEY,
        SCORE_POST_TIMEOUT_MS,
        SCORE_RETRY_DELAYS_MS,
        TOTAL_LEVELS,
        WORLD_GRAVITY_Y,
    } from "../src/game/constants";
    import { ScoreSyncQueue, type ScorePayload } from "../src/game/scoreSync";
    import { trackError } from "../src/game/telemetry";
    import { disposeAudio, playTone } from "../src/game/audio";
    import {
        enforceBombSafeZone,
        keepBombsVisible,
        syncBombCount as syncBombCountForLevel,
    } from "../src/game/bombs";
    import { applyBackgroundSection } from "../src/game/background";
    import { runSanityChecks } from "../src/game/debug";
    import { clearHudPulseTimers, triggerHudPulse as triggerHudPulseRuntime } from "../src/game/hudPulse";
    import { applyLevelTheme as applyLevelThemeRuntime, type LevelThemeOptions } from "../src/game/levelTheme";
    import { levelBanner, normalizePlayerSprite, resetStars as resetStarsForLevel } from "../src/game/levelVisuals";
    import { updatePlayerMotion } from "../src/game/playerMotion";
    import { preloadCoreAssets, selectPlayerSpriteSource } from "../src/game/preloadAssets";
    import {
        flushPendingScoresRuntime,
        postScorePayload as postScorePayloadRuntime,
        saveScoreRuntime,
    } from "../src/game/scoreRuntime";
    import { setupGameScene } from "../src/game/sceneSetup";
    import { advanceAfterStarClear } from "../src/game/progressionRuntime";
    import {
        createRunSessionState,
        handleRunTicketRequestError,
        markLevelReached,
        markRunStarted,
        markStarCollected,
        requestRunTicket as requestRunTicketRuntime,
        resetRunSession,
    } from "../src/game/runSession";
    import { nextComboMultiplier, pointsForCombo, renderStarCollectFx } from "../src/game/starCollect";
    import {
        buildLevels,
        clamp,
        type LevelConfig,
    } from "../src/game/levels";
    import {
        animatePlatformsToLayout,
        buildPlatforms,
        buildPlatformsSequential,
        getCurrentAnchorLedge,
        getCurrentAnchorPlatform,
        placePlayerAtLevelStart,
    } from "../src/game/platformRuntime";
    import {
        centerZoomedCamera,
        verifyAllLevelFirstLedgeReachability,
    } from "../src/game/sceneMath";
    import { loadGameplayPreferences, persistGameplayPreferences } from "../src/game/preferences";
    import { dataUrlToObjectUrl, getPersistedNft, hydratePersistedPlayerState } from "../src/game/playerSession";
    import highscores from "../src/stores/highscores";
    import player1nft from "../src/stores/player1nft";
    import { playerImage } from "../src/stores/playerImage";
    import playerName from "../src/stores/playername";
    import { push } from "svelte-spa-router";
    import RunStartOverlay from "./RunStartOverlay.svelte";
    import PauseOverlay from "./PauseOverlay.svelte";
    import GameOptionsPanel from "./GameOptionsPanel.svelte";

    const LEVELS: LevelConfig[] = buildLevels(TOTAL_LEVELS, GAME_WIDTH);
    const LEVEL_EXTENSION_CHUNK = 40;
    const API_BASE_URL = getApiBaseUrl();

    let game: Phaser.Game | null = null;
    let sceneRef: Phaser.Scene | null = null;
    let background: Phaser.GameObjects.Image | null = null;
    let glowOverlay: Phaser.GameObjects.Rectangle | null = null;
    let platforms: Phaser.Physics.Arcade.StaticGroup;
    let stars: Phaser.Physics.Arcade.Group;
    let bombs: Phaser.Physics.Arcade.Group;
    let player: Phaser.Physics.Arcade.Sprite;
    let cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    let score = 0;
    let level = 1;
    let comboMultiplier = 1;
    let lastCollectAt = 0;
    let scorePosted = false;
    let isDead = false;

    let showGameOver = false;
    let canRestartAfterDeath = false;
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
    const scoreQueue = new ScoreSyncQueue();
    let pendingSyncCount = 0;
    let lastSyncAt: string | null = null;
    let scorePulse = false;
    let comboPulse = false;
    let levelPulse = false;
    const hudPulseTimers = {
        scorePulseTimer: undefined as number | undefined,
        comboPulseTimer: undefined as number | undefined,
        levelPulseTimer: undefined as number | undefined,
    };
    let lastNearMissShakeAt = 0;
    let isLevelTransitioning = false;
    let touchLeftActive = false;
    let touchRightActive = false;
    let touchJumpActive = false;
    let showStartOverlay = true;
    let hasRunStarted = false;
    let isPaused = false;
    let showOptions = false;
    let reducedMotion = false;
    let leftHandedMobileControls = false;
    let onWindowKeydown: ((event: KeyboardEvent) => void) | undefined;
    const runSession = createRunSessionState();

    $: highScoreValue = $highscores?.[0]?.score ?? 0;
    $: if (typeof window !== "undefined") {
        persistGameplayPreferences({ reducedMotion, leftHandedMobileControls });
    }

    function activeLevelConfig(): LevelConfig {
        ensureLevelExists(level);
        return LEVELS[Math.min(level - 1, LEVELS.length - 1)];
    }

    function ensureLevelExists(levelNumber: number) {
        if (levelNumber <= LEVELS.length) {
            return;
        }
        const target = Math.max(levelNumber, LEVELS.length + LEVEL_EXTENSION_CHUNK);
        const generated = buildLevels(target, GAME_WIDTH);
        LEVELS.push(...generated.slice(LEVELS.length));
    }

    async function requestRunTicket(): Promise<void> {
        try {
            await requestRunTicketRuntime(API_BASE_URL, runSession);
        } catch (error) {
            handleRunTicketRequestError(error, runSession);
            if (runSession.runTicketSupportAvailable === false) {
                return;
            }
            console.error("[GameDebug] failed to request run ticket", error);
        }
    }

    async function beginRun() {
        if (!sceneRef || hasRunStarted || isDead) {
            return;
        }
        if (!runSession.runTicketId) {
            await requestRunTicket();
        }
        hasRunStarted = true;
        markRunStarted(runSession, level);
        showStartOverlay = false;
        isPaused = false;
        sceneRef.physics.resume();
        playTone(640, 100, 0.02, "triangle");
    }

    function togglePause() {
        if (!sceneRef || !hasRunStarted || isDead || showGameOver || isLevelTransitioning) {
            return;
        }
        isPaused = !isPaused;
        if (isPaused) {
            sceneRef.physics.pause();
        } else {
            sceneRef.physics.resume();
        }
    }

    function refreshPendingSyncCount() {
        pendingSyncCount = scoreQueue.getPendingCount();
        lastSyncAt = scoreQueue.getLastSyncAt();
    }

    async function postScorePayload(payload: ScorePayload, timeoutMs: number) {
        await postScorePayloadRuntime(API_BASE_URL, payload, timeoutMs);
    }

    async function flushPendingScores() {
        await flushPendingScoresRuntime({
            scoreQueue,
            postScore: postScorePayload,
            timeoutMs: SCORE_POST_TIMEOUT_MS,
            retryDelaysMs: SCORE_RETRY_DELAYS_MS,
            refreshPendingSyncCount,
        });
    }

    async function manualSyncNow() {
        await flushPendingScores();
    }

    function resetSessionState() {
        score = 0;
        level = 1;
        comboMultiplier = 1;
        lastCollectAt = 0;
        scorePosted = false;
        isDead = false;
        showGameOver = false;
        canRestartAfterDeath = false;
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
        resetRunSession(runSession);
    }

    function syncBombCount() {
        const target = activeLevelConfig().targetBombs;
        const currentCount = bombs.countActive(true);
        const missing = Math.max(0, target - currentCount);
        console.log("[GameDebug] syncBombCount", { target, currentCount, missing, level });
        syncBombCountForLevel(bombs, player, level, target, activeLevelConfig().bombSpeed);
    }

    function resetStars(activePlatforms: Phaser.Physics.Arcade.StaticGroup = platforms) {
        console.log("[GameDebug] resetStars", { level, total: activeLevelConfig().starCount });
        stars = resetStarsForLevel({
            scene: sceneRef!,
            stars,
            platforms: activePlatforms,
            player,
            collectStar,
            layout: activeLevelConfig().platformLayout,
            totalStars: activeLevelConfig().starCount,
            clamp,
        });
    }

    function triggerHudPulse(kind: "score" | "combo" | "level") {
        triggerHudPulseRuntime({
            kind,
            reducedMotion,
            timers: hudPulseTimers,
            setScorePulse: (value) => {
                scorePulse = value;
            },
            setComboPulse: (value) => {
                comboPulse = value;
            },
            setLevelPulse: (value) => {
                levelPulse = value;
            },
        });
    }

    function applyLevelTheme(scene: Phaser.Scene, showBanner = false, options: LevelThemeOptions = {}) {
        ensureLevelExists(level);
        platforms = applyLevelThemeRuntime({
            scene,
            level,
            levels: LEVELS,
            gameWidth: GAME_WIDTH,
            showBanner,
            options,
            background,
            glowOverlay,
            baseCameraZoom: BASE_CAMERA_ZOOM,
            reducedMotion,
            platforms,
            player,
            setLevelThemeName: (value) => {
                levelThemeName = value;
            },
            setUiLevel: (value) => {
                uiLevel = value;
            },
            onLevelActivated: () => {
                comboMultiplier = 1;
                uiCombo = 1;
                triggerHudPulse("level");
            },
            centerZoomedCamera,
            applyBackgroundSection,
            buildPlatforms,
            animatePlatformsToLayout,
            buildPlatformsSequential,
            placePlayerAtLevelStart,
            resetStars,
            syncBombCount,
            enforceBombSafeZone: (bombSpeed) => enforceBombSafeZone(bombs, player, bombSpeed),
            playTone,
            levelBanner,
        });
    }

    async function saveScore() {
        const selectedNft = $player1nft ?? getPersistedNft(PLAYER_NFT_KEY);
        await saveScoreRuntime({
            scoreQueue,
            runSession,
            score,
            playerName: $playerName ?? "anonymous",
            selectedNft,
            timeoutMs: SCORE_POST_TIMEOUT_MS,
            retryDelaysMs: SCORE_RETRY_DELAYS_MS,
            requestRunTicket,
            postScore: postScorePayload,
            refreshPendingSyncCount,
            setSubmittingScore: (value) => {
                submittingScore = value;
            },
            setScoreSaveError: (value) => {
                scoreSaveError = value;
            },
        });
    }

    async function hitBomb(this: Phaser.Scene, colliderPlayer: Phaser.GameObjects.GameObject) {
        console.log("[GameDebug] hitBomb", { isDead, scorePosted, score });
        if (isDead || scorePosted) {
            return;
        }
        isDead = true;
        scorePosted = true;
        isLevelTransitioning = false;
        touchLeftActive = false;
        touchRightActive = false;
        touchJumpActive = false;
        canRestartAfterDeath = false;
        this.physics.pause();
        this.physics.world.timeScale = 0.38;

        const body = colliderPlayer as Phaser.Physics.Arcade.Sprite;
        body.setTint(0xff0000);
        playTone(140, 300, 0.045, "sawtooth");
        if (!reducedMotion) {
            this.cameras.main.shake(300, 0.013);
            this.cameras.main.flash(180, 255, 80, 80, false);
        }
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
        window.setTimeout(() => {
            canRestartAfterDeath = true;
        }, 450);
        await saveScore();
    }

    function collectStar(this: Phaser.Scene, _: Phaser.GameObjects.GameObject, rawStar: Phaser.GameObjects.GameObject) {
        const star = rawStar as Phaser.Physics.Arcade.Image;
        star.disableBody(true, true);

        const now = this.time.now;
        comboMultiplier = nextComboMultiplier(now, lastCollectAt, comboMultiplier);
        lastCollectAt = now;

        const points = pointsForCombo(comboMultiplier);
        score += points;
        markStarCollected(runSession, comboMultiplier);
        uiScore = score;
        uiCombo = comboMultiplier;
        triggerHudPulse("score");
        triggerHudPulse("combo");
        console.log("[GameDebug] collectStar", { score, comboMultiplier, points, level });
        playTone(460 + comboMultiplier * 45, 90, 0.025, "square");
        renderStarCollectFx(this, star, points);

        if (stars.countActive(true) === 0) {
            advanceAfterStarClear({
                scene: this,
                level,
                levels: LEVELS,
                ensureLevelExists,
                isLevelTransitioning,
                setIsLevelTransitioning: (value) => {
                    isLevelTransitioning = value;
                },
                setLevel: (value) => {
                    level = value;
                    markLevelReached(runSession, value);
                },
                player,
                platforms,
                gameWidth: GAME_WIDTH,
                baseCameraZoom: BASE_CAMERA_ZOOM,
                background,
                applyBackgroundSection,
                getCurrentAnchorLedge,
                getCurrentAnchorPlatform,
                playTone,
                applyLevelTheme,
            });
        }
    }

    function preload(this: Phaser.Scene) {
        console.log("[GameDebug] preload start");
        this.load.on("start", () => console.log("[GameDebug] asset load start"));
        this.load.on("complete", () => console.log("[GameDebug] asset load complete"));
        this.load.on("loaderror", (file: unknown) => console.error("[GameDebug] asset load error", file));
        const persistedImage =
            $playerImage || (typeof window !== "undefined" ? sessionStorage.getItem(PLAYER_IMAGE_KEY) : null) || "./dude.png";
        const selected = selectPlayerSpriteSource({
            persistedImage,
            currentObjectUrl: runtimeSpriteObjectUrl,
            dataUrlToObjectUrl,
        });
        runtimeSpriteObjectUrl = selected.runtimeSpriteObjectUrl;
        if (selected.runtimeSpriteObjectUrl) {
            console.log("[GameDebug] converted data URI sprite to object URL for Phaser loader");
        }
        preloadCoreAssets(this, selected.selectedPlayerImage);
    }

    function create(this: Phaser.Scene) {
        console.log("[GameDebug] create start");
        sceneRef = this;
        const setup = setupGameScene(this, {
            gameWidth: GAME_WIDTH,
            gameHeight: GAME_HEIGHT,
            backgroundScale: BACKGROUND_SCALE,
            baseCameraZoom: BASE_CAMERA_ZOOM,
            hasRunStarted,
            normalizePlayerSprite,
            applyBackgroundSection,
            hitBomb,
            centerZoomedCamera,
        });
        background = setup.background;
        glowOverlay = setup.glowOverlay;
        player = setup.player;
        bombs = setup.bombs;
        cursors = setup.cursors;
        applyLevelTheme(this, true);
        verifyAllLevelFirstLedgeReachability(this, LEVELS);
        this.physics.add.collider(player, platforms);
        this.physics.add.collider(bombs, platforms);
        if (!hasRunStarted) {
            this.physics.pause();
        }
        console.log("[GameDebug] create complete");
    }

    function update() {
        if (!player || !cursors || isDead || !hasRunStarted || isPaused) {
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
        const viewLeftX = sceneRef?.cameras.main.worldView.left ?? 0;
        const viewRightX = sceneRef?.cameras.main.worldView.right ?? GAME_WIDTH;
        keepBombsVisible(bombs, BOMB_VISIBLE_TOP_Y, viewLeftX, viewRightX);
        if (
            !reducedMotion &&
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
            placePlayerAtLevelStart(player, activeLevelConfig().platformLayout, level);
            return;
        }

        const motion = updatePlayerMotion({
            player,
            cursors,
            touchLeftActive,
            touchRightActive,
            touchJumpActive,
            moveSpeed: PLAYER_MOVE_SPEED,
            jumpInitialVelocity: JUMP_INITIAL_VELOCITY,
            jumpHoldAccel: JUMP_HOLD_ACCEL,
            jumpHoldMaxMs: JUMP_HOLD_MAX_MS,
            jumpReleaseCutoff: JUMP_RELEASE_CUTOFF,
            sceneDeltaMs: sceneRef?.game.loop.delta ?? 16.67,
            jumpHoldTimeMs,
            jumpPressedLastFrame,
        });
        jumpHoldTimeMs = motion.jumpHoldTimeMs;
        jumpPressedLastFrame = motion.jumpPressedLastFrame;

        const halfWidth = Math.max(14, player.displayWidth * 0.5);
        const minX = viewLeftX + halfWidth;
        const maxX = viewRightX - halfWidth;
        if (player.x < minX) {
            player.x = minX;
            player.setVelocityX(Math.max(0, player.body.velocity.x));
        } else if (player.x > maxX) {
            player.x = maxX;
            player.setVelocityX(Math.min(0, player.body.velocity.x));
        }
    }

    function retryRun() {
        if (!canRestartAfterDeath || submittingScore) {
            return;
        }
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
        if (!canRestartAfterDeath || submittingScore) {
            return;
        }
        await push("/");
        location.reload();
    }

    onMount(() => {
        console.log("[GameDebug] onMount start");
        assertGameRuntimeConfig();
        hydratePersistedPlayerState({
            playerNameKey: PLAYER_NAME_KEY,
            playerImageKey: PLAYER_IMAGE_KEY,
            playerNftKey: PLAYER_NFT_KEY,
            playerName: $playerName,
            playerImage: $playerImage,
            playerNft: $player1nft,
            setPlayerName: (value) => playerName.set(value),
            setPlayerImage: (value) => playerImage.set(value),
            setPlayerNft: (value) => player1nft.set(value as any),
        });
        const prefs = loadGameplayPreferences();
        reducedMotion = prefs.reducedMotion;
        leftHandedMobileControls = prefs.leftHandedMobileControls;
        resetSessionState();
        runSanityChecks(LEVELS, {
            playerName: $playerName,
            hasPlayerImage: Boolean($playerImage),
            hasSelectedNft: Boolean($player1nft),
            highScoresLoaded: Array.isArray($highscores),
            highScoreValue,
        });
        refreshPendingSyncCount();
        void flushPendingScores();
        void requestRunTicket();

        onWindowOnline = () => {
            void flushPendingScores();
        };
        window.addEventListener("online", onWindowOnline);

        onWindowError = (event: ErrorEvent) => {
            console.error("[GameDebug] window error", event.error ?? event.message);
            trackError("window_error", { message: event.message });
        };
        onUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error("[GameDebug] unhandled rejection", event.reason);
            trackError("unhandled_rejection", { reason: String(event.reason) });
        };
        onWindowKeydown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                togglePause();
            }
            if (event.key === "Enter" && showStartOverlay && !hasRunStarted) {
                void beginRun();
            }
        };
        window.addEventListener("error", onWindowError);
        window.addEventListener("unhandledrejection", onUnhandledRejection);
        window.addEventListener("keydown", onWindowKeydown);

        game = new Phaser.Game({
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            parent: GAME_CONTAINER_ID,
            scale: {
                mode: Phaser.Scale.ENVELOP,
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
        clearHudPulseTimers(hudPulseTimers);
        if (onWindowError) {
            window.removeEventListener("error", onWindowError);
        }
        if (onUnhandledRejection) {
            window.removeEventListener("unhandledrejection", onUnhandledRejection);
        }
        if (onWindowOnline) {
            window.removeEventListener("online", onWindowOnline);
        }
        if (onWindowKeydown) {
            window.removeEventListener("keydown", onWindowKeydown);
        }
        if (game) {
            game.destroy(true);
            game = null;
        }
        if (runtimeSpriteObjectUrl) {
            URL.revokeObjectURL(runtimeSpriteObjectUrl);
            runtimeSpriteObjectUrl = null;
        }
        void disposeAudio();
    });
</script>

<div class="game-shell">
    <div id={GAME_CONTAINER_ID} class="game-canvas" />
    <div class="sync-panel">
        {#if pendingSyncCount > 0}
            <div class="sync-badge">Pending Sync: {pendingSyncCount}</div>
            <button class="sync-btn" on:click={manualSyncNow}>Sync now</button>
        {/if}
        {#if lastSyncAt}
            <div class="sync-meta">Last sync: {new Date(lastSyncAt).toLocaleTimeString()}</div>
        {/if}
    </div>
    <div class="run-controls">
        {#if hasRunStarted && !showGameOver}
            <button class="control-action" on:click={togglePause}>{isPaused ? "Resume" : "Pause"}</button>
        {/if}
        <button class="control-action secondary" on:click={() => (showOptions = !showOptions)}>
            {showOptions ? "Hide Options" : "Options"}
        </button>
    </div>
    {#if showOptions}
        <GameOptionsPanel bind:reducedMotion bind:leftHandedMobileControls />
    {/if}
    <div class="hud">
        <div class="hud-card player-card">
            <span class="label">Pilot</span>
            <span class="value">{$playerName || "Anonymous Panda"}</span>
        </div>
        <div class="hud-card" class:level-pop={levelPulse}>
            <span class="label">Level</span>
            <span class="value">{uiLevel}/∞</span>
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
                    <button disabled={!canRestartAfterDeath || submittingScore} on:click={retryRun}>Retry</button>
                    <button class="secondary" disabled={!canRestartAfterDeath || submittingScore} on:click={backToMenu}>Menu</button>
                </div>
            </div>
        </div>
    {/if}

    {#if showStartOverlay}
        <RunStartOverlay onStart={beginRun} />
    {/if}

    {#if isPaused && !showGameOver}
        <PauseOverlay onResume={togglePause} />
    {/if}

    <div class="mobile-controls" class:left-handed={leftHandedMobileControls}>
        <button
            class="control-btn"
            aria-label="Move left"
            class:active={touchLeftActive}
            on:touchstart|preventDefault={() => setTouchControl("left", true)}
            on:touchend|preventDefault={() => setTouchControl("left", false)}
            on:touchcancel|preventDefault={() => setTouchControl("left", false)}
        >
            ◀
        </button>
        <button
            class="control-btn jump-btn"
            aria-label="Jump"
            class:active={touchJumpActive}
            on:touchstart|preventDefault={() => setTouchControl("jump", true)}
            on:touchend|preventDefault={() => setTouchControl("jump", false)}
            on:touchcancel|preventDefault={() => setTouchControl("jump", false)}
        >
            ▲
        </button>
        <button
            class="control-btn"
            aria-label="Move right"
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

    .sync-panel {
        position: absolute;
        top: 12px;
        right: 16px;
        z-index: 25;
        display: grid;
        justify-items: end;
        gap: 6px;
    }

    .sync-badge {
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

    .sync-btn {
        border: 1px solid rgba(197, 226, 255, 0.45);
        background: rgba(13, 29, 56, 0.86);
        color: #d9ebff;
        border-radius: 8px;
        padding: 5px 9px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
    }

    .sync-meta {
        color: rgba(223, 236, 255, 0.8);
        font-size: 11px;
        font-weight: 600;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
    }

    .run-controls {
        position: absolute;
        top: 90px;
        right: 16px;
        z-index: 25;
        display: grid;
        gap: 8px;
        justify-items: end;
    }

    .control-action {
        border: 1px solid rgba(197, 226, 255, 0.45);
        background: rgba(13, 29, 56, 0.9);
        color: #d9ebff;
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
    }

    .control-action.secondary {
        background: rgba(19, 40, 70, 0.86);
    }

    .hud-card {
        background: linear-gradient(155deg, rgba(9, 21, 46, 0.24), rgba(4, 12, 27, 0.18));
        border: 1px solid rgba(219, 234, 255, 0.1);
        border-radius: 12px;
        padding: 8px 12px 9px;
        display: grid;
        gap: 2px;
        backdrop-filter: blur(1.5px);
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

    .actions button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        transform: none;
        filter: none;
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

    .mobile-controls.left-handed {
        flex-direction: row-reverse;
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
