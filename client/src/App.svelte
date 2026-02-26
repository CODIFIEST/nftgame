<script lang="ts">
    import Router from 'svelte-spa-router/Router.svelte'
    import { location } from "svelte-spa-router";
    import DisplayNfTs from "./pages/DisplayNFTs.svelte";

    import Hero from "../components/Hero.svelte";
    import HighScoreList from "../components/HighScoreList.svelte";

    import Home from "./pages/Home.svelte";
    import LoginPage from "./pages/LoginPage.svelte";
     import { account } from "./stores/account";
    import player1 from "./stores/player1";
    import { playerImage } from "./stores/playerImage";
    import playerName from "./stores/playername";
    import GameOn from './pages/GameOn.svelte';
    import Navbar from '../components/Navbar.svelte';
    let viewForm:boolean = true
    function toggleDisplay() {
        viewForm = !viewForm;

    }

    const routes = {
    // Exact path
    "/": Home,
    // route to create a user to be able to log in
    // "/register": CreateUser,
    // Using named parameters, with last being optional
    "/login": LoginPage,

    // Display all possible characters
    "/displaychars": DisplayNfTs,
    //edit only your own user
    "/game": GameOn,

    // Catch-all
    // This is optional, but if present it must be the last
    // "*": NotFound,
  };

  $: isGameRoute = $location === "/game";
</script>

<main>
  <div
    class="hero min-h-screen"
    class:game-shell={isGameRoute}
    style={!isGameRoute ? "background-image: url('https://www.arweave.net/hNN-l4QsOuWIRWwpOn-VDjso2NsGBW3Mg30p18Gs6zQ?ext=png')" : ""}
  >
    {#if !isGameRoute}
      <div class="hero-overlay bg-opacity-60" />
    {/if}
    <div class:hero-content={!isGameRoute} class:game-content={isGameRoute} class:text-center={!isGameRoute}>
      <div class={isGameRoute ? "w-full" : "max-w-7xl"}>
        <Router {routes} />
      </div>
    </div>
  </div>
</main>

<style>
  .game-shell {
    background: radial-gradient(circle at 20% 20%, #1b2945 0%, #0e182d 45%, #070d18 100%);
  }

  .game-content {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 12px;
  }
</style>
