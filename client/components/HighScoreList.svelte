<script lang="ts">
    import axios from "axios";
    import { onMount } from "svelte";
    import highscores from "../src/stores/highscores";
    let scores = [];
    async function getHighScores() {
        const result = await axios.get('http://localhost:3888/scores');
        console.log('results', result.data)
        return result.data
        
    }
    onMount(async ()=> {
        scores = await getHighScores();
          // sort by value
        scores.sort((a,b)=> b.score - a.score)
        highscores.set(scores)
    })
</script>
{#each scores as p1score }
    <div>
        <br> Name: {p1score.playerName}
        <br> Score: {p1score.score}
    </div>
    
{/each}