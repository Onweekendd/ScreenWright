import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

interface ActiveObject {
  imageSrc: string;
}

// 默认状态对象类型
interface DefaultObject {
  link: string;
  title: string;
  content: string;
  imageSrc: string;
}

// 单个标签项类型
export interface SeriesTabItem {
  id: string;
  name: string;
  activeObj: ActiveObject;
  defaultObj: DefaultObject;
}

export const useImageList = (options: ComponentType) => {
  const {
    option,
    dataChart,
    componentClasses,
    styleSizeName,
    events,
    handleEventAndCallbackEvent,
  } = useBaseData(options);
  // 变量

  const current = ref<number | string | null>(null);
  const eventStatus = ref<boolean>(false);
  const radius = ref<number>(0);
  const animationName = ref<string>("");
  //  计算属性
  const styleDrap = computed<CSSProperties>(() => {
    return {
      perspective: `${option.value.perspective || 1000}px`,
    };
  });

  const styleContainer = computed<CSSProperties>(() => {
    return {
      transform: `rotateX(${option.value.rotateX}deg) 
      rotateY(${option.value.rotateY}deg) 
      rotateZ(${option.value.rotateZ}deg) 
      translateX(${option.value.translateX}px) 
      translateY(${option.value.translateY}px) 
      translateZ(${option.value.translateZ}px)`,
    };
  });

  const styleSpin = computed<CSSProperties>(() => {
    return {
      width: `${option.value.imgWidth}px`,
      height: `${option.value.imgHeight}px`,
      animationDuration: `${Math.abs(option.value.rotateSpeed)}s`,
    };
  });

  const styleSpinPoint = computed<CSSProperties>(() => {
    return {
      "-webkit-box-reflect": `below 10px linear-gradient(transparent, transparent, rgba(0, 0, 0, ${
        option.value.invertedImage ? 0.33 : 0
      }))`,
    };
  });
  const styleSeriesList = computed<any>(() => {
    const defaultFont = {
      color: option.value.defaultObj.fontColor,
      fontSize: `${option.value.defaultObj.fontSize || 12}px`,
      letterSpacing: `${option.value.defaultObj.letterSpacing || 0}px`,
      paddingTop: `${option.value.defaultObj.paddingTop || 0}px`,
      paddingBottom: `${option.value.defaultObj.paddingBottom || 0}px`,
      fontWeight: option.value.defaultObj.fontWeight,
      fontFamily: option.value.defaultObj.fontFamily,
      fontStyle: option.value.defaultObj.fontStyle,
      textShadow: option.value.defaultObj.isTextShadow
        ? `${option.value.defaultObj.textShadow.color} ${option.value.defaultObj.textShadow.x || 0}px ${
            option.value.defaultObj.textShadow.y || 0
          }px ${option.value.defaultObj.textShadow.blur}px`
        : "none",
      transform: `translate(${option.value.defaultObj.textTranslateX || 0}px, ${
        option.value.defaultObj.textTranslateY || 0
      }px)`,
    };
    // 内容
    const defaultFont2 = {
      color: option.value.defaultObj.fontColor2,
      fontSize: `${option.value.defaultObj.fontSize2 || 12}px`,
      letterSpacing: `${option.value.defaultObj.letterSpacing2 || 0}px`,
      fontWeight: option.value.defaultObj.fontWeight2,
      fontFamily: option.value.defaultObj.fontFamily2,
      fontStyle: option.value.defaultObj.fontStyle2,
      textShadow: option.value.defaultObj.isTextShadow2
        ? `${option.value.defaultObj.textShadow2.color} ${option.value.defaultObj.textShadow2.x || 0}px ${
            option.value.defaultObj.textShadow2.y || 0
          }px ${option.value.defaultObj.textShadow2.blur}px`
        : "none",
      transform: `translate(${option.value.defaultObj.textTranslateX2 || 0}px, ${
        option.value.defaultObj.textTranslateY2 || 0
      }px)`,
    };
    const activeFont = {
      color: option.value.activeObj.fontColor,
      fontSize: `${option.value.activeObj.fontSize || 12}px`,
      letterSpacing: `${option.value.activeObj.letterSpacing || 0}px`,
      paddingTop: `${option.value.activeObj.paddingTop || 0}px`,
      paddingBottom: `${option.value.activeObj.paddingBottom || 0}px`,
      fontWeight: option.value.activeObj.fontWeight,
      fontFamily: option.value.activeObj.fontFamily,
      fontStyle: option.value.activeObj.fontStyle,
      textShadow: option.value.activeObj.isTextShadow
        ? `${option.value.activeObj.textShadow.color} ${option.value.activeObj.textShadow.x || 0}px ${
            option.value.activeObj.textShadow.y || 0
          }px ${option.value.activeObj.textShadow.blur}px`
        : "none",
      transform: `translate(${option.value.activeObj.textTranslateX || 0}px, ${
        option.value.activeObj.textTranslateY || 0
      }px)`,
    };
    const activeFont2 = {
      color: option.value.activeObj.fontColor2,
      fontSize: `${option.value.activeObj.fontSize2 || 12}px`,
      letterSpacing: `${option.value.activeObj.letterSpacing2 || 0}px`,
      fontWeight: option.value.activeObj.fontWeight2,
      fontFamily: option.value.activeObj.fontFamily2,
      fontStyle: option.value.activeObj.fontStyle2,
      textShadow: option.value.activeObj.isTextShadow2
        ? `${option.value.activeObj.textShadow2.color} ${option.value.activeObj.textShadow2.x || 0}px ${
            option.value.activeObj.textShadow2.y || 0
          }px ${option.value.activeObj.textShadow2.blur}px`
        : "none",
      transform: `translate(${option.value.activeObj.textTranslateX2 || 0}px, ${
        option.value.activeObj.textTranslateY2 || 0
      }px)`,
    };
    return {
      activeFont,
      activeFont2,
      defaultFont,
      defaultFont2,
    };
  });

  const getMinioUrl = (item: any, index: number) => {
    const defaultSrc = dataChart.value[index]?.src || item.defaultObj.imageSrc;
    return current.value === item.id
      ? item.activeObj.imageSrc || defaultSrc
      : defaultSrc;
  };

  const applyTranform = (dom: HTMLDivElement) => {
    const tX = 0;
    let tY = 10;
    if (eventStatus.value) {
      return;
    }
    // Constrain the angle of camera (between 0 and 180)
    if (tY > 180) {
      tY = 180;
    }
    if (tY < 0) {
      tY = 0;
    }
    // console.log('123', dom)
    // Apply the angle
    dom.style.transform = `rotateX(${-tY}deg) 
                            rotateY(${tX}deg)
                            rotateZ(${option.value.rotateZ}deg) 
                            translateX(${option.value.translateX}px) 
                            translateY(${option.value.translateY}px) 
                            translateZ(${option.value.translateZ}px)`;
  };
  const playSpin = (dom: HTMLDivElement, isplay: boolean) => {
    dom.style.animationPlayState = isplay ? "running" : "paused";
  };

  return {
    current,
    option,
    eventStatus,
    animationName,
    events,
    radius,
    dataChart,
    componentClasses,
    styleSizeName,
    styleDrap,
    styleContainer,
    styleSpin,
    styleSpinPoint,
    styleSeriesList,
    getMinioUrl,
    applyTranform,
    playSpin,
    handleEventAndCallbackEvent,
  };
};
