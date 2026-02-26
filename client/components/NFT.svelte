<script lang="ts">
    import type { NFT } from "../../server/domain/nft";
    import player1nft from "../src/stores/player1nft";
    import { playerImage } from "../src/stores/playerImage";
    import transformURLs from "../utils/transformURLs";
    import preparePlayerSprite from "../utils/preparePlayerSprite";
    import truncateString from "../utils/truncateString";
    import { push } from "svelte-spa-router";
    const PLAYER_NFT_KEY = "nftgame.playerNft";
    const PLAYER_IMAGE_KEY = "nftgame.playerImage";

    export let nft: NFT;
</script>

{#if nft.title}

    <div >
        
        
        {#if nft.description}
        <p class="mb-5">{truncateString(nft.description, 20)}</p> <br />
        {:else}
            <!-- <p>There is no description available</p> <br /> -->
        {/if}
       
        <h1 class="mb-2 text-xl font-bold text-secondary">{nft.title}</h1>
        <div class="the-NFT">
            <img
                src={transformURLs(nft.imageURL)}
                alt={nft.title}
                on:click={async () => {
                    const resolvedImage = transformURLs(nft.imageURL);
                    let processedImage = resolvedImage;
                    try {
                        processedImage = await preparePlayerSprite(resolvedImage);
                    } catch (error) {
                        console.warn("Sprite preprocessing failed, using original NFT image.", error);
                    }
                    player1nft.set(nft);
                    playerImage.set(processedImage);
                    sessionStorage.setItem(PLAYER_NFT_KEY, JSON.stringify(nft));
                    sessionStorage.setItem(PLAYER_IMAGE_KEY, processedImage);
                    await push('/game');
                }}
                on:keypress={() => {
                    playerImage.set(transformURLs(nft.imageURL));
                }}
            /> <br />
        </div>
    </div>
{/if}

<style>
    p {
        text-align: center;
    }
    .the-NFT {
        display: flex;
        justify-content: center;
    }
    img {
        border-radius: 8px;
        max-width: 200px;
        /* 
  justify-content: center; */
    }
    .the-NFT {
        margin: 0 auto;
    }
    h2 {
        text-align: center;
        /* 
    font-size: 16px;
    font-weight: 500; */
        color: #b4bbc3;
    }
</style>
