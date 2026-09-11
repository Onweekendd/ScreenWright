import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { computed, watch } from "vue";

import type { ImageItem } from "./types";

export const useCurvedTrackList = (element: ComponentType) => {
  const { isBuild, option, handleEventAndCallbackEvent } = useBaseData(element);
  /**
   * px 到 Three.js 世界坐标的转换比例
   * 例如：如果 imageSize 是 [120, 60] px，转换后是 [1.2, 0.6] 世界单位
   * 这个比例可以根据实际显示效果调整
   */
  const PX_TO_WORLD = 0.01;

  interface CurvedTrackOption {
    imageList?: ImageItem[];
    /** 单个图片尺寸（px） */
    imageSize: [number, number];
    /** 相邻图片间距（px） */
    gap: number;
    /** 弧形方向：1 外凸，-1 内凹 */
    curveDirection: 1 | -1;
    /** 弧度强度 */
    curveStrength: number;
    /** 弧形频率 */
    curveFrequency: number;
    /** 滚轮方向：1 向下滚动内容向下，-1 反向 */
    wheelDirection: 1 | -1;
    /** 滚轮速度系数 */
    wheelFactor: number;
    /** 是否禁止滚动，为 true 时鼠标滚轮无法滚动图片 */
    disabledScroll?: boolean;
  }

  // 合并默认配置和父组件传入的 option
  const mergedOption = computed<CurvedTrackOption>(() => ({
    ...option.value,
    disabledScroll: isBuild.value ? true : option.value.disabledScroll,
  }));

  // 把 px 映射到 Three 世界单位
  const imageSizeWorld = computed<[number, number]>(() => [
    mergedOption.value.imageSize[0] * PX_TO_WORLD,
    mergedOption.value.imageSize[1] * PX_TO_WORLD,
  ]);

  const gapWorld = computed<number>(() => mergedOption.value.gap * PX_TO_WORLD);

  watch(
    () => option.value,
    (newValue) => {
      console.log(newValue, option.value);
    },
    { deep: true },
  );

  return {
    mergedOption,
    imageSizeWorld,
    gapWorld,
    handleEventAndCallbackEvent,
  };
};
