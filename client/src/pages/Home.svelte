<script lang="ts">
    import { onMount } from "svelte";
    import HighScoreList from "../../components/HighScoreList.svelte";
    import player1 from "../stores/player1";
    import playerName from "../stores/playername";
    import { push } from "svelte-spa-router";
    const PLAYER_NAME_KEY = "nftgame.playerName";

    function setPlayerName() {
        player1.set({
            playerName: $playerName,
            token: "",
            score: 0,
            imageURL: "",
        });
    }

    async function submitName() {
        setPlayerName();
        await push('/login');
    }
    player1.set({ playerName: "", token: "", score: 0, imageURL: "" });

    onMount(() => {
        const persistedName = sessionStorage.getItem(PLAYER_NAME_KEY);
        if (persistedName && !$playerName) {
            playerName.set(persistedName);
        }
    });

    $: if ($playerName !== undefined) {
        const normalizedName = ($playerName ?? "").trim();
        sessionStorage.setItem(PLAYER_NAME_KEY, normalizedName);
    }
</script>

<section class="landing-shell">
    <div class="landing-form">
        <input
            class="name-input"
            bind:value={$playerName}
            type="text"
            placeholder="Put your name here"
            maxlength="10"
            autocomplete="off"
            on:keydown={async (event) => {
                if (event.key === "Enter") {
                    await submitName();
                }
            }}
        />
        <button class="name-btn" on:click={submitName}>Let's Play!</button>
    </div>
    <div class="hero-panel">
        <h1 class="hero-title">Hello there</h1>
        <p class="hero-subtitle">
            Pandas' last resort is the super secret kill switch embedded in the crane
            core logic. Join in the great pizza wars against the maniacal cranes.
        </p>
    </div>
    <HighScoreList />
</section>

<style>
    .landing-shell {
        width: min(100%, 980px);
        margin: 0 auto;
        padding: 72px 12px 14px;
        box-sizing: border-box;
        overflow-x: hidden;
        color: #eef4ff;
    }

    .landing-form {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        width: 100%;
        max-width: 100%;
    }

    .name-input {
        flex: 1 1 280px;
        min-width: 0;
        width: 100%;
        max-width: 100%;
        min-height: 54px;
        box-sizing: border-box;
        border: 1px solid rgba(255, 255, 255, 0.32);
        border-radius: 12px;
        padding: 0 16px;
        font-size: 18px;
        background: rgba(244, 247, 253, 0.95);
        color: #0e1b2f;
        -webkit-text-fill-color: #0e1b2f;
        appearance: none;
        -webkit-appearance: none;
    }

    .name-btn {
        flex: 0 0 auto;
        white-space: nowrap;
        color: #f8fbff;
        width: auto;
        max-width: 100%;
        min-height: 54px;
        padding: 0 20px;
        border-radius: 12px;
        box-sizing: border-box;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: rgba(43, 51, 66, 0.96);
        font-weight: 700;
        font-size: 22px;
        line-height: 1;
        -webkit-text-fill-color: #f8fbff;
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
        text-align: center;
    }

    .hero-panel {
        margin: 4px auto 16px;
        padding: 6px 10px 10px;
        max-width: 760px;
        width: 100%;
        box-sizing: border-box;
        border-radius: 12px;
        background: rgba(6, 18, 34, 0.28);
        border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .hero-title {
        margin: 0 auto 4px;
        max-width: 16ch;
        width: 100%;
        box-sizing: border-box;
        font-size: clamp(28px, 4.6vw, 52px);
        font-weight: 800;
        line-height: 1.08;
        letter-spacing: -0.01em;
        color: #ffffff;
        -webkit-text-fill-color: #ffffff;
        display: block;
    }

    .hero-subtitle {
        margin: 0 auto;
        font-size: clamp(14px, 1.35vw, 21px);
        line-height: 1.34;
        max-width: 42ch;
        width: 100%;
        box-sizing: border-box;
        color: #eef4ff;
        -webkit-text-fill-color: #eef4ff;
        display: block;
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    @media (max-width: 768px) {
        .landing-form {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 8px;
            width: 100%;
            max-width: 100%;
        }

        .name-input,
        .name-btn {
            width: 100%;
            flex: 1 1 100%;
            min-width: 0;
            max-width: 100%;
        }

        .name-input,
        .name-btn {
            min-height: 50px;
            font-size: 16px;
        }

        .hero-title {
            font-size: clamp(24px, 8.2vw, 36px);
            max-width: 100%;
            width: 100%;
        }

        .hero-subtitle {
            font-size: clamp(12px, 3.8vw, 16px);
            max-width: 35ch;
            width: 100%;
        }

        .hero-panel {
            width: 100%;
            max-width: 100%;
            padding: 5px 8px 8px;
        }
    }
</style>
