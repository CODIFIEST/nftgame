<script lang="ts">
    import type { NFT } from "../../../server/domain/nft";
    import nfts from "../stores/nfts";
    import Nft from "../../components/NFT.svelte";
 
</script>

<div class="grid gap-4 grid-cols-4">
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

</style>
