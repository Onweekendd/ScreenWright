import type { CSSProperties, Ref } from "vue";
import { computed, ref } from "vue";
import { useRafFn } from "@vueuse/core";

import { setMinioUrl } from "@material/minioUrl";

interface CollectionOptions {
  speed: number;
  scroll: boolean;
  speedPosition: "ToLeft" | "ToRight";
  cardLen: number;
  cardMarginRight: number;
  cardBackgroundType: "color" | "image";
  cardBackgroundColor: string;
  cardBackgroundImage: string;
  cardBgObjectFit: string;
  cardObjectFit: string;
  cardPadding: number[];
  titleWidth: number;
  titleHeight: number;
  color: string;
  fontSize: number;
  fontWeight: string | number;
  fontFamily: string;
  fontStyle: string;
  spacing: number;
  textTranslateX: number;
  textTranslateY: number;
  titleBackgroundType: "color" | "image";
  titleBackgroundColor: string;
  titleBackgroundImage: string;
  backgroundType: "color" | "image";
  background: string;
  backgroundImage: string;
  padding: number[];
  scrollBar: boolean;
}

export function useCollection(
  collection: Ref<HTMLElement | null>,
  option: Ref<CollectionOptions>,
  width: Ref<number>,
  height: Ref<number>,
  dataChart: Ref<any[]>
) {
  const speedCount = ref(1);
  const isScrolling = ref(false);

  // 计算属性
  const background = computed(() => {
    if (option.value.backgroundType === "color") {
      return { backgroundColor: option.value.background };
    } else {
      return { backgroundImage: `url(${setMinioUrl(option.value.backgroundImage)})` };
    }
  });

  const cardData = computed(() => {
    return option.value.cardLen > dataChart.value.length ? dataChart.value : [...dataChart.value, ...dataChart.value];
  });

  const styleSizeName = computed(() => ({
    width: `${width.value}px`,
    height: `${height.value}px`,
    padding: `${option.value.padding[0]}px ${option.value.padding[1]}px ${option.value.padding[2]}px ${option.value.padding[3]}px`,
    ...background.value
  }));

  const cardStyle = computed(() => {
    const spacing = option.value.cardMarginRight * (option.value.cardLen - 1);
    const boxWidth = width.value - option.value.padding[1] - option.value.padding[3] - spacing;
    const cardWidth = boxWidth / option.value.cardLen;
    const cardHeight = height.value - option.value.padding[0] - option.value.padding[2];

    // 基础样式，不包含背景
    const baseStyle = {
      width: `${cardWidth}px`,
      height: `${cardHeight}px`,
      marginRight: `${option.value.cardMarginRight}px`,
      backgroundSize: option.value.cardBgObjectFit
    };

    // 根据类型添加背景样式
    if (option.value.cardBackgroundType === "color") {
      return {
        ...baseStyle,
        backgroundColor: option.value.cardBackgroundColor
      };
    } else {
      return {
        ...baseStyle,
        backgroundImage: `url(${setMinioUrl(option.value.cardBackgroundImage)})`
      };
    }
  });

  const cardItemStyle = computed<CSSProperties>(() => ({
    objectFit: option.value.cardObjectFit as "fill" | "contain" | "cover" | "none" | "scale-down",
    padding: `${option.value.cardPadding[0]}px ${option.value.cardPadding[1]}px ${option.value.cardPadding[2]}px ${option.value.cardPadding[3]}px`
  }));

  const titleStyle = computed(() => {
    const titleWidthHalf = option.value.titleWidth / 2;

    // 基础标题样式
    const baseStyle = {
      width: `${option.value.titleWidth}px`,
      height: `${option.value.titleHeight}px`,
      lineHeight: `${option.value.titleHeight}px`,
      color: option.value.color,
      left: `calc(50% - ${titleWidthHalf}px)`,
      fontSize: `${option.value.fontSize || 12}px`,
      fontWeight: option.value.fontWeight,
      fontFamily: option.value.fontFamily,
      fontStyle: option.value.fontStyle,
      letterSpacing: `${option.value.spacing}px`,
      transform: `translate(${option.value.textTranslateX || 0}px, ${option.value.textTranslateY || 0}px)`
    };

    // 根据类型添加背景样式
    if (option.value.titleBackgroundType === "color") {
      return {
        ...baseStyle,
        backgroundColor: option.value.titleBackgroundColor
      };
    } else {
      return {
        ...baseStyle,
        backgroundImage: `url(${setMinioUrl(option.value.titleBackgroundImage)})`
      };
    }
  });

  // 使用 vueuse 的 useRafFn 处理动画
  const { pause: pauseScroll, resume: resumeScroll } = useRafFn(
    () => {
      if (!collection.value || !option.value.scroll) return;

      const interval = option.value.speed / 10;

      if (option.value.speedPosition === "ToLeft") {
        collection.value.scrollLeft = speedCount.value += interval;
        if (speedCount.value >= collection.value.scrollWidth / 2) {
          speedCount.value = 0;
        }
      } else if (option.value.speedPosition === "ToRight") {
        collection.value.scrollLeft = speedCount.value -= interval;
        if (speedCount.value <= collection.value.scrollWidth / 2 - collection.value.clientWidth) {
          speedCount.value = collection.value.scrollWidth - collection.value.clientWidth;
        }
      }
    },
    { immediate: false }
  );

  // 初始化滚动位置
  const initScroll = () => {
    if (!option.value.scroll || !collection.value) return;

    pauseScroll();

    if (option.value.speedPosition === "ToLeft") {
      speedCount.value = 0;
    } else if (option.value.speedPosition === "ToRight") {
      speedCount.value = collection.value.scrollWidth - collection.value.clientWidth;
    }
  };

  // 开始滚动
  const startScroll = () => {
    if (!option.value.scroll) return;

    isScrolling.value = true;
    resumeScroll();
  };

  // 停止滚动
  const handleStopScroll = () => {
    if (option.value.scroll) {
      isScrolling.value = false;
      pauseScroll();
    }
  };

  // 更新滚动条可见性
  const updateScrollbarVisibility = () => {
    if (collection.value) {
      collection.value.style.setProperty("--show-scrollbar", option.value.scrollBar ? "auto" : "hidden");
    }
  };

  return {
    speedCount,
    isScrolling,
    cardData,
    styleSizeName,
    cardStyle,
    cardItemStyle,
    titleStyle,
    pauseScroll,
    resumeScroll,
    initScroll,
    startScroll,
    handleStopScroll,
    updateScrollbarVisibility
  };
}
