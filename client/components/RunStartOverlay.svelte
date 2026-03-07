<script lang="ts">
    export let onStart: () => void;
</script>

<div class="start-overlay">
    <div class="start-card">
        <h2>Ready To Run</h2>
        <p>Collect Crane Juice, build combo, avoid Cranes.</p>
        <p class="help">Desktop: arrow keys. Mobile: on-screen controls.</p>
        <button on:click={onStart}>Start Run</button>
    </div>
</div>

<style>
    .start-overlay {
        position: absolute;
        inset: 0;
        z-index: 45;
        display: grid;
        place-items: center;
        background: rgba(8, 12, 20, 0.72);
        backdrop-filter: blur(2px);
    }

    .start-card {
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

    .start-card h2 {
        margin: 0;
        color: #ffedc6;
    }

    .start-card p {
        margin: 0;
    }

    .help {
        color: #a9c2e3;
        font-size: 13px;
    }

    .start-card button {
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
