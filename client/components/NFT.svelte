<script lang="ts">
    import type { NFT } from "../../server/domain/nft";
    import type { PlayerScore } from "../src/domain/playerscore";
    import player1nft from "../src/stores/player1nft";
    import { playerImage } from "../src/stores/playerImage";
    // import transformURLs from "../utils/transformURLs";
    import transformURLs from "../utils/transformURLs";
    import truncateString from "../utils/truncateString";
    import Game from "./Game.svelte";
    import Thumbo, { Transfer } from "thumbo";
    // import truncateString from "../utils/truncateString";
    export let nft: NFT;
</script>

{#if nft.title}
    <div>
        <h2>{nft.title}</h2>
        <br />
        {#if nft.description}
            <p>{truncateString(nft.description, 20)}</p>
        {:else}
            <p>There is no description available</p>
        {/if}
        <br />
        <div class="the-NFT">
            <img
                src={transformURLs(nft.imageURL)}
                alt={nft.title}
                on:click={() => {
//                     resize the image and save it here for the game TODO this is broken now
                     Thumbo.init().then(async () => {
                         Thumbo.thumbnailFromUrl(
                             `${nft.imageURL}`,
                             Thumbo.ImageFormat.Png,
                             270,
                             200
                         ).then(async (thumbnailBuffer) => {
						const daPlayer = await URL.createObjectURL( new Blob([thumbnailBuffer])
						  );
//                             const daPlayer = new Blob([thumbnailBuffer,]).toString();
                             console.log(daPlayer)
                             playerImage.set(daPlayer);
                             console.log('WHAT IS THE PLAYERIMAGE', $playerImage);
                         });
                     });
//                    playerImage.set(nft.imageURL)
                    player1nft.set(nft);
                    // console.log(playerImage)
                    console.log("NFT.svelte playerImage");
                    console.log($playerImage);
                    console.log($player1nft);
                    // document.getElementById('game-container').innerHTML = `<img src='${nft.imageURL}'>`;
                }}
                on:keypress={() => {
                    playerImage.set(nft.imageURL);
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
