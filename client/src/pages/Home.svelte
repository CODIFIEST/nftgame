<script lang="ts">
    import { onMount } from "svelte";
    import HighScoreList from "../../components/HighScoreList.svelte";
    import player1 from "../stores/player1";
    import playerName from "../stores/playername";
    import { push } from "svelte-spa-router/Router.svelte";
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

<input
class = "input"
bind:value={$playerName} type="text" placeholder="Put your name here" maxlength="10"
on:keydown={async (event) => {
    if (event.key === "Enter") {
        await submitName();
    }
}} />
<button
class="btn"
    on:click={submitName}>Let's Play!</button
>
<h1 class="mb-5 text-5xl font-bold text-secondary">Hello there </h1>
<p class="mb-5 text-secondary">
    Pandas' last resort is the super secret kill switch embedded in the crane
    core logic. Join in the great pizza wars against the maniacal cranes.
</p>
<HighScoreList />
