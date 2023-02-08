<script lang="ts">
import connectPhantom from "../utils/connectPhantom"
</script>

<div style="display: block;">
    <h1 class ="darker-backgrond">Connect your wallet to choose your NGMI Panda</h1><br>


<div class="nft-wallets">

     <img 
        class = "wallet-image"
        alt = "phantom wallet"
        src = 'phantom-icon-purple.png'
        on:click={
            async ()=>{
                await connectPhantom();
            }
        }
        on:keypress={
            async ()=>{
                await connectPhantom();
            }
        }
    >

</div>
</div>

<style>
    h1{
        background-color: rgba(0, 0, 0, 0.4);
    }
        .nft-wallets {
        display: flex;
        flex-wrap: wrap;
        /* flex-direction: column; */
        justify-content: center;
        max-width: 600px;
     
        
        /* this will be the container for all the wallets */
    }
    .wallet-image {

        width: 49%
      
    }

</style>
