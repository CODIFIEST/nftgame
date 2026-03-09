<script lang="ts">
    import nfts from "../stores/nfts";
    import Nft from "../../components/NFT.svelte";
 
</script>

<section class="display-shell">
    <h1 class="display-title">Choose Your Panda</h1>
    <div class="nft-list">
        {#if $nfts}
            {#each $nfts as nft}
                {#if nft.imageURL}
                    <div class="nft-column">
                        <Nft {nft} />
                    </div>
                {/if}
            {/each}
        {:else}
            Loading...
        {/if}
    </div>
</section>



<style>
    .display-shell {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 74px 0 14px;
        color: var(--theme-text);
    }

    .display-title {
        margin: 0 8px 10px;
        font-size: clamp(26px, 4vw, 40px);
        font-weight: 800;
        line-height: 1.15;
        color: var(--theme-heading);
        text-align: center;
    }

    .nft-list {
        width: 100%;
        display: flex;
        gap: 12px;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 12px 8px 18px;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
    }

    .nft-column {
        flex: 0 0 clamp(230px, 74vw, 290px);
        scroll-snap-align: start;
    }

    @media (min-width: 900px) {
        .nft-list {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
            overflow: visible;
            padding: 12px 0 0;
            scroll-snap-type: none;
        }

        .nft-column {
            flex: none;
        }
    }

</style>
