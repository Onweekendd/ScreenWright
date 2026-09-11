<template>
  <div class="ft-flex-decoration" :style="{ opacity: getOpacityGlobal }">
    <div class="rect-deco" v-if="getType === 'corner'">
      <div class="rect-deco-top">
        <div class="rect-tl" :style="{ ...getTLStyle }"><img :src="getTLPic" alt="TL" /></div>
        <div class="rect-tr" :style="{ ...getTRStyle }"><img :src="getTRPic" alt="TR" /></div>
      </div>
      <div class="rect-deco-bottom">
        <div class="rect-bl" :style="{ ...getBLStyle }"><img :src="getBLPic" alt="BL" /></div>
        <div class="rect-br" :style="{ ...getBRStyle }"><img :src="getBRPic" alt="BR" /></div>
      </div>
    </div>

    <div class="line-deco" v-else :class="{ 'turn-right': getLineFlexDirection === 'column' }">
      <div class="line-deco-wrap">
        <div class="line-left" :style="{ ...getLineLeftStyle }">
          <img :src="getLineLeftPic" alt="lineLeft" />
        </div>
        <div class="line-body" :style="{ ...getLineBodyStyle, flexDirection: getLineFlexDirection }">
          <img :src="getLineBodyPic" alt="body" :height="getLineBodyPicHeight" />
        </div>
        <div class="line-right" :style="{ ...getLineRightStyle }">
          <img :src="getLineRightPic" alt="lineRight" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();

const getType = computed(() => {
  if (props.element.option.flexType) {
    return props.element.option.flexType;
  }
  return "line";
});

const getLineBodyPic = computed(() => {
  if (props.element.option.lineBodyPic) {
    return setMinioUrl(props.element.option.lineBodyPic);
  }
  return "";
});

const getLineLeftPic = computed(() => {
  if (props.element.option.lineLeftPic) {
    return setMinioUrl(props.element.option.lineLeftPic);
  }
  return "";
});

const getLineRightPic = computed(() => {
  if (props.element.option.lineRightPic) {
    return setMinioUrl(props.element.option.lineRightPic);
  }
  return "";
});

const getLineBodyStyle = computed(() => {
  const percent = props.element.option.lineBodyOpacity;
  const opacity = (100 - percent) / 100;
  const height = props.element.option.lineBodyHeight;
  const leftWidth = props.element.option.lineLeftWidth;
  const rightWidth = props.element.option.lineRightWidth;
  const bodyLength =
    getLineFlexDirection.value === "column" ? props.element.component.height : props.element.component.width;
  return {
    height: `${height}px`,
    opacity,
    width: `${bodyLength - leftWidth - rightWidth}px`
  };
});

const getLineBodyPicHeight = computed(() => {
  return props.element.option.lineBodyHeight + "px";
});

const getLineLeftStyle = computed(() => {
  const percent = props.element.option.lineLeftOpacity;
  const opacity = (100 - percent) / 100;
  const w = props.element.option.lineLeftWidth;
  const h = props.element.option.lineLeftHeight;
  return { height: `${h}px`, width: `${w}px`, opacity };
});

const getLineRightStyle = computed(() => {
  const percent = props.element.option.lineRightOpacity;
  const opacity = (100 - percent) / 100;
  const w = props.element.option.lineRightWidth;
  const h = props.element.option.lineRightHeight;
  return { height: `${h}px`, width: `${w}px`, opacity };
});

const getLineFlexDirection = computed(() => {
  const direction = props.element.option.flexType;
  return direction === "horizontal" ? "row" : "column";
});

const getTLPic = computed(() => {
  if (props.element.option.cornerTLPic) {
    return setMinioUrl(props.element.option.cornerTLPic);
  }
  return "";
});

const getTLStyle = computed(() => {
  const percent = props.element.option.cornerTLOpacity;
  const opacity = (100 - percent) / 100;
  const w = props.element.option.cornerTLWidth;
  const h = props.element.option.cornerTLHeight;
  return { height: `${h}px`, width: `${w}px`, opacity };
});

const getTRStyle = computed(() => {
  const percent = props.element.option.cornerTROpacity;
  const opacity = (100 - percent) / 100;
  const w = props.element.option.cornerTRWidth;
  const h = props.element.option.cornerTRHeight;
  return { height: `${h}px`, width: `${w}px`, opacity };
});

const getBLStyle = computed(() => {
  const percent = props.element.option.cornerBLOpacity;
  const opacity = (100 - percent) / 100;
  const w = props.element.option.cornerBLWidth;
  const h = props.element.option.cornerBLHeight;
  return { height: `${h}px`, width: `${w}px`, opacity };
});

const getBRStyle = computed(() => {
  const percent = props.element.option.cornerBROpacity;
  const opacity = (100 - percent) / 100;
  const w = props.element.option.cornerBRWidth;
  const h = props.element.option.cornerBRHeight;
  return { height: `${h}px`, width: `${w}px`, opacity };
});

const getTRPic = computed(() => {
  if (props.element.option.cornerTRPic) {
    return setMinioUrl(props.element.option.cornerTRPic);
  }
  return "";
});

const getBLPic = computed(() => {
  if (props.element.option.cornerBLPic) {
    return setMinioUrl(props.element.option.cornerBLPic);
  }
  return "";
});

const getBRPic = computed(() => {
  if (props.element.option.cornerBRPic) {
    return setMinioUrl(props.element.option.cornerBRPic);
  }
  return "";
});

const getOpacityGlobal = computed(() => {
  if (props.element.option.opacityGlobal) {
    const percent = props.element.option.opacityGlobal;
    const opacity = (100 - percent) / 100;
    return props.element.option.configType === "preset" ? opacity : 1;
  }
  return 1;
});
</script>

<style scoped lang="scss">
.ft-flex-decoration {
  width: 100%;
  height: 100%;
  position: relative;
}

.line-deco {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  .line-deco-wrap {
    position: relative;
    width: auto;
    height: auto;
    white-space: nowrap;
  }
  .line-left,
  .line-right {
    display: inline-block;
    width: 45px;
    height: 45px;
    opacity: 1;
    transform: rotate(0deg);
    overflow: hidden;
    vertical-align: middle;
    img {
      width: 100%;
      height: 100%;
    }
  }

  .line-body {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    position: relative;
    overflow: hidden;
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
      flex: 1;
    }
  }
}
.turn-right {
  transform: rotate(90deg);
}

.rect-deco {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  flex-direction: column;

  .rect-deco-bottom,
  .rect-deco-top {
    display: flex;
    width: 100%;
    height: auto;
    justify-content: space-between;
  }

  .rect-tl,
  .rect-tr,
  .rect-bl,
  .rect-br {
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
  }

  .rect-deco-top {
    align-items: flex-start;
  }

  .rect-deco-bottom {
    align-items: flex-end;
  }
}
</style>
