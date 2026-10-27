<template>
  <div v-if="showComposer && activeSession" class="empty-canvas-chat build-render-ignore">
    <section class="empty-canvas-chat__content" aria-label="用 AI 开始创作" @pointerdown.stop @keydown.stop>
      <WelcomeScreen
        :is-visible="true"
        :examples="WELCOME_EXAMPLES"
        :capabilities="WELCOME_CAPABILITIES"
        @select="startExample"
      >
        <ChatInput :key="activeSession.sessionId" v-model="inputText" @send="startConversation()" />
      </WelcomeScreen>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from "vue";

import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import { ActiveSessionKey } from "../agentBISessionContext";
import { WELCOME_CAPABILITIES, WELCOME_EXAMPLES } from "../hooks/useWelcomeScreen";
import { useAgentBISessions } from "../useAgentBISessions";
import ChatInput from "./ChatInput.vue";
import WelcomeScreen from "./WelcomeScreen.vue";

const { activeSession, visible } = useAgentBISessions();
const { componentList } = useEditStore();
const { navInfo } = useLargeScreenInfo();
const { loadingScene } = useGlobalLoading();

// Both composers use the same session, including attachments, mode, and draft.
provide(ActiveSessionKey, activeSession);

const showComposer = computed(() => {
  const session = activeSession.value;
  return (
    Number(navInfo.value.id) > 0 &&
    !loadingScene.value &&
    !visible.value &&
    componentList.value.length === 0 &&
    !!session &&
    session.messages.value.length === 0 &&
    !session.isStreaming.value
  );
});

const inputText = computed({
  get: () => activeSession.value?.inputText.value ?? "",
  set: (value: string) => {
    if (activeSession.value) {
      activeSession.value.inputText.value = value;
    }
  }
});

const startConversation = (prompt?: string) => {
  const session = activeSession.value;
  if (!session || session.isStreaming.value || visible.value) {
    return;
  }
  const text = (prompt ?? session.inputText.value).trim();
  if (!text && !session.attachments.value.some((item) => item.status === "pending")) {
    return;
  }
  visible.value = true;
  // Snapshot before ChatInput clears its model after emitting send.
  void session.sendMessage(text);
};

const startExample = (prompt: string) => startConversation(`<welcome>${prompt}</welcome>`);
</script>

<style lang="scss" scoped>
.empty-canvas-chat {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  box-sizing: border-box;
  pointer-events: none;
  z-index: 2;

  &__content {
    width: min(600px, 100%);
    min-width: 0;
    max-height: 100%;
    overflow-y: auto;
    pointer-events: auto;
    color: #e0e6f0;
    text-align: center;
  }

  :deep(.welcome-screen) {
    padding: 0;
    overflow: visible;
  }

  :deep(.box-footer) {
    text-align: left;
  }
}
</style>
