<template>
  <div
    :style="{ width: `${width}px`, height: `${height}px` }"
    class="ft-multiLine-content-wrapper"
  >
    <!-- overflow: scroll ? 'hidden' : 'auto' -->
    <div class="ft-multiLine-content" ref="mainRef" :style="{ ...styleBox }">
      <template v-if="option.whiteSpace">
        <div
          class="flex flex-align-center"
          v-for="(item, index) in inputData"
          :key="index"
        >
          <img
            :style="prefixIconStyle"
            class="prefixIcon"
            v-if="item.src || option.icon"
            :src="setMinioUrl(item.src || option.icon)"
          />
          <span
            :style="styleName"
            ref="text"
            class="text-list flex ft-multiLine-text"
          >
            <bdo
              :dir="diraction === 'ToRight' ? 'rtl' : 'ltr'"
              v-html="item.name"
              :data-translate="item.name"
            />
          </span>
        </div>
      </template>
      <template v-else>
        <span
          :style="styleName"
          ref="text"
          class="text-list flex ft-multiLine-text"
          v-for="(item, index) in inputData"
          :key="index"
        >
          <img
            :style="prefixIconStyle"
            class="prefixIcon"
            v-if="item.src || option.icon"
            :src="setMinioUrl(item.src || option.icon)"
          />
          <bdo
            :dir="diraction === 'ToRight' ? 'rtl' : 'ltr'"
            v-html="item.name"
            :data-translate="item.name"
          />
        </span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { getAlign, lineargradientHandle } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";

import { setMinioUrl } from "@material/minioUrl";
import { useBaseData } from "@screenwright/composables";

defineOptions({
  name: "ftMultiLine",
});
const props = defineProps<{
  element: ComponentType;
}>();
const {
  option,
  width,
  height,
  dataChart: inputData,
} = useBaseData(props.element);
const mainRef = ref<HTMLElement>();
const scrollText = ref<number>();
const left = ref(0);
const top = ref(0);
const delta = ref(0);

// 计算属性
const diraction = computed(() => option.value.textDeraction);
// const scroll = computed(() => option.value.scroll ?? false);
const speed = computed(() => option.value.speed || 100);

const textAlignVertical = computed(() => {
  return getAlign(option.value.textAlignVertical);
});

const styleName = computed(() => {
  let resultColor;
  console.log(option.value.selectedTextColor, "option.value.selectedTextColor");
  if (option.value.selectedTextType === "normal") {
    resultColor = {
      color: option.value.color || "rgba(255, 255, 255, 1)",
      backgroundColor: option.value.backgroundColor,
    };
  } else {
    resultColor = {
      "background-clip": "text",
      "-webkit-background-clip": "text",
      "-webkit-text-fill-color": "transparent",
      backgroundImage: lineargradientHandle(option.value.selectedTextColor),
    };
  }

  return {
    ...resultColor,
    flex: 1,
    letterSpacing: `${option.value.split}px`,
    fontFamily:
      option.value.fontFamily ||
      "Source Han Sans CN-Normal, Source Han Sans CN",
    fontSize: `${option.value.fontSize}px`,
    fontWeight: option.value.fontWeight || "normal",
    fontStyle: option.value.fontStyle || "normal",
    lineHeight: `${option.value.lineHeight}px`,
    textAlign: option.value.textAlign,
    textIndent: `${option.value?.textIndent || 0}px`,
    filter: option.value.shadowShow
      ? `drop-shadow(${option.value.shadowX || 0}px
          ${option.value.shadowY || 0}px
          ${option.value.shadowFuzzy || 0}px ${option.value.shadowColor})`
      : "",
    display: option.value.whiteSpace ? "block" : "inline",
    whiteSpace: option.value.whiteSpace ? "pre-wrap" : "nowrap",
    padding: `${option.value.lineMarginTop}px ${option.value.lineMarginRight}px ${option.value.lineMarginBottom}px ${option.value.lineMarginLeft}px`,
  };
});

const styleBox = computed<CSSProperties>(() => ({
  display: "flex",
  flexDirection: option.value.whiteSpace ? "column" : "row",
  width: "100%",
  height: "100%",
  textAlign: option.value.textAlign || "center",
  lineHeight: option.value.lineHeight || "normal",
  justifyContent: option.value.whiteSpace ? textAlignVertical.value : "",
  alignItems: option.value.whiteSpace ? "" : textAlignVertical.value,
}));

const prefixIconStyle = computed<CSSProperties>(() => ({
  width: `${option.value.iconWidth}px`,
  height: `${option.value.iconHeight}px`,
  margin: option.value.iconMargin?.map((item: any) => `${item}px`).join(" "),
}));

// 方法
const cancelAnimation = () => {
  if (scrollText.value) {
    cancelAnimationFrame(scrollText.value);
  }
};

const moveUpDown = () => {
  if (!mainRef.value) {
    cancelAnimation();
    return;
  }

  mainRef.value.style.transform = `

  (0px)`;
  if (option.value.textDeraction === "ToLeft") {
    if (left.value <= -mainRef.value?.children[0].scrollWidth) {
      left.value = width.value;
    } else {
      left.value -= delta.value * 10;
    }
  } else if (option.value.textDeraction === "ToRight") {
    if (left.value >= mainRef.value?.children[0].scrollWidth) {
      left.value = -mainRef.value?.children[0].scrollWidth;
    } else {
      left.value += delta.value * 10;
    }
  }
  mainRef.value.style.transform = `translateX(${left.value}px)`;
  scrollText.value = requestAnimationFrame(moveUpDown);
};

const moveAbout = () => {
  if (!mainRef.value) {
    cancelAnimation();
    return;
  }

  if (option.value.textDeraction === "ToTop") {
    if (top.value <= -mainRef.value?.children[0].clientHeight) {
      top.value = height.value;
    } else {
      top.value -= delta.value * 10;
    }
  } else if (option.value.textDeraction === "ToBottom") {
    if (top.value >= height.value) {
      top.value = -mainRef.value?.children[0].clientHeight;
    } else {
      top.value += delta.value * 10;
    }
  }
  mainRef.value.style.transform = `translateY(${top.value}px)`;
  scrollText.value = requestAnimationFrame(moveAbout);
};
// 初始化scroll
const initScroll = () => {
  cancelAnimation();
  if (!option.value.scroll) return;

  delta.value = 1 / (speed.value > 1 ? speed.value : 1);
  // console.log("initScroll",., mainRef.value?.clientWidth, mainRef.value?.clientHeight);

  switch (option.value.textDeraction) {
    case "ToLeft":
    case "ToRight":
      top.value = 0;
      if (mainRef.value) {
        mainRef.value.style.transform = `translateY(${top.value}px)`;
      }
      scrollText.value = requestAnimationFrame(moveUpDown);
      break;
    case "ToTop":
    case "ToBottom":
      left.value = 0;
      if (mainRef.value) {
        mainRef.value.style.transform = `translateX(${left.value}px)`;
      }
      scrollText.value = requestAnimationFrame(moveAbout);
      break;
  }
};

// 监听
watch(
  () => option.value.scroll,
  (newVal) => {
    if (!newVal) {
      top.value = 0;
      left.value = 0;
      if (mainRef.value) {
        mainRef.value.style.transform = `translateX(${left.value}px)`;
        mainRef.value.style.transform = `translateY(${top.value}px)`;
      }
      cancelAnimation();
    } else {
      initScroll();
    }
  },
);

watch(
  () => option.value.speed,
  () => {
    initScroll();
  },
);

watch(
  () => option.value.textDeraction,
  () => {
    initScroll();
  },
);

// 生命周期
onMounted(() => {
  initScroll();
});

onBeforeUnmount(() => {
  cancelAnimation();
});
</script>

<style lang="scss" scoped>
.ft-multiLine-content-wrapper {
  overflow: hidden !important;
}
.ft-multiLine {
  width: 100%;
  display: inline-flex;
  white-space: nowrap;
}
</style>
