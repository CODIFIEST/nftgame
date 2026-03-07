<script lang="ts">
    export let reducedMotion = false;
    export let leftHandedMobileControls = false;
</script>

<div class="options-panel">
    <label>
        <input type="checkbox" bind:checked={reducedMotion} />
        Reduced motion
    </label>
    <label>
        <input type="checkbox" bind:checked={leftHandedMobileControls} />
        Left-handed controls
    </label>
</div>

<style>
    .options-panel {
        position: absolute;
        top: 154px;
        right: 16px;
        z-index: 25;
        display: grid;
        gap: 8px;
        color: #e5efff;
        font-size: 12px;
        font-weight: 600;
        background: rgba(8, 17, 35, 0.86);
        border: 1px solid rgba(194, 214, 255, 0.34);
        border-radius: 10px;
        padding: 10px 12px;
    }

    .options-panel label {
        display: flex;
        align-items: center;
        gap: 8px;
    }
</style>
