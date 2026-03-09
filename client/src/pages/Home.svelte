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
        max-width: 100%;
    }

    .name-input {
        flex: 1 1 280px;
        min-width: 0;
        width: 100%;
        max-width: 100%;
        min-height: 54px;
        box-sizing: border-box;
        border: 1px solid rgba(255, 255, 255, 0.26);
        background: rgba(244, 247, 253, 0.94);
        color: #0e1b2f;
    }

    .name-btn {
        flex: 0 0 auto;
        white-space: nowrap;
        color: #f8fbff;
        width: auto;
        max-width: 100%;
        min-height: 54px;
        box-sizing: border-box;
        border: 1px solid rgba(255, 255, 255, 0.24);
        background: rgba(44, 52, 66, 0.92);
        font-weight: 700;
    }

    .hero-copy {
        margin: 4px auto 16px;
        padding: 6px 10px 8px;
        max-width: 760px;
        width: 100%;
        box-sizing: border-box;
        overflow-wrap: anywhere;
        border-radius: 10px;
        background: rgba(6, 18, 34, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .title {
        margin: 0 auto 6px;
        max-width: 12ch;
        width: 100%;
        box-sizing: border-box;
        font-size: clamp(30px, 4.6vw, 56px);
        line-height: 1.08;
        letter-spacing: -0.01em;
        color: #ffffff;
        display: block;
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    .subtitle {
        margin: 0 auto 12px;
        font-size: clamp(15px, 1.35vw, 22px);
        line-height: 1.34;
        max-width: 48ch;
        width: 100%;
        box-sizing: border-box;
        color: #f3f7ff;
        display: block;
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    @media (max-width: 768px) {
        .name-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 8px;
            width: 100%;
            max-width: 100%;
        }

        .name-input,
        .name-btn {
            width: 100%;
            flex-basis: 100%;
            min-width: 0;
            max-width: 100%;
        }

        .title {
            font-size: clamp(28px, 8.2vw, 40px);
            max-width: 100%;
            width: 100%;
        }

        .subtitle {
            font-size: clamp(13px, 3.8vw, 18px);
            max-width: 34ch;
            width: 100%;
        }

        .hero-copy {
            width: 100%;
            max-width: 100%;
            padding: 6px 8px 8px;
        }
    }

    :global(.phantom-browser) .landing-shell {
        padding-top: 82px;
    }

    :global(.phantom-browser) .name-input {
        background: #f4f6fb;
        color: #10213b;
        border-color: rgba(9, 26, 54, 0.28);
    }

    :global(.phantom-browser) .name-input::placeholder {
        color: #5e6f88;
        opacity: 1;
    }

    :global(.phantom-browser) .name-btn {
        background: #2f3442;
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.34);
        text-shadow: none;
    }
</style>
