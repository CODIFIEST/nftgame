<script lang="ts">
    import axios from "axios";
    import { onMount } from "svelte";
    import { NFTType } from "../../server/domain/nft";
    import highscores from "../src/stores/highscores";
    let scores = [];
    let onthelist=[];
    async function getHighScores() {
        const result = await axios.get('https://nftgame-server.vercel.app/scores');
        console.log('results', result.data)
        return result.data
        
    }
    onMount(async ()=> {
    
        scores = await getHighScores();
          // sort by value
        scores.sort((a,b)=> b.score - a.score)

        scores.forEach((score)=>{
            if (!onthelist.some(e=>e.imageURL=== score.imageURL)){
                onthelist.push(score)
            }
            // console.log('onthelist' , onthelist);
           
        });
        if (onthelist.length > 10) {
            onthelist.length = 10;
        }
        highscores.set(onthelist)
             console.log(' here are the high score stored in a local array', $highscores)
// console.log('do scores and onthelist look different?', scores)
// console.log('onthelist', onthelist)

    })

</script>
<div class="carousel rounded-box ">
<!-- {#each scores as p1score } -->


{#each $highscores as p1score}
    

    <div class="carousel-item rounded-md">
    
        <!-- <br> Token: {p1score.token} -->
        <img src={p1score.imageURL} height="200px" width="200px" alt="super panda">
        <p class="mb-5 text-secondary">   Name: {p1score.playerName}
    <br>    Score: {p1score.score}</p>
        </div>

{/each}
</div>
