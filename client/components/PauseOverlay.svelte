<script lang="ts">
    export let onResume: () => void;
</script>

<div class="pause-overlay">
    <div class="pause-card">
        <h3>Paused</h3>
        <p>Press Esc or tap resume to continue.</p>
        <button on:click={onResume}>Resume</button>
    </div>
</div>

<style>
    .pause-overlay {
        position: absolute;
        inset: 0;
        z-index: 45;
        display: grid;
        place-items: center;
        background: rgba(8, 12, 20, 0.72);
        backdrop-filter: blur(2px);
    }

    .pause-card {
        width: min(420px, 90vw);
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        background: linear-gradient(165deg, rgba(20, 32, 55, 0.98), rgba(8, 14, 28, 0.95));
        padding: 20px;
        color: #eaf2ff;
        text-align: center;
        display: grid;
        gap: 8px;
    }

    .pause-card h3,
    .pause-card p {
        margin: 0;
    }

    .pause-card h3 {
        color: #ffedc6;
    }

    .pause-card button {
        border: none;
        border-radius: 10px;
        background: linear-gradient(140deg, #ffd37f, #ffbf63);
        color: #1f1a0f;
        font-weight: 700;
        padding: 10px 16px;
        cursor: pointer;
        margin-top: 6px;
    }
</style>
