<script lang="ts">
  import { onMount } from "svelte";
  import {
    Header,
    Controls,
    PipelineCard,
    CartPanel,
    ActivityFeed,
    Console,
    VoiceExperience,
  } from "./lib/components";
  import { createVoiceSession } from "./lib/websocket";

  const voiceSession = createVoiceSession();

  let devMode = $state(
    typeof window !== "undefined" && window.location.hash === "#/dev",
  );

  onMount(() => {
    const sync = (): void => {
      devMode = window.location.hash === "#/dev";
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  });
</script>

{#if devMode}
  <div class="max-w-3xl mx-auto px-4 py-8">
    <Header />
    <Controls
      onStart={() => voiceSession.start()}
      onStop={() => voiceSession.stop()}
    />
    <CartPanel />
    <PipelineCard />
    <ActivityFeed />
    <Console />
    <p class="mt-8 text-center text-sm">
      <a
        class="text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-800"
        href="#/"
      >
        ← Voice experience
      </a>
    </p>
  </div>
{:else}
  <VoiceExperience
    onStart={() => voiceSession.start()}
    onStop={() => voiceSession.stop()}
  />
{/if}
