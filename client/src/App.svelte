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
    let isPortraitMobile = false;

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

  function updateOrientationState() {
    if (typeof window === "undefined") {
      return;
    }
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
    const portrait = window.matchMedia("(orientation: portrait)").matches;
    isPortraitMobile = isTouchDevice && portrait;
  }

  async function attemptLandscapeLock() {
    if (typeof window === "undefined" || !isGameRoute) {
      return;
    }
    try {
      const orientationApi = (screen as any).orientation;
      if (orientationApi?.lock) {
        await orientationApi.lock("landscape");
      }
    } catch {
      // Some mobile browsers (especially iOS Safari) do not allow programmatic lock.
    }
  }

  $: if (isGameRoute) {
    void attemptLandscapeLock();
  }

  onMount(() => {
    const trackUrl = encodeURI("/audio/colder still OST thingie 2-23-2026.mp3");
    backgroundAudio = new Audio(trackUrl);
    backgroundAudio.loop = true;
    backgroundAudio.preload = "auto";
    backgroundAudio.playsInline = true;
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
      void attemptLandscapeLock();
      if (resumeAudioOnGesture) {
        window.removeEventListener("pointerdown", resumeAudioOnGesture);
        window.removeEventListener("touchstart", resumeAudioOnGesture);
        window.removeEventListener("touchend", resumeAudioOnGesture);
        window.removeEventListener("keydown", resumeAudioOnGesture);
        resumeAudioOnGesture = null;
      }
    };

    updateOrientationState();
    window.addEventListener("resize", updateOrientationState);
    window.addEventListener("orientationchange", updateOrientationState);
    window.addEventListener("pointerdown", resumeAudioOnGesture);
    window.addEventListener("touchstart", resumeAudioOnGesture);
    window.addEventListener("touchend", resumeAudioOnGesture);
    window.addEventListener("keydown", resumeAudioOnGesture);
  });

  onDestroy(() => {
    if (resumeAudioOnGesture) {
      window.removeEventListener("pointerdown", resumeAudioOnGesture);
      window.removeEventListener("touchstart", resumeAudioOnGesture);
      window.removeEventListener("touchend", resumeAudioOnGesture);
      window.removeEventListener("keydown", resumeAudioOnGesture);
    }
    window.removeEventListener("resize", updateOrientationState);
    window.removeEventListener("orientationchange", updateOrientationState);
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

  {#if isGameRoute && isPortraitMobile}
    <div class="rotate-overlay">
      <div class="rotate-card">
        <h3>Rotate Device</h3>
        <p>Use landscape orientation for gameplay.</p>
      </div>
    </div>
  {/if}
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

  .rotate-overlay {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    background: rgba(5, 10, 20, 0.84);
    backdrop-filter: blur(2px);
  }

  .rotate-card {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(16, 26, 46, 0.92);
    color: #e8f2ff;
    border-radius: 14px;
    padding: 20px 24px;
    text-align: center;
    width: min(320px, 85vw);
  }

  .rotate-card h3 {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 800;
  }

  .rotate-card p {
    margin: 0;
    color: #c4d9f7;
  }
</style>
