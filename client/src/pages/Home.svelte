<script lang="ts">
    import HighScoreList from "../../components/HighScoreList.svelte";
    import player1 from "../stores/player1";
    import playerName from "../stores/playername";
    import { push } from "svelte-spa-router/Router.svelte";

    function setPlayerName() {
        player1.set({
            playerName: $playerName,
            token: "",
            score: 0,
            imageURL: "",
        });
    }
    player1.set({ playerName: "", token: "", score: 0, imageURL: "" });
</script>

<input
class = "input"
bind:value={$playerName} type="text" placeholder="Put your name here" maxlength="10" />
<button
class="btn"
    on:click={async () => {
        setPlayerName();
        await push('/login')
      

    }}>Let's Play!</button
>
<h1 class="mb-5 text-5xl font-bold text-secondary">Hello there </h1>
<p class="mb-5 text-secondary">
    Pandas' last resort is the super secret kill switch embedded in the crane
    core logic. Join in the great pizza wars against the maniacal cranes.
</p>
<HighScoreList />
