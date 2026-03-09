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

  /** Performs attempt landscape lock. */
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

  /** Toggles mute. */
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
    class:landing-shell={!isGameRoute}
    class:game-shell={isGameRoute}
    style={!isGameRoute ? "background-image: url('https://www.arweave.net/hNN-l4QsOuWIRWwpOn-VDjso2NsGBW3Mg30p18Gs6zQ?ext=png')" : ""}
  >
    {#if !isGameRoute}
      <div class="landing-overlay" />
    {/if}
    <div class:landing-content={!isGameRoute} class:game-content={isGameRoute}>
      <div class={isGameRoute ? "w-full" : "landing-route"}>
        <Router {routes} />
      </div>
    </div>
  </div>

</main>

<style>
  :global(html),
  :global(body),
  :global(#app) {
    width: 100%;
    max-width: 100%;
    min-height: 100%;
    margin: 0;
    overflow-x: hidden;
  }

  main {
    width: 100%;
    overflow-x: hidden;
  }

  .landing-shell {
    position: relative;
    width: 100%;
    min-height: 100dvh;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: cover;
  }

  .landing-overlay {
    position: absolute;
    inset: 0;
    background: rgba(8, 16, 28, 0.44);
    pointer-events: none;
  }

  .landing-content {
    position: relative;
    z-index: 1;
    width: 100%;
    min-height: 100dvh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    box-sizing: border-box;
  }

  .landing-route {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    margin: 0 auto;
    padding-left: 10px;
    padding-right: 10px;
    padding-left: calc(env(safe-area-inset-left) + 10px);
    padding-right: calc(env(safe-area-inset-right) + 10px);
    box-sizing: border-box;
    text-align: center;
    color: var(--theme-text);
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
    border: 1px solid var(--theme-border);
    background: var(--theme-panel-strong);
    color: var(--theme-button-text);
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

    .landing-route {
      padding-left: 6px;
      padding-right: 6px;
      padding-left: calc(env(safe-area-inset-left) + 6px);
      padding-right: calc(env(safe-area-inset-right) + 6px);
    }
  }
</style>
