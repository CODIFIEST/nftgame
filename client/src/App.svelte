<script lang="ts">
    import { onDestroy, onMount } from "svelte";
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
    let backgroundAudio: HTMLAudioElement | null = null;
    let resumeAudioOnGesture: (() => void) | null = null;
    let isMuted = false;

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

  onMount(() => {
    const trackUrl = encodeURI("/audio/colder still OST thingie 2-23-2026.mp3");
    backgroundAudio = new Audio(trackUrl);
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.45;
    backgroundAudio.muted = isMuted;

    const startPlayback = async () => {
      try {
        await backgroundAudio?.play();
      } catch (error) {
        // If autoplay is blocked, first user gesture will start playback.
      }
    };

    void startPlayback();

    resumeAudioOnGesture = () => {
      void startPlayback();
      if (resumeAudioOnGesture) {
        window.removeEventListener("pointerdown", resumeAudioOnGesture);
        window.removeEventListener("keydown", resumeAudioOnGesture);
        resumeAudioOnGesture = null;
      }
    };

    window.addEventListener("pointerdown", resumeAudioOnGesture);
    window.addEventListener("keydown", resumeAudioOnGesture);
  });

  onDestroy(() => {
    if (resumeAudioOnGesture) {
      window.removeEventListener("pointerdown", resumeAudioOnGesture);
      window.removeEventListener("keydown", resumeAudioOnGesture);
    }
    if (backgroundAudio) {
      backgroundAudio.pause();
      backgroundAudio.currentTime = 0;
      backgroundAudio = null;
    }
  });

  function toggleMute() {
    isMuted = !isMuted;
    if (backgroundAudio) {
      backgroundAudio.muted = isMuted;
    }
  }
</script>

<main>
  <button class="audio-toggle" on:click={toggleMute}>
    {isMuted ? "Unmute" : "Mute"}
  </button>
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

  .audio-toggle {
    position: fixed;
    top: 14px;
    right: 14px;
    z-index: 40;
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: rgba(10, 20, 38, 0.82);
    color: #f8fbff;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    backdrop-filter: blur(4px);
  }
</style>
