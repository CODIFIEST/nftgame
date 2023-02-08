<script lang="ts">
    import axios from "axios";
    import { onMount } from "svelte";
    let games = [];
    async function getGames() {
        const result = await axios.get("http://localhost:3000/games");
        console.log("results", result.data);
        return result.data;
    }
    onMount(async () => {
        games = await getGames();
    });
</script>

{#each games as game}
<div class="container">
    <div class="row">
        <div class="column">
            <br />Name: {game.name}
            <br />Platform: {game.platform}
            <br />Release Year:{game.releaseYear}
            <br />Genre: {game.genre}
            <br />ESRB Rating: {game.ESRBrating}
            <br />Is it good? {game.goodGame}
        </div>
    </div>
</div>
{/each}

<style>
    
    /* .container {
    max-width: 1200px;
    margin: 0px auto;
    overflow: hidden;
    background-color: rgba(0, 0, 0, .6);
    }
    .row {
        display: flex;
        flex-wrap: wrap;
        
    }
    .column {
        width: 24%;
    } */
</style>
