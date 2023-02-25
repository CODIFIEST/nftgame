<script lang="ts">
    import Router from 'svelte-spa-router/Router.svelte'
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
</script>

<main>

  <div class="hero flex-auto">
  
    <div class="hero-overlay bg-opacity-60" />
    <div class="hero-content text-center">
      <div class="max-w-7xl">
        
        <!-- <Notifications> -->
          <Router {routes} />
        <!-- </Notifications> -->
      </div>
    </div>
  </div>

</main>