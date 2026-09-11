import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { uuid } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { cloneDeep } from "lodash-es";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

interface StyleItem {
  width: string;
  height: string;
  opacity: number;
  background: string;
  transform?: string;
  "-moz-transform"?: string;
  "-webkit-transform"?: string;
  numStyle: any;
  nameStyle: any;
}

export const useRingIndicator = (options: ComponentType) => {
  const {
    width,
    height,
    dataChart,
    option,
    componentClasses,
    handleEventAndCallbackEvent,
  } = useBaseData(options);
  const uid = ref(uuid());
  const isReset = ref(false);
  const ringStyle = computed<CSSProperties>(() => {
    return {
      pointerEvents: option.value.pointerEvents ? "none" : "auto",
      width: width.value + "px",
      height: height.value + "px",
    };
  });

  const mouseHover = ref(false);
  const styleList = ref<StyleItem[]>([]);
  const activeSpinnerIndex = ref<number>(-1);
  const dataChartItemList = ref<any>(null); //数据列表

  const timer = ref<NodeJS.Timeout | null>(null);
  const clickClockwise = ref(false);
  const clickSpining = ref(false);
  const clickSpinneTimer = ref<NodeJS.Timeout | null>(null);

  const getMarkStyle = computed<CSSProperties>(() => {
    let returnStyle: CSSProperties = {};
    if (option.value && option.value.markType) {
      switch (option.value.markType) {
        case "linearGradient":
          returnStyle = {
            background: `linear-gradient(${option.value.linearGradient?.markPosition || 0}deg, ${
              option.value.linearGradient?.markColor
            } 0%, ${option.value.linearGradient?.markColor} ${
              option.value.linearGradient?.markRadius || 0
            }%, transparent 100%)`,
            opacity: `${option.value.linearGradient?.markOpacity / 100}`,
          };
          break;
        case "radioactiveGradation":
          {
            let bm = "";
            if (option.value.radioactiveGradation.showLengthWidthRatio) {
              if (option.value.radioactiveGradation.lengthWidthRatio < 0) {
                bm = `radial-gradient(${
                  1 / (1 + option.value.radioactiveGradation.lengthWidthRatio)
                }px 1px, transparent ${
                  option.value.radioactiveGradation?.markOpacityRadius
                    ? (option.value.radioactiveGradation?.markOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px, ${option.value.radioactiveGradation?.markColor} ${
                  option.value.radioactiveGradation?.markUnOpacityRadius
                    ? (option.value.radioactiveGradation?.markUnOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px)`;
              } else if (
                option.value.radioactiveGradation.lengthWidthRatio === 0
              ) {
                bm = `radial-gradient(1px 1px, transparent ${
                  option.value.radioactiveGradation?.markOpacityRadius
                    ? (option.value.radioactiveGradation?.markOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px, ${option.value.radioactiveGradation?.markColor} ${
                  option.value.radioactiveGradation?.markUnOpacityRadius
                    ? (option.value.radioactiveGradation?.markUnOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px)`;
              } else {
                bm = `radial-gradient(1px ${
                  1 / (1 - option.value.radioactiveGradation.lengthWidthRatio)
                }px, transparent ${
                  option.value.radioactiveGradation?.markOpacityRadius
                    ? (option.value.radioactiveGradation?.markOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px, ${option.value.radioactiveGradation?.markColor} ${
                  option.value.radioactiveGradation?.markUnOpacityRadius
                    ? (option.value.radioactiveGradation?.markUnOpacityRadius /
                        100) *
                      height.value
                    : 0
                }px)`;
              }
            } else {
              bm = `radial-gradient(transparent ${
                option.value.radioactiveGradation?.markOpacityRadius
                  ? (option.value.radioactiveGradation?.markOpacityRadius /
                      100) *
                    height.value
                  : 0
              }px, ${option.value.radioactiveGradation?.markColor} ${
                option.value.radioactiveGradation?.markUnOpacityRadius
                  ? (option.value.radioactiveGradation?.markUnOpacityRadius /
                      100) *
                    height.value
                  : 0
              }px)`;
            }
            returnStyle = {
              "background-image": bm,
              opacity: `${option.value.radioactiveGradation?.markOpacity / 100}`,
            };
          }

          break;
      }
    }

    return returnStyle;
  });

  const carouselStyle = computed<CSSProperties>(() => {
    return {
      perspective: `${option.value.globalConfig.perspective}px`,
      "--transitionTime": `${isReset.value ? 0 : option.value.globalConfig.transitionTime}s`,
      "--matrix3dX": `${option.value.globalConfig.cameraPositionX}px`,
      "--matrix3dY": `${option.value.globalConfig.cameraPositionY}px`,
      "--matrix3dZ": `${option.value.globalConfig.cameraPositionZ}px`,
      "--matrix3dRoateX": `${option.value.globalConfig.cameraRotateX}deg`,
      "--matrix3dRoateY": `${option.value.globalConfig.cameraRotateY}deg`,
      "--matrix3dRoateZ": `${option.value.globalConfig.cameraRotateZ}deg`,
    };
  });

  // 鼠标事件
  const mouseleave = () => {
    mouseHover.value = false;
  };
  const mouseenter = () => {
    mouseHover.value = true;
  };

  const init = () => {
    if (dataChartItemList.value && !dataChartItemList.value.length) {
      styleList.value = [];
      return;
    }
    activeSpinnerIndex.value = 0;
    if (timer.value !== null) {
      clearInterval(timer.value);
      timer.value = null;
    }
    setBaseStyle();

    if (
      option.value &&
      option.value.globalConfig &&
      option.value.globalConfig.autoPlay
    ) {
      timer.value = setInterval(
        () => {
          rotateAnimate();
        },
        (option.value.globalConfig.intervalTime +
          option.value.globalConfig.transitionTime) *
          1000,
      );
    }
    setTimeout(() => {
      isReset.value = false;
    }, 200);
  };

  const handleClickSpinner = (index: number) => {
    if (clickSpining.value) {
      return;
    }
    clickSpining.value = true;
    const cacheActiveSpinnerIndex = cloneDeep(activeSpinnerIndex.value);
    // 旋转数量大于总数的一半，说明要逆时针转，旋转数量-总数的一半
    let spinNum: any = 0;
    const differenceVal =
      cacheActiveSpinnerIndex - index > 0
        ? cacheActiveSpinnerIndex - index
        : index - cacheActiveSpinnerIndex;
    if (differenceVal > styleList.value.length / 2) {
      spinNum = styleList.value.length - differenceVal;
    } else {
      spinNum = differenceVal;
    }
    if (spinNum) {
      const spinSpeed = option.value.globalConfig.transitionTime / spinNum;
      for (let i = 0; i < spinNum; i++) {
        clickSpinneTimer.value = setTimeout(
          () => {
            rotateAnimate(true, clickClockwise.value);
            if (i === spinNum - 1) {
              clickSpining.value = false;
            }
          },
          spinSpeed * 1000 * i,
        );
      }
    } else {
      clickSpining.value = false;
    }
    handleEventAndCallbackEvent({
      id: options.id,
      triggerType: EventTypeEnum.Click,
      events: options.events,
      throwValue: dataChart.value[index] || {},
    });
  };

  const getIconStyle = (item: any, index: number) => {
    let iconStyle = {};
    let targetObj;
    if (activeSpinnerIndex.value === index) {
      targetObj = option.value.placard.selectObj;
    } else {
      targetObj = option.value.placard.defaultObj;
    }

    for (let i = 0; i < targetObj.iconList.length; i++) {
      const iconItem = targetObj.iconList[i];
      if (item.name) {
        if (iconItem.name) {
          if (iconItem.name === item.name) {
            iconStyle = {
              width: `${iconItem.offsetWidth}px`,
              height: `${iconItem.offsetHeight}px`,
              background: `url(${setMinioUrl(iconItem.img)}) 50% 50% / 100% 100% no-repeat`,
              top: `calc(50% + ${iconItem.offsetLeft}px)`,
              left: `calc(50% + ${iconItem.offsetTop}px)`,
              transform: `translate(-50%, -50%)`,
            };
            return iconStyle;
          }
        } else {
          iconStyle = {
            width: `${iconItem.offsetWidth}px`,
            height: `${iconItem.offsetHeight}px`,
            background: `url(${setMinioUrl(iconItem.img)}) 50% 50% / 100% 100% no-repeat`,
            top: `calc(50% + ${iconItem.offsetLeft}px)`,
            left: `calc(50% + ${iconItem.offsetTop}px)`,
            transform: `translate(-50%, -50%)`,
          };
          return iconStyle;
        }
      } else {
        // 没填写名称的话，则iconStyle为图标列表最后一项无名称图标的配置
        iconStyle = {
          width: `${iconItem.offsetWidth}px`,
          height: `${iconItem.offsetHeight}px`,
          background: `url(${setMinioUrl(iconItem.img)}) 50% 50% / 100% 100% no-repeat`,
          top: `calc(50% + ${iconItem.offsetLeft}px)`,
          left: `calc(50% + ${iconItem.offsetTop}px)`,
          transform: `translate(-50%, -50%)`,
        };
        return iconStyle;
      }
    }
  };

  // 1. 抽取样式配置为独立函数
  const getPlacardStyle = (isSelected: boolean) => {
    const config = isSelected
      ? option.value.placard.selectObj
      : option.value.placard.defaultObj;
    return {
      width: `${config.placardOffsetWidth}px`,
      height: `${config.placardOffsetHeight}px`,
      opacity: config.opacity / 100,
      background: `url(${setMinioUrl(config.placardImg)}) 50% 50% / 100% 100% no-repeat`,
      numStyle: getNumStyle(config),
      nameStyle: getNameStyle(config),
    };
  };

  const getNumStyle = (config: any) => {
    return {
      showNum: config.showNum,
      fontFamily: config.numFontFamily,
      fontSize: `${config.numFontSize}px`,
      lineHeight: `${config.numLineHeight}px`,
      letterSpacing: `${config.numLetterSpacing}px`,
      color: config.numColor,
      fontStyle: config.numFontStyle,
      fontWeight: config.numFontWeight,
      left: `calc(50% + ${config.numOffsetLeft}px)`,
      top: `calc(50% + ${config.numOffsetTop}px)`,
      transform: "translate(-50%, -50%)",
      unitStyle: getUnitStyle(config),
    };
  };

  const getUnitStyle = (config: any) => {
    return {
      showNumUnit: config.showNumUnit,
      numUnitText: `${config.numUnitText}`,
      fontFamily: `${config.numUnitFontFamily}`,
      fontSize: `${config.numUnitFontSize}px`,
      lineHeight: `${config.numUnitLineHeight}px`,
      letterSpacing: `${config.numUnitLetterSpacing}px`,
      color: config.numUnitColor,
      fontStyle: config.numUnitFontStyle,
      fontWeight: config.numUnitFontWeight,
      right: `-${config.numUnitFontSize + config.numUnitOffsetLeft}px`,
      top: `${config.numUnitOffsetTop}px`,
    };
  };

  const getNameStyle = (config: any) => {
    return {
      showName: config.showName,
      fontFamily: config.nameFontFamily,
      fontSize: `${config.nameFontSize}px`,
      lineHeight: `${config.nameLineHeight}px`,
      letterSpacing: `${config.nameLetterSpacing}px`,
      color: config.nameColor,
      fontStyle: config.nameFontStyle,
      fontWeight: config.nameFontWeight,
      left: `calc(50% + ${config.nameOffsetLeft}px)`,
      top: `calc(50% + ${config.nameOffsetTop}px)`,
      transform: "translate(-50%, -50%)",
    };
  };

  // 2. 优化 setBaseStyle 函数
  const setBaseStyle = () => {
    if (!dataChartItemList.value?.length) {
      styleList.value = [];
      return;
    }

    styleList.value = dataChartItemList.value.map(
      (_item: any, index: number) => {
        const angle = (360 / dataChartItemList.value.length) * index;
        const x =
          Math.sin((Math.PI / 180) * angle) *
          (option.value?.globalConfig?.roateRadius || 0);
        const y =
          Math.cos((Math.PI / 180) * angle) *
          (option.value?.globalConfig?.roateRadius || 0);
        const transform = `translate(-50%, -50%) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, ${x}, 0, ${y}, 1)`;

        return {
          ...getPlacardStyle(index === activeSpinnerIndex.value),
          transform,
          "-moz-transform": transform,
          "-webkit-transform": transform,
        };
      },
    );

    console.log("styleList.value", styleList.value);
  };

  // 3. 优化 rotateAnimate 函数
  const rotateAnimate = (
    isClick?: boolean,
    clockwise = option.value.globalConfig.rotateDirection,
    transformStyleList = styleList.value.map((sl) => sl.transform),
  ) => {
    if (!isClick && option.value.globalConfig.hoverPause && mouseHover.value) {
      return;
    }
    if (!transformStyleList?.length) {
      return;
    }

    // 更新 activeSpinnerIndex
    if (clockwise) {
      activeSpinnerIndex.value =
        (activeSpinnerIndex.value + 1) % transformStyleList.length;
      transformStyleList.unshift(transformStyleList.pop()!);
    } else {
      activeSpinnerIndex.value =
        activeSpinnerIndex.value > 0
          ? activeSpinnerIndex.value - 1
          : transformStyleList.length - 1;
      transformStyleList.push(transformStyleList.shift()!);
    }

    // 更新样式列表
    styleList.value = transformStyleList.map((transform, index) => ({
      ...getPlacardStyle(index === activeSpinnerIndex.value),
      transform,
      "-moz-transform": transform,
      "-webkit-transform": transform,
    }));
  };

  return {
    option,
    dataChart,
    uid,
    isReset,
    ringStyle,
    componentClasses,
    getMarkStyle,
    carouselStyle,
    styleList,
    activeSpinnerIndex,
    dataChartItemList,
    timer,
    mouseleave,
    mouseenter,
    handleClickSpinner,
    getIconStyle,
    handleEventAndCallbackEvent,
    init,
  };
};
