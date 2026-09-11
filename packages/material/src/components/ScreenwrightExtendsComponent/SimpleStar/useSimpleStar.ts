import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, onMounted, ref, watch } from "vue";

interface DotStyle {
  width: string;
  height: string;
  top: string;
  left: string;
}

export const useSimpleStar = (options: ComponentType) => {
  const { isBuild, width, height, option } = useBaseData(options);

  const dotStyleList = ref<DotStyle[]>([]);

  const contentStyle = computed((): CSSProperties => {
    return {
      pointerEvents: isBuild.value ? "none" : "auto",
      width: width + "px",
      height: height + "px",
    };
  });

  const dotStyle = computed((): CSSProperties => {
    return {
      borderRadius: `50%`,
      background: `${option.value.color}`,
      position: "absolute",
    };
  });

  const initDotStyleList = () => {
    const newDotStyleList = [];
    for (let i = 0; i < option.value.dotNum; i++) {
      const radio = getRandomDotRadio();
      newDotStyleList[i] = {
        width: `${radio}px`,
        height: `${radio}px`,
        top: `${getRandomPositionTop()}px`,
        left: `${getRandomPositionLeft()}px`,
      };
    }
    dotStyleList.value = newDotStyleList;
  };

  const getRandomDotRadio = () => {
    return Math.floor(Math.random() * option.value.radio + 1);
  };
  const getRandomPositionLeft = () => {
    return Math.floor(Math.random() * (width.value - option.value.radio));
  };
  const getRandomPositionTop = () => {
    return Math.floor(Math.random() * (height.value - option.value.radio));
  };

  watch(
    () => option.value,
    () => {
      initDotStyleList();
    },
    { deep: true },
  );

  watch(
    () => width.value,
    () => {
      initDotStyleList();
    },
  );

  watch(
    () => height.value,
    () => {
      initDotStyleList();
    },
  );

  onMounted(() => {
    initDotStyleList();
  });

  return {
    contentStyle,
    dotStyleList,
    dotStyle,
  };
};
