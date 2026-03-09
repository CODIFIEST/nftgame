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
    <div class="name-row">
        <input
            class="input name-input"
            bind:value={$playerName}
            type="text"
            placeholder="Put your name here"
            maxlength="10"
            on:keydown={async (event) => {
                if (event.key === "Enter") {
                    await submitName();
                }
            }}
        />
        <button class="btn name-btn" on:click={submitName}>Let's Play!</button>
    </div>
    <div class="hero-copy">
        <h1 class="title font-bold">Hello there</h1>
        <p class="subtitle">
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
        padding: 68px 12px 16px;
        box-sizing: border-box;
        overflow-x: clip;
    }

    .name-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        width: 100%;
    }

    .name-input {
        flex: 1 1 280px;
        min-width: 0;
    }

    .name-btn {
        flex: 0 0 auto;
        white-space: nowrap;
        color: #f8fbff;
    }

    .hero-copy {
        margin: 4px auto 16px;
        padding: 6px 12px 10px;
        max-width: 760px;
        border-radius: 12px;
        background: rgba(6, 18, 34, 0.32);
        border: 1px solid rgba(255, 255, 255, 0.18);
        backdrop-filter: blur(2px);
    }

    .title {
        margin: 0 auto 10px;
        max-width: 12ch;
        font-size: clamp(42px, 6.2vw, 74px);
        line-height: 1.04;
        letter-spacing: -0.02em;
        color: #f4f8ff;
        text-shadow: 0 2px 16px rgba(0, 0, 0, 0.35);
        display: block;
    }

    .subtitle {
        margin: 0 auto 18px;
        font-size: clamp(18px, 2vw, 30px);
        line-height: 1.32;
        max-width: 46ch;
        color: #edf3ff;
        text-wrap: balance;
        text-shadow: 0 1px 10px rgba(0, 0, 0, 0.28);
        display: block;
    }

    @media (max-width: 768px) {
        .name-row {
            flex-wrap: wrap;
            gap: 8px;
        }

        .name-input,
        .name-btn {
            width: 100%;
            flex-basis: 100%;
        }

        .title {
            font-size: clamp(44px, 12.5vw, 58px);
            max-width: 100%;
        }

        .subtitle {
            font-size: clamp(16px, 5.2vw, 23px);
            max-width: 33ch;
        }

        .hero-copy {
            width: 100%;
            padding: 8px 10px 10px;
        }
    }
</style>
