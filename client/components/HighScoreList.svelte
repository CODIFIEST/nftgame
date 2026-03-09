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
<div class="leaderboard-scroll" aria-label="Current season leaderboard">
{#each seasonScores as p1score}
    <article class="leaderboard-card rounded-md">
        <img src={p1score.imageURL} alt="super panda" class="leaderboard-image">
        <p class="leaderboard-text text-secondary">
            <span class="leaderboard-meta">Name:</span> {p1score.playerName}
            <br>
            <span class="leaderboard-meta">Score:</span> {p1score.score}
        </p>
    </article>

{/each}
</div>

<p class="season-label text-secondary">All-Time Highscores</p>
{#if allTimeFallbackUsed}
    <p class="season-label text-secondary">(fallback view: current season data)</p>
{/if}
{#if allTimeUnavailable}
    <p class="season-label text-secondary">(all-time leaderboard unavailable)</p>
{/if}
<div class="leaderboard-scroll" aria-label="All-time leaderboard">
{#each allTimeScores as p1score}
    <article class="leaderboard-card rounded-md">
        <img src={p1score.imageURL} alt="super panda" class="leaderboard-image">
        <p class="leaderboard-text text-secondary">
            <span class="leaderboard-meta">Name:</span> {p1score.playerName}
            <br>
            <span class="leaderboard-meta">Score:</span> {p1score.score}
        </p>
    </article>

{/each}
</div>

<style>
    .season-label {
        font-size: clamp(22px, 2.4vw, 34px);
        font-weight: 700;
        line-height: 1.1;
        margin: 6px 0 8px 4px;
        text-shadow: 0 1px 8px rgba(0, 0, 0, 0.25);
    }

    .leaderboard-scroll {
        width: 100%;
        display: flex;
        gap: 10px;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 2px 4px 10px;
        box-sizing: border-box;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
    }

    .leaderboard-card {
        flex: 0 0 clamp(170px, 22vw, 240px);
        scroll-snap-align: start;
        background: rgba(0, 0, 0, 0.38);
        border: 1px solid rgba(255, 255, 255, 0.2);
        overflow: hidden;
    }

    .leaderboard-image {
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
    }

    .leaderboard-text {
        margin: 0;
        padding: 6px 8px 8px;
        font-size: clamp(13px, 2.2vw, 16px);
        line-height: 1.25;
        word-break: break-word;
    }

    .leaderboard-meta {
        font-weight: 700;
    }

    @media (max-width: 768px) {
        .season-label {
            font-size: clamp(18px, 5vw, 24px);
            margin: 4px 0 6px 2px;
        }

        .leaderboard-card {
            flex-basis: clamp(136px, 38vw, 176px);
        }

        .leaderboard-text {
            font-size: clamp(12px, 3.2vw, 14px);
            padding: 4px 6px 6px;
        }
    }
</style>
