<template>
  <div class="video-grid">
    <ul
      :class="{ 'grid-ul': true }"
      :style="{
        height: option.showPage ? 'calc(100% - 40px)' : '100%'
      }"
    >
      <li
        v-for="(item, i) in pageData"
        :key="i"
        class="item-li"
        :style="styleConfig.itemLi"
        @click="$emit('click', item, null)"
      >
        <video-title v-if="shouldShowTopTitle" :item="item" :option="option" :style-config="styleConfig" />
        <div
          class="video-layout flex flex-center"
          ref="videoLayout"
          :style="{
            height: `${option.showVideoIcon ? 'calc(100% - ' + (option.iconHeight || 50) + 'px)' : '100%'}`,
            ...styleVideoBorder
          }"
        >
          <VideoBox
            :video-data="item"
            :option="option"
            :style-config="styleConfig"
            :objectFit="option.objectFit"
            :video-id="`video-${id}-${i}`"
            :element="element"
            :is-build="isBuild"
          />
        </div>
        <video-title v-if="shouldShowBottomTitle" :item="item" :option="option" :style-config="styleConfig" />
      </li>
    </ul>

    <video-pager
      v-if="option.showPage"
      :current="current"
      :page-total="pageTotal"
      :option="option"
      :style-config="styleConfig"
      :element="element"
      @change="$emit('change-page', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { watch } from "vue";
import { nextTick } from "vue";

import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import type { StyleConfig, VideoItem } from "../../types";
import VideoBox from "./VideoBox.vue";
import VideoPager from "./VideoPager.vue";
import VideoTitle from "./VideoTitle.vue";

const props = defineProps<{
  dataList: VideoItem[];
  pageData: VideoItem[];
  option: any;
  current: number;
  pageTotal: number;
  styleConfig: StyleConfig;
  id: number;
  element: ComponentType;
  isBuild: boolean;
}>();

defineEmits<{
  (e: "click", data: VideoItem, index: number | null): void;
  (e: "change-page", index: number): void;
}>();
const videoLayout = ref();

const shouldShowTopTitle = computed(
  () =>
    (props.option.textPosition === "top" && props.option.showVideoIcon) ||
    (!props.option.textPosition && props.option.showVideoIcon)
);

const shouldShowBottomTitle = computed(
  () =>
    (props.option.textPosition === "bottom" && props.option.showVideoIcon) ||
    (!props.option.textPosition && props.option.showVideoIcon)
);
const styleVideoBorder = computed(() => ({
  backgroundSize: `${props.option.borderBgSize || "100% 100%"}`,
  backgroundImage: `url(${setMinioUrl(props.option.borderBgImage)})`
}));
const getAnimationType = (elDom: HTMLElement) => {
  const animations: Record<any, any> = {
    animation: "animationend",
    OAnimation: "oAnimationEnd",
    MozAnimation: "animationend",
    WebkitAnimation: "webkitAnimationEnd"
  };
  for (const i in animations) {
    if (elDom.style[i as any] !== undefined) {
      return animations[i];
    }
  }
};
const setAnimationend = (elDom: HTMLElement) => {
  const eventType = getAnimationType(elDom);
  const handleAnimationend = (event: any) => {
    elDom.removeEventListener(eventType, handleAnimationend);
    event.target.classList.remove(props.option.pagerAni || "fading-ease-in");
  };
  elDom.addEventListener(eventType, handleAnimationend, false);
};
watch(
  () => props.current,
  async () => {
    await nextTick();
    videoLayout.value.forEach((item: HTMLElement) => {
      setAnimationend(item);
      item.classList.add(props.option.pagerAni || "fading-ease-in");
    });
  }
);
</script>

<style lang="scss" scoped>
.video-grid {
  height: 100%;
  width: 100%;

  .grid-ul {
    height: 100%;
    width: 100%;
    list-style: none;
    color: rgb(96, 98, 102);
    overflow: auto;
    padding: 0;
    margin: 0;
    scrollbar-width: none;

    .item-li {
      position: relative;
      margin: 0px 2px 6px 2px;
      float: left;
    }
  }
}
@keyframes fading-ease-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes entrance-in-top {
  0% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%);
  }
  100% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
  }
}
@keyframes entrance-in-bottom {
  0% {
    clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);
  }
  100% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
}
@keyframes entrance-in-right {
  0% {
    clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%);
  }
  100% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
}
@keyframes entrance-in-left {
  0% {
    clip-path: polygon(0 0, 0% 0, 0% 100%, 0 100%);
  }
  100% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
}
.fading-ease-in,
.entrance-in-top,
.entrance-in-bottom,
.entrance-in-right,
.entrance-in-left {
  animation: fading-ease-in 0.6s ease-in;
  animation-fill-mode: forwards;
}
.entrance-in-top {
  animation-name: entrance-in-top;
}
.entrance-in-bottom {
  animation-name: entrance-in-bottom;
}
.entrance-in-right {
  animation-name: entrance-in-right;
}
.entrance-in-left {
  animation-name: entrance-in-left;
}
</style>
