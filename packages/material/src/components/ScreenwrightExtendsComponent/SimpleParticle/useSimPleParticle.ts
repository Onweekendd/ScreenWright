import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { computed, ref } from "vue";

// 定义星星对象的接口
interface Star {
  x: number;
  y: number;
  speed: number;
  color: number;
}

export const useSimPleParticle = (options: ComponentType) => {
  const { styleSizeName, option, width, height } = useBaseData(options);

  const canvasCtx = ref<CanvasRenderingContext2D | null>(null);
  const stars = ref<Star[]>([]);
  const timer = ref<number | null>(null);

  const STAR_SIZE = computed(() => option.value.size);
  const MAX_STARS = computed(() => option.value.number || 250);
  const STAR_COLORS = computed(
    () =>
      option.value.colorList.map((a: any) => a.color) || [
        "#444",
        "#888",
        "#FFF",
      ],
  );

  return {
    styleSizeName,
    option,
    width,
    height,
    STAR_SIZE,
    MAX_STARS,
    STAR_COLORS,
    stars,
    timer,
    canvasCtx,
  };
};
