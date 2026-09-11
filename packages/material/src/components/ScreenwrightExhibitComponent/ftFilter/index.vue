<template>
  <div
    class="ft-filter"
    ref="ftFilterRef"
    :style="{
      ...getBackgroundStyle,
      ...getFrostedStyle,
      ...getClipPathStyle,
      ...borderStyle
    }"
  >
    <div
      class="glass-bg"
      v-if="isGradient"
      :style="{
        ...glassFilter,
        ...directGetBackgroundStyle
      }"
    />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :width="element.component.width"
      :height="element.component.height"
      viewBox="0 0 400 400"
      v-if="element.option.shape === 'custom' && path"
    >
      <defs>
        <clipPath :id="`${props.element.id}-svg`">
          <path :d="path" />
        </clipPath>
      </defs>
    </svg>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { lineargradientHandle } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";

interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();
const path = ref("");

const getFilterAttrs = (props: Record<string, any>, attrs: string, value: number) => {
  if (props.show) {
    return `${attrs}(${value || 100}%)`;
  }
  return "";
};

const getBrightness = computed(() => {
  const brightness = props.element.option.brightness;
  return getFilterAttrs(brightness, "brightness", brightness.value);
});

const getContras = computed(() => {
  const contrast = props.element.option.contras;
  return getFilterAttrs(contrast, "contrast", contrast.value);
});
const getGrayscale = computed(() => {
  const grayscale = props.element.option.grayscale;
  return getFilterAttrs(grayscale, "grayscale", grayscale.value);
});
const getHueRotate = computed(() => {
  const hueRotate = props.element.option.hueRotate;
  return hueRotate.show ? `hue-rotate(${hueRotate.value || 0}deg)` : "";
});
const getInvert = computed(() => {
  const invert = props.element.option.invert;
  return getFilterAttrs(invert, "invert", invert.value);
});

// const getSaturate = computed(() => {
//   const saturate = props.element.option.saturate
//   return getFilterAttrs(saturate, "saturate", saturate.value)
// })
const getSepia = computed(() => {
  const sepia = props.element.option.sepia;
  return getFilterAttrs(sepia, "sepia", sepia.value);
});
const getBlurStyle = computed(() => {
  const blur = props.element.option.blur;
  const saturate = props.element.option.saturate;
  const showSaturate = props.element.option.saturate.show;

  if (blur.show && !isGradient.value) {
    return {
      filter: showSaturate
        ? `blur(${blur.value || 0}px) saturate(${saturate.value || 100}%)`
        : `blur(${blur.value || 0}px)`
    };
  }
  return {};
});

const getClipPathStyle = computed(() => {
  const shape = props.element.option.shape;
  const clipPathMap: Record<string, any> = {
    circle: " ellipse(farthest-side farthest-side at 50% 50%)",
    triangle: " polygon(0px 100%, 100% 100%, 50% 0%)",
    custom: `url("#${props.element.id}-svg")`
  };
  const clipPath = clipPathMap[shape] || "";
  return clipPath ? { "clip-path": clipPath } : {};
});

const borderStyle = computed(() => {
  const shape = props.element.option.shape;
  //  border: "1px solid transparent"
  if (shape === "rectangle") {
    return {
      "border-radius": `${props.element.option.borderRadius}px`
    };
  }
  return {};
});
const isGradient = computed(() => {
  const backdropFilter = props.element.option.backdropFilter || {};
  const isGradient = backdropFilter.isGradient;
  return isGradient;
});
const glassFilter = computed(() => {
  const backdropFilter = props.element.option.backdropFilter;
  const backdropFilterBlur = backdropFilter.blur;
  const backdropFilterSaturate = backdropFilter.saturate;
  return isGradient.value
    ? {
        "backdrop-filter": `blur(${backdropFilterBlur || 0}px) saturate(${backdropFilterSaturate || 100}%)`
      }
    : {};
});

const ftFilterRef = ref();

watch(
  () => isGradient.value,
  () => {
    if (isGradient.value) {
      ftFilterRef.value.style.display = "none";
      setTimeout(() => {
        ftFilterRef.value.style.display = "block";
      }, 0);
    }
  }
);

const backdropFilterBlueStyle = computed(() => {
  const backdropFilter = props.element.option.backdropFilter;
  const isGradient = backdropFilter.isGradient;
  const backdropFilterBlur = backdropFilter.blur;
  const backdropFilterSaturate = backdropFilter.saturate;
  return isGradient ? "" : `blur(${backdropFilterBlur || 0}px) saturate(${backdropFilterSaturate || 100}%)`;
});

const getFrostedStyle = computed(() => {
  const backdropFilter = props.element.option.backdropFilter;
  const backdropFilterShow = backdropFilter.show;
  const filterShow = [
    getBrightness.value,
    getContras.value,
    getGrayscale.value,
    getHueRotate.value,
    getInvert.value,
    getSepia.value
  ]
    .filter((v) => v && v.length > 0)
    .join(" ");
  const backdropFilterStyle = isGradient.value
    ? { "backdrop-filter": `${filterShow}` }
    : {
        "backdrop-filter": `${filterShow} ${backdropFilterBlueStyle.value}`
      };
  const filterStyle = getBlurStyle.value;
  const assignStyle = { ...filterStyle, ...backdropFilterStyle };
  return backdropFilterShow ? assignStyle : {};
});

const getBackgroundStyle = computed(() => {
  const backdropFilter = props.element.option.backdropFilter;
  const isGradient = backdropFilter.isGradient;
  const background = lineargradientHandle(backdropFilter.background);
  return isGradient ? { backgroundImage: `${background}` } : { background: "rgba(255, 255, 255, 0.1)" };
});
function extractGradientAngle(gradientString: string) {
  // 正则表达式匹配linear-gradient中的角度值
  // 匹配格式: linear-gradient(角度, ...)
  const angleRegex = /linear-gradient\(\s*(\d+)deg\s*,/i;

  // 执行匹配
  const match = gradientString.match(angleRegex);

  // 如果匹配成功则返回数字类型的角度，否则返回null
  return match ? Number(match[1]) : null;
}

const directGetBackgroundStyle = computed(() => {
  const backdropFilter = props.element.option.backdropFilter;
  const isGradient = backdropFilter.isGradient;
  const background = lineargradientHandle(backdropFilter.background);
  const deg = extractGradientAngle(background);

  // 默认方向为向右
  let direction = "to right";

  if (deg !== null) {
    // 标准化角度（确保在0-360度范围内）
    const normalizedDeg = ((deg % 360) + 360) % 360;
    // 根据角度范围判断方向
    if (normalizedDeg >= 45 && normalizedDeg < 135) {
      // 45-134度之间视为向右（接近90度）
      direction = "to right";
    } else if (normalizedDeg >= 135 && normalizedDeg < 225) {
      // 135-224度之间视为向下（接近180度）
      direction = "to bottom";
    } else if (normalizedDeg >= 225 && normalizedDeg < 315) {
      // 225-314度之间视为向左（接近270度）
      direction = "to left";
    } else {
      // 315-360度和0-44度之间视为向上（接近0度）
      direction = "to top";
    }
  }

  return isGradient
    ? {
        "mask-image": `linear-gradient(${direction}, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.85) 65%, rgba(0, 0, 0, 0) 100%)`,
        "-webkit-mask-image": `linear-gradient(${direction}, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.85) 65%, rgba(0, 0, 0, 0) 100%)`
      }
    : {};
});

const getCustomShapePath = async () => {
  const shape = props.element.option.shape;
  if (shape === "custom") {
    path.value = props.element.option.path;
  }
};
watch(
  () => props.element.option.path,
  async (val: string) => {
    console.log(val, "valval");
    path.value = val;
  }
);
watch(
  () => props.element.option.shape,
  async (val: string) => {
    if (!val) {
      return;
    }
    getCustomShapePath();
  }
);

onMounted(() => {
  getCustomShapePath();
});
</script>
<style lang="scss" scoped>
.ft-filter {
  width: 100%;
  height: 100%;
  // background-color: rgba(255, 255, 255, 0.1);
  clip-path: none;
  border-radius: 0px;

  position: relative;
  .glass-bg {
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    opacity: 1;
    z-index: 888;

    // backdrop-filter: blur(10px);
    mask-image: linear-gradient(to right, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.85) 65%, rgba(0, 0, 0, 0) 100%);
    -webkit-mask-image: linear-gradient(to right, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.85) 65%, rgba(0, 0, 0, 0) 100%);
  }
}
</style>
