<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import Router from "svelte-spa-router";
    import { wrap } from "svelte-spa-router/wrap";
    import { location } from "svelte-spa-router";
    import DisplayNfTs from "./pages/DisplayNFTs.svelte";

    import Home from "./pages/Home.svelte";
    import LoginPage from "./pages/LoginPage.svelte";
    import { assertGameRuntimeConfig } from "./config/runtime";
    let backgroundAudio: HTMLAudioElement | null = null;
    let resumeAudioOnGesture: (() => void) | null = null;
    let onVisibilityChange: (() => void) | null = null;
    let isMuted = false;

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
    "/game": wrap({
      asyncComponent: () => import("./pages/GameOn.svelte"),
    }),

    // Catch-all
    // This is optional, but if present it must be the last
    // "*": NotFound,
  };

  $: isGameRoute = $location === "/game";

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
    assertGameRuntimeConfig();

    const trackUrl = encodeURI("/audio/colder still OST thingie 2-23-2026.mp3");
    backgroundAudio = new Audio(trackUrl);
    backgroundAudio.loop = true;
    backgroundAudio.preload = "auto";
    (backgroundAudio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    backgroundAudio.volume = 0.45;
    backgroundAudio.muted = isMuted;

    const startPlayback = async (): Promise<boolean> => {
      try {
        await backgroundAudio?.play();
        return true;
      } catch (error) {
        // If autoplay is blocked, first user gesture will start playback.
        return false;
      }
    };

    void startPlayback();

    resumeAudioOnGesture = async () => {
      const didStart = await startPlayback();
      void attemptLandscapeLock();
      if (didStart && resumeAudioOnGesture) {
        window.removeEventListener("pointerdown", resumeAudioOnGesture);
        window.removeEventListener("touchstart", resumeAudioOnGesture);
        window.removeEventListener("touchend", resumeAudioOnGesture);
        window.removeEventListener("keydown", resumeAudioOnGesture);
        resumeAudioOnGesture = null;
      }
    };

    window.addEventListener("pointerdown", resumeAudioOnGesture);
    window.addEventListener("touchstart", resumeAudioOnGesture);
    window.addEventListener("touchend", resumeAudioOnGesture);
    window.addEventListener("keydown", resumeAudioOnGesture);
    window.addEventListener("focus", resumeAudioOnGesture);
    onVisibilityChange = () => {
      if (!document.hidden) {
        void resumeAudioOnGesture?.();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
  });

  onDestroy(() => {
    if (resumeAudioOnGesture) {
      window.removeEventListener("pointerdown", resumeAudioOnGesture);
      window.removeEventListener("touchstart", resumeAudioOnGesture);
      window.removeEventListener("touchend", resumeAudioOnGesture);
      window.removeEventListener("keydown", resumeAudioOnGesture);
      window.removeEventListener("focus", resumeAudioOnGesture);
    }
    if (onVisibilityChange) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      onVisibilityChange = null;
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
  main {
    width: 100%;
    overflow-x: hidden;
  }

  :global(body) {
    overflow-x: hidden;
  }

  .game-shell {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    min-height: 100dvh;
    background: radial-gradient(circle at 20% 20%, #1b2945 0%, #0e182d 45%, #070d18 100%);
    overflow: hidden;
  }

  .game-content {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: stretch;
    padding: 0;
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

  .game-shell .game-content > .w-full {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 768px) {
    .audio-toggle {
      top: 10px;
      right: 10px;
      padding: 8px 10px;
      font-size: 12px;
    }
  }
</style>
