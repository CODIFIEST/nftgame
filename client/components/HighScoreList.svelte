<script lang="ts">
    import axios from "axios";
    import { onMount } from "svelte";
    import { NFTType } from "../../server/domain/nft";
    import highscores from "../src/stores/highscores";
    const API_BASE_URL = "https://nftgame-server.vercel.app";
    const currentDate = new Date();
    const currentSeason = `${currentDate.getUTCFullYear()}-Q${Math.floor(currentDate.getUTCMonth() / 3) + 1}`;
    let seasonScores = [];
    let allTimeScores = [];

    async function getSeasonScores() {
        const result = await axios.get(`${API_BASE_URL}/scores`);
        console.log('season results', result.data)
        return result.data
        
    }

    async function getAllTimeScores() {
        const result = await axios.get(`${API_BASE_URL}/scores/all-time`);
        console.log('all-time results', result.data)
        return result.data
        
    }

    function getTopUniqueScores(scores: any[]) {
        const onthelist = [];
        scores.sort((a,b)=> b.score - a.score);
        scores.forEach((score)=>{
            if (!onthelist.some(e=>e.imageURL=== score.imageURL)){
                onthelist.push(score);
            }
        });
        if (onthelist.length > 10) {
            onthelist.length = 10;
        }
        return onthelist;
    }

    onMount(async ()=> {
        const fetchedSeasonScores = await getSeasonScores();
        seasonScores = getTopUniqueScores(fetchedSeasonScores);
        highscores.set(seasonScores);
        console.log('season highscores', seasonScores);

        const fetchedAllTimeScores = await getAllTimeScores();
        allTimeScores = getTopUniqueScores(fetchedAllTimeScores);
        console.log('all-time highscores', allTimeScores);

    })

</script>
<p class="season-label text-secondary">Current Season: {currentSeason}</p>
<div class="carousel rounded-box ">
{#each seasonScores as p1score}
    

    <div class="carousel-item rounded-md">
    
        <!-- <br> Token: {p1score.token} -->
        <img src={p1score.imageURL} height="200px" width="200px" alt="super panda">
        <p class="mb-5 text-secondary">   Name: {p1score.playerName}
    <br>    Score: {p1score.score}</p>
        </div>

{/each}
</div>

<p class="season-label text-secondary">All-Time Highscores</p>
<div class="carousel rounded-box ">
{#each allTimeScores as p1score}

    <div class="carousel-item rounded-md">
    
        <img src={p1score.imageURL} height="200px" width="200px" alt="super panda">
        <p class="mb-5 text-secondary">   Name: {p1score.playerName}
    <br>    Score: {p1score.score}</p>
        </div>

{/each}
</div>

<style>
    .season-label {
        font-size: 14px;
        font-weight: 700;
        margin: 4px 0 8px 4px;
    }
</style>
