<template>
  <div class="ft-carousel-image-v2">
    <div id="wowslider-container" ref="wowsliderContainerRef">
      <div class="ws_images">
        <ul>
          <li v-for="item in element.option.imageList" :key="item.id">
            <img :src="setMinioUrl(item.src)" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();
const { isBuild } = useBaseData(props.element);

const wowsliderContainerRef = ref<HTMLDivElement | null>(null);

let _wowSlider: any = null;
const initWowSlider = () => {
  const { effects, duration, delay, loop, autoPlay } = props.element.option;
  const $container = (window as any).$("#wowslider-container");
  console.log($container, "$container");
  if (!$container) return;
  _wowSlider = $container.wowSlider({
    effect: effects || "blinds",
    prev: "",
    next: "",
    duration,
    delay,
    autoPlay,
    loop,
    controls: false,
    autoPlayVideo: false,
    stopOnHover: true,
    bullets: false,
    caption: false,
    captionEffect: false,
    fullScreen: true,
    support: { transform: true, perspective: true, transition: true }
  });
};
onBeforeUnmount(() => {
  if (_wowSlider) {
    _wowSlider = null;
  }
});
onMounted(() => {
  if (!isBuild.value) {
    initWowSlider();
  }
});
</script>
<style lang="scss" scoped>
.ft-carousel-image-v2 {
  overflow: hidden;
  width: 100%;
  height: 100%;
  > div {
    width: 100%;
    height: 100%;
  }
  #wowslider-container {
    zoom: 1;
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0px auto 0px;
    border: none;
    text-align: left;
    font-size: 10px;
    ul {
      position: relative;
      width: 10000%;
      height: 100%;
      left: 0;
      list-style: none;
      margin: 0;
      padding: 0;
      border-spacing: 0;
      overflow: visible;
      li {
        position: relative;
        width: 1%;
        height: 100%;
        line-height: 0; /*opera*/
        overflow: hidden;
        float: left;
        font-size: 0;
        padding: 0 0 0 0 !important;
        margin: 0 0 0 0 !important;
      }
    }
    .ws_images {
      position: relative;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      img {
        width: 100%;
        height: 100% !important;
        border: none 0;
        max-width: none;
        padding: 0;
        margin: 0;
      }
      iframe {
        position: absolute;
        z-index: -1;
      }
    }
    .ws_bullets {
      float: left;
      position: absolute;
      z-index: 70;
      padding: 10px;
      display: none;
      & > div {
        position: relative;
        float: left;
        font-size: 0px;
      }
      a {
        margin-left: 16px;
        width: 12px;
        height: 12px;
        float: left;
        text-indent: -4000px;
        position: relative;
        background: rgba(30, 165, 194, 0.5);
        -webkit-border-radius: 50%;
        -moz-border-radius: 50%;
        border-radius: 50%;
      }
      a:hover {
        -webkit-animation: pulseIn 0.9s infinite linear;
        -moz-animation: pulseIn 0.9s infinite linear;
        animation: pulseIn 0.9s infinite linear;
      }
      @keyframes pulseIn {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
        }
      }
    }
    .ws_prev,
    .ws_next {
      position: absolute;
      display: none;
      text-shadow: none;
      text-align: center;
      background: rgb(30, 165, 194);
      top: 50%;
      margin-top: -25px;
      height: 50px;
      width: 50px;
      z-index: 60;
      -webkit-border-radius: 50%;
      -moz-border-radius: 50%;
      border-radius: 50%;
      &:hover {
        background: rgba(30, 165, 194, 0.6);
      }
    }
    .ws_prev {
      left: 10px;
    }
    .ws_next {
      right: 10px;
    }
  }
}
</style>
