<script lang="ts">
    import DisplayNfTs from "../components/DisplayNFTs.svelte";
    import Game from "../components/Game.svelte";
    import Hero from "../components/Hero.svelte";
    import HighScoreList from "../components/HighScoreList.svelte";
    import VideoGameForm from "../components/VideoGameForm.svelte";
    import VideoGameList from "../components/VideoGameList.svelte";
    import { account } from "./stores/account";
    import player1 from "./stores/player1";
    import { playerImage } from "./stores/playerImage";
    let viewForm:boolean = true
    function toggleDisplay() {
  viewForm = !viewForm;
}

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
