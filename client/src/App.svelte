<script lang="ts">
    import DisplayNfTs from "../components/DisplayNFTs.svelte";
    import Game from "../components/Game.svelte";
    import Hero from "../components/Hero.svelte";
    import HighScoreList from "../components/HighScoreList.svelte";
     import { account } from "./stores/account";
    import player1 from "./stores/player1";
    import { playerImage } from "./stores/playerImage";
    import playerName from "./stores/playername";
    let viewForm:boolean = true
    function toggleDisplay() {
        viewForm = !viewForm;

    }
    function setPlayerName(){
      player1.set({playerName:$playerName,
      token:"",
      score:0,
      imageURL:""
    })
    }
    player1.set({playerName:"",
      token:"",
      score:0,
      imageURL:""
    })

</script>

<main>

  {#if $account && !$playerImage}
<!-- {console.log("front page ", $account)} -->
<DisplayNfTs />
{:else if $playerImage}
<div id="bg-image">
  <!-- <Resizer /> -->
<Game/>
</div>
{:else if !$player1.playerName}
<input bind:value={$playerName} type="text" placeholder="Put your name here">
<button on:click = {()=>setPlayerName()}>Let's Play!</button>
<HighScoreList />

{:else}
<Hero />
<HighScoreList />
{/if}
<!-- {if $account && !$player1.imgURL} -->

  <!-- <button on:click={toggleDisplay}>Toggle the Display</button>
  {#if viewForm} -->
 <!-- <UserForm /> -->
 <!-- <VideoGameForm /> -->

 <!-- {:else} -->
 <!-- <HighScoreList /> -->
 <!-- <VideoGameList /> -->
 <!-- <UserList /> -->
 <!-- {/if} -->
</main>
