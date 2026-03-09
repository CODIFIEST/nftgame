<script lang="ts">
    import nfts from "../stores/nfts";
    import Nft from "../../components/NFT.svelte";
 
</script>

<div class="nft-list">
            {#if $nfts}
        <!-- {console.log("from displayNFTs.svelte ", $nfts)} -->
        
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



<style>
    .nft-list {
        width: 100%;
        display: flex;
        gap: 12px;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 12px 8px 18px;
        box-sizing: border-box;
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
