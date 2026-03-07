<script lang="ts">
    import axios from "axios";
    import { onMount } from "svelte";
    import { getApiBaseUrl } from "../src/config/runtime";
    import { trackError } from "../src/game/telemetry";
    import highscores from "../src/stores/highscores";
    const API_BASE_URL = getApiBaseUrl();
    const currentDate = new Date();
    const currentSeason = `${currentDate.getUTCFullYear()}-Q${Math.floor(currentDate.getUTCMonth() / 3) + 1}`;
    let seasonScores = [];
    let allTimeScores = [];
    let allTimeFallbackUsed = false;
    let allTimeUnavailable = false;

    async function getSeasonScores() {
        const result = await axios.get(`${API_BASE_URL}/scores`, {
            timeout: 10000,
            params: {
                season: currentSeason,
            },
        });
        return result.data
        
    }

    async function getAllTimeScores() {
        const result = await axios.get(`${API_BASE_URL}/scores/all-time`, { timeout: 10000 });
        allTimeFallbackUsed = false;
        return result.data
    }

    function getTopUniqueScores(scores: any[], targetSeason?: string) {
        const onthelist = [];
        const scoped = targetSeason
            ? scores.filter((score) => score?.season === targetSeason)
            : scores;
        scoped.sort((a,b)=> b.score - a.score);
        scoped.forEach((score)=>{
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
        try {
            const fetchedSeasonScores = await getSeasonScores();
            seasonScores = getTopUniqueScores(fetchedSeasonScores, currentSeason);
            highscores.set(seasonScores);
        } catch (error) {
            trackError("season_highscores_load_failed", {
                message: error instanceof Error ? error.message : String(error),
            });
            seasonScores = [];
            highscores.set([]);
        }

        try {
            const fetchedAllTimeScores = await getAllTimeScores();
            allTimeScores = getTopUniqueScores(fetchedAllTimeScores);
            allTimeUnavailable = false;
        } catch (error) {
            trackError("all_time_highscores_load_failed", {
                message: error instanceof Error ? error.message : String(error),
            });
            allTimeScores = [];
            allTimeFallbackUsed = false;
            allTimeUnavailable = true;
        }

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
{#if allTimeFallbackUsed}
    <p class="season-label text-secondary">(fallback view: current season data)</p>
{/if}
{#if allTimeUnavailable}
    <p class="season-label text-secondary">(all-time leaderboard unavailable)</p>
{/if}
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
