<template>
  <div class="ft-qa-chat" :style="mutualStyle">
    <div
      :class="{
        'default-mutual': true,
        ...componentClasses
      }"
      ref="mutual"
      v-show="!showAIChatBox || isBuild.value"
      @click.stop="(handleClick(dataChart[0]), handleEncodes(dataChart[0]))"
    />
    <template v-if="option.aiChatShow">
      <div class="ai-chat-qa-layout" v-show="showAIChatBox">
        <aiChatQA
          :element="props.element"
          :qaUrl="option.qaUrl"
          :questionAsk="option.questionAsk"
          :defaultAsk="option.defaultAsk"
          :chatStyle="aiChatStyle"
          :textStyle="aiTextStyle"
        />

        <Icon
          type="iconfont-chahao"
          class="trigger-close iconfont-chahao"
          :style="aiCloseStyle"
          @click.stop="handleClose"
        />
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import Icon from "@editor/base/Icon/index.vue";
import { sleep } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import aiChatQA from "./aiChatQA/index.vue";
import { useQaChat } from "./useQaChat";

interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();
const {
  eventStatus,
  encodeStatus,
  showAIChatBox,
  aiChatStyle,
  aiTextStyle,
  mutualStyle,
  aiCloseStyle,
  isBuild,
  dataChart,
  option,
  componentClasses,
  handleEventAndCallbackEvent,
  handleEncode,
  getAnimationType
} = useQaChat(props.element);

watch(
  () => dataChart.value,
  (val) => {
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.DataChange,
      events: props.element.events,
      isExecuteOnlyConditionSatisfied: false,
      throwValue: val[0]
    });
  }
);

watch(
  () => option.value.aiChatShow,
  (v) => {
    if (isBuild.value) {
      showAIChatBox.value = v;
    }
  }
);

const mutual = ref<HTMLDivElement | null>(null);

const handleClose = () => {
  if (!isBuild.value) {
    showAIChatBox.value = false;
  }
};
// 交互
const handleClick = async (info: any, isExecuteOnlyConditionSatisfied = false) => {
  if (eventStatus.value) return;
  showAIChatBox.value = !showAIChatBox.value;
  eventStatus.value = true;
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,
    isExecuteOnlyConditionSatisfied,
    throwValue: info
  });
  if (mutual.value) {
    const eventType = getAnimationType(mutual.value as HTMLDivElement);
    mutual.value.classList.add("has-bubble");
    const handleAnimationEnd = () => {
      if (mutual.value) {
        mutual.value.removeEventListener(eventType, handleAnimationEnd);
        mutual.value.classList.remove("has-bubble");
      }
    };

    mutual.value.addEventListener(eventType, handleAnimationEnd, false);
  }

  await sleep(500);
  eventStatus.value = false;
};
// 终端
const handleEncodes = async (info: any) => {
  if (encodeStatus.value) return;
  encodeStatus.value = true;
  handleEncode(info);
  await sleep(500);
  encodeStatus.value = false;
};

onMounted(() => {
  if (isBuild.value) {
    showAIChatBox.value = option.value.aiChatShow;
    return;
  }
});

onBeforeUnmount(() => {
  eventStatus.value = false;
  encodeStatus.value = false;
});
</script>
<style lang="scss" scoped>
.ft-qa-chat {
  position: relative;
  width: 100%;
  height: 100%;
  color: aliceblue;
  font-size: 24px;
  .ai-chat-qa-layout {
    position: absolute;
    top: 0;
    left: 100%;
    animation: slideRight 0.5s ease-in;
    .trigger-close {
      font-size: 18px;
      color: #b4b7c1;
      cursor: pointer;
      position: absolute;
      top: 10px;
      right: 10px;
    }
    @keyframes slideRight {
      0% {
        opacity: 0;
        transform: translateX(100%);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }
  .default-mutual {
    width: 100%;
    height: 100%;
    cursor: pointer;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-image: url("./assets/AI_QA.png");
    &:hover {
      background-image: url("./assets/AI_QA_hover.png");
    }
  }
}
</style>
