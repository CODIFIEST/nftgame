<script lang="ts">
    import { push } from "svelte-spa-router";
    import Hero from "../../components/Hero.svelte";
    import HighScoreList from "../../components/HighScoreList.svelte";
    import connectPhantom from "../../utils/connectPhantom";
import connectMetamask from "../../utils/connectMetamask";
    import nfts from "../stores/nfts";

    // import connectPhantom from "../utils/connectPhantom"
    </script>
    
    <div style="display: block;">
        <h1 class ="card-title text-secondary text-2xl">Connect your wallet to choose your NGMI Panda</h1><br>
    
    
    <div class="nft-wallets">
    
         <img 
            class = "wallet-image"
            alt = "phantom wallet"
            src = 'phantom-icon-purple.png'
            on:click={
                async ()=>{
                    await connectPhantom();
                    await push ('/displaychars');
                }
            }
            on:keypress={
                async ()=>{
                    await connectPhantom();
                }
            }
        >
        <img
        class="wallet-image"
        src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
        alt="metamask Fox"
        on:keypress={async () => {
            await connectMetamask()
            // .then(async ()=>{

            // });
         
        }}
        on:click={async () => {
            await connectMetamask();
            console.log('nfts from login page',$nfts);
                await push ('/displaychars');
        }}
    />
    
    </div>

    </div>

    <style>
        /* h1{
            background-color: rgba(0, 0, 0, 0.4);
        } */
            .nft-wallets {
            display: flex;
            flex-wrap: wrap;
            /* flex-direction: column; */
            justify-content: center;
            max-width: 600px;
         
            
            /* this will be the container for all the wallets */
        }
        .wallet-image {
    
            width: 75px
          
        }
    
    </style>
    
