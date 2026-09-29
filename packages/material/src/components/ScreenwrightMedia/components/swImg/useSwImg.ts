import type { CSSProperties } from "vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { useBaseData, useFrostedStyle } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { upgradeSwimgOption } from "@screenwright/types";
// 注：SwimgOption 类型只能从 "@screenwright/types/schemas" 子路径导入 —— 包根 index.d.ts 里
// `export * from './schemas'` 与同名的 dist/schemas.js 产物撞名，导致该路径下的类型在包根解析不到
// （运行时值导出不受影响，upgradeSwimgOption 从包根导入正常）。这是 @screenwright/types 构建产物的
// 已知问题，不在本次 swimg 组件迁移范围内，这里绕开即可。
import type { SwimgOption } from "@screenwright/types/schemas";

import "@material/styles/atomicPresetAnimations.css";

/**
 * option.filter 在新 schema 里已经是完整的 CSS filter 字符串，直接透传。
 */
export const buildFilterStyle = (option: SwimgOption): CSSProperties => {
  return { filter: option.filter };
};

/**
 * option.transform 在新 schema 里已经是完整的 CSS transform 字符串，直接透传。
 */
export const buildTransformStyle = (option: SwimgOption): CSSProperties => {
  return { transform: option.transform };
};

/**
 * option.animation 为 CSS animation 简写（关键帧名取内置预设），直接映射到样式。
 * 没有 animation 时返回空对象，避免覆盖其他样式来源。
 */
export const buildAnimationStyle = (option: SwimgOption): CSSProperties => {
  if (!option.animation) return {};
  return {
    animation: option.animation,
    WebkitAnimation: option.animation
  };
};

/** keyframes 播放的默认时长/循环次数，schema 未提供单独的时长字段时使用 */
const DEFAULT_KEYFRAMES_OPTIONS: KeyframeAnimationOptions = {
  duration: 1000,
  iterations: Infinity
};

export function useSwImg(element: ComponentType) {
  const rawBase = useBaseData(element);
  const { dataChart, isBuild, clickFormatter } = rawBase;
  const { getFrostedStyle } = useFrostedStyle(element);

  // 归一化 option：兼容旧数据格式，对已是当前格式的数据是恒等操作
  const option = computed<SwimgOption>(
    () => upgradeSwimgOption(rawBase.option.value as Record<string, unknown>) as SwimgOption
  );

  const imgBoxRef = ref<HTMLDivElement | null>(null);
  const imageRef = ref<HTMLImageElement | null>(null);
  const dataChartItem = ref<Record<string, any>>({});
  const customizeAnimationPlayer = ref<Animation | null>(null);

  const bgStyle = computed<CSSProperties>(() => ({
    background: option.value.background
  }));

  const mergedStyle = computed<CSSProperties>(() => ({
    ...bgStyle.value,
    ...buildAnimationStyle(option.value),
    minHeight: "100%",
    minWidth: "100%"
  }));

  const styleImgBoxName = computed<CSSProperties>(() => ({
    objectFit: option.value.objectFit || "fill",
    opacity: option.value.opacity,
    borderRadius: option.value.borderRadius,
    mixBlendMode: option.value.mixBlendMode as CSSProperties["mixBlendMode"],
    pointerEvents: option.value.pointerEvents ? "auto" : "none",
    transition: option.value.transition,
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    ...buildFilterStyle(option.value),
    ...buildTransformStyle(option.value)
  }));

  const clearCustomizeAnimation = () => {
    if (customizeAnimationPlayer.value) {
      customizeAnimationPlayer.value.cancel();
      customizeAnimationPlayer.value = null;
    }
  };

  // keyframes 存在时走 Web Animations API，独立于 CSS animation 简写
  const playKeyframesAnimation = () => {
    clearCustomizeAnimation();
    const keyframes = option.value.keyframes;
    if (!keyframes || !keyframes.length || !imageRef.value) return;
    customizeAnimationPlayer.value = imageRef.value.animate(
      keyframes as Keyframe[],
      DEFAULT_KEYFRAMES_OPTIONS
    );
  };

  const handleClick = () => {
    if (clickFormatter) {
      clickFormatter({
        data: dataChartItem.value
      });
    }
  };

  watch(
    () => dataChart.value,
    (nv, ov) => {
      const nextItem = Array.isArray(nv) ? (nv.length ? nv[0] : nv) : nv;
      const prevItem = Array.isArray(ov) ? (ov && ov.length ? ov[0] : ov) : ov;

      if (
        nextItem &&
        prevItem &&
        typeof nextItem === "object" &&
        typeof prevItem === "object" &&
        "value" in nextItem &&
        "value" in prevItem &&
        (nextItem as any).value === (prevItem as any).value
      ) {
        return;
      }

      dataChartItem.value = nextItem as any;
    },
    { immediate: true }
  );

  watch(
    () => option.value.keyframes,
    () => {
      playKeyframesAnimation();
    }
  );

  onMounted(async () => {
    await nextTick();
    playKeyframesAnimation();
  });

  onBeforeUnmount(() => {
    clearCustomizeAnimation();
  });

  return {
    option,
    dataChart,
    dataChartItem,
    isBuild,
    imgBoxRef,
    imageRef,
    getFrostedStyle,
    mergedStyle,
    styleImgBoxName,
    handleClick
  };
}
