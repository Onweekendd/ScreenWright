import { computed, ref } from "vue";

import { cloneDeep } from "lodash-es";

import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { uuid } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

export const useSwiperCard = (element: ComponentType) => {
  const uid = ref(uuid());
  const mouseHover = ref<boolean>(false);
  const styleList = ref<any>([]);
  const timer = ref<NodeJS.Timeout | null>(null);
  const activeSpinnerIndex = ref<number>(-1); // 高亮项
  const dataChartItemList = ref<any>([]); // 数据列表
  const reseting = ref<boolean>(false); // 是否重置中，解决滚动一半时配置改变，标牌会交叉滚动回到初始位置问题
  const clickClockwise = ref<boolean>(false); // 点击标牌旋转-属性-点击子项切换时是否顺时针转
  const transitionTime = computed(() => `${reseting.value ? 0 : option.value.globalConfig.transitionTime}s`);

  const { width, height, dataChart, option, styleSizeName, componentClasses, handleEventAndCallbackEvent } =
    useBaseData(element);

  const mouseleave = () => {
    mouseHover.value = false;
  };
  const mouseenter = () => {
    mouseHover.value = true;
  };

  const setBaseStyle = () => {
    styleList.value = [];
    const cardList = cloneDeep(option.value.cardList);
    const meanVal =
      cardList.map((item: any) => item.defaultObj.width).reduce((a: any, b: any) => a + b, 0) / cardList.length;
    // 如果是偶数，则补一个空值（因为这个布局要奇数展示）
    if (cardList.length % 2 === 0) {
      cardList.push(0);
    }
    for (let index = 0; index < cardList.length; index++) {
      const cardItem = cardList[index];
      if (cardItem === 0) {
        continue;
      }

      const key = index === activeSpinnerIndex.value ? "activeObj" : "defaultObj";
      let itemObj: Record<string, any> = {};
      itemObj = {
        width: `${cardItem[key].width}px`,
        height: `${cardItem[key].height}px`,
        markOpacity: `${cardItem[key].markOpacity / 100}`,
        background: `url(${
          dataChartItemList.value?.[index]?.url || setMinioUrl(cardItem.backgroundImg)
        }) 50% 50% / 100% 100% no-repeat`,
        titleStyle: {
          show: cardItem[key].titleShow,
          width: `${cardItem[key].titleWidth}px`,
          height: `${cardItem[key].titleHeight}px`,
          fontFamily: `${cardItem[key].titleFontFamily}`,
          fontSize: `${cardItem[key].titleFontSize}px`,
          lineHeight: `${cardItem[key].titleLineHeight}px`,
          letterSpacing: `${cardItem[key].titleLetterSpacing}px`,
          color: `${cardItem[key].titleColor}`,
          fontStyle: `${cardItem[key].titleFontStyle}`,
          fontWeight: `${cardItem[key].titleFontWeight}`,
          left: `${cardItem[key].titleOffsetLeft}px`,
          top: `${cardItem[key].titleOffsetTop}px`
        },
        textStyle: {
          show: cardItem[key].textShow,
          width: `${cardItem[key].textWidth}px`,
          height: `${cardItem[key].textHeight}px`,
          fontFamily: `${cardItem[key].textFontFamily}`,
          fontSize: `${cardItem[key].textFontSize}px`,
          lineHeight: `${cardItem[key].textLineHeight}px`,
          letterSpacing: `${cardItem[key].textLetterSpacing}px`,
          color: `${cardItem[key].textColor}`,
          fontStyle: `${cardItem[key].textFontStyle}`,
          fontWeight: `${cardItem[key].textFontWeight}`,
          left: `${cardItem[key].textOffsetLeft}px`,
          top: `${cardItem[key].textOffsetTop}px`
        }
      };
      const midVal = (cardList.length + 1) / 2;
      let angle;
      if (index === 0) {
        angle = 0;
      } else {
        // 右边
        if (index + 1 <= midVal) {
          angle = (90 / (midVal - 1)) * index;
        } else {
          // 左边
          angle = -(90 / (midVal - 1)) * (cardList.length - index);
        }
      }

      const cWidth = width.value - meanVal;
      // 中点右边
      const x = (cWidth || 0) * (angle / 90);
      let y;
      if (angle === 0) {
        y = cWidth || 0;
      } else if (angle < 0) {
        y = (cWidth || 0) + x;
      } else {
        y = (cWidth || 0) - x;
      }
      // x会从负边正/从正变负，而y最小是0，此时如果y从0变成别的数，会导致部分卡片会翻转一下
      if (y === 0) {
        y = 1;
      }
      itemObj["transform"] = `translate(-50%, -50%) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, ${x}, 0, ${y}, 1)`;
      itemObj["-moz-transform"] =
        `translate(-50%, -50%) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, ${x}, 0, ${y}, 1)`;
      itemObj["-webkit-transform"] =
        `translate(-50%, -50%) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, ${x}, 0, ${y}, 1)`;
      if (cardItem === 0) {
        itemObj.isNullVal = true;
      }
      styleList.value.push(itemObj);
    }
  };

  // 旋转动画
  const roateAnimate = (
    isClick = false,
    clockwise = option.value.globalConfig.rotateDirection,
    transformStyleList = styleList.value.map((sl: any) => sl.transform)
  ) => {
    // 点击时跳过
    if (!isClick) {
      if (option.value.globalConfig.hoverPause && mouseHover.value) return;
    }

    if (!transformStyleList?.length) {
      return;
    }

    // 顺时针
    if (clockwise) {
      transformStyleList.unshift(transformStyleList[transformStyleList.length - 1]);
      transformStyleList.pop();
      if (activeSpinnerIndex.value < transformStyleList.length - 1) {
        activeSpinnerIndex.value++;
      } else {
        activeSpinnerIndex.value = 0;
      }
    } else {
      // 逆时针
      transformStyleList.push(transformStyleList[0]);
      transformStyleList = transformStyleList.slice(1);
      if (activeSpinnerIndex.value > 0) {
        activeSpinnerIndex.value--;
      } else {
        activeSpinnerIndex.value = transformStyleList.length - 1;
      }
    }

    // 设置高亮项和其他项样式
    setBaseStyle();
    transformStyleList?.map((ts: any, tsIndex: number) => {
      styleList.value[tsIndex]["transform"] = ts;
      styleList.value[tsIndex]["-moz-transform"] = ts;
      styleList.value[tsIndex]["-webkit-transform"] = ts;
    });
  };

  // 控制按钮点击
  const handleControlClick = (type: string) => {
    let clickIndex = -1;
    switch (type) {
      case "l":
        if (activeSpinnerIndex.value === 0) {
          clickIndex = styleList.value.length - 1;
        } else {
          clickIndex = cloneDeep(activeSpinnerIndex.value - 1);
        }
        break;
      case "r":
        if (activeSpinnerIndex.value === styleList.value.length - 1) {
          clickIndex = 0;
        } else {
          clickIndex = cloneDeep(activeSpinnerIndex.value + 1);
        }
        break;
    }
    if (clickIndex !== -1) {
      handleClickSpinner(null, null, clickIndex);
    }
  };
  // 点击轮播项
  const handleClickSpinner = (e: Event | null, item: any, index: number) => {
    // 旋转数量大于总数的一半，说明要逆时针转，旋转数量-总数的一半
    let spinNum;
    const differenceVal =
      activeSpinnerIndex.value - index > 0 ? activeSpinnerIndex.value - index : index - activeSpinnerIndex.value;
    if (differenceVal > styleList.value.length / 2) {
      spinNum = styleList.value.length - differenceVal;
    } else {
      spinNum = differenceVal;
    }

    if (spinNum) {
      const spinSpeed = option.value.globalConfig.transitionTime / spinNum;
      for (let i = 0; i < spinNum; i++) {
        setTimeout(
          () => {
            roateAnimate(true, clickClockwise.value);
          },
          spinSpeed * 1000 * i
        );
      }
    }

    const cardInfo = dataChartItemList.value.length
      ? dataChartItemList.value?.[index]
      : {
          title: option.value.cardList[index]?.titleContent,
          text: option.value.cardList[index]?.textContent,
          url: option.value.cardList[index]?.backgroundImg
        };

    console.log("handleEventAndCallbackEvent", cardInfo);

    // 交互-自定义事件 TODO: 事件发布
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.Click,
      events: element.events,
      throwValue: cardInfo
    });
  };

  const init = () => {
    activeSpinnerIndex.value = 0;
    if (timer.value) clearInterval(timer.value);
    timer.value = null;
    setBaseStyle();
    if (option.value && option.value.globalConfig && option.value.globalConfig.autoPlay) {
      timer.value = setInterval(
        () => {
          roateAnimate();
        },
        (option.value.globalConfig.intervalTime + option.value.globalConfig.transitionTime) * 1000
      );
    }
    setTimeout(() => {
      reseting.value = false;
    }, 200);
  };

  const getControlButtonProps = (direction: string) => ({
    offsetLeftOrRight: option.value.globalConfig.controlBtnOffsetLeftOrRight,
    offsetTop: option.value.globalConfig.controlBtnOffsetTop,
    width: option.value.globalConfig.controlBtnWidth,
    height: option.value.globalConfig.controlBtnHeight,
    bgImage: setMinioUrl(option.value.globalConfig[`controlBtn${direction.toUpperCase()}Bg`])
  });

  return {
    width,
    height,
    dataChart,
    option,
    styleSizeName,
    componentClasses,
    handleEventAndCallbackEvent,
    uid,
    reseting,
    timer,
    clickClockwise,
    styleList,
    activeSpinnerIndex,
    dataChartItemList,
    transitionTime,
    mouseenter,
    mouseleave,
    init,
    handleControlClick,
    handleClickSpinner,
    getControlButtonProps
  };
};
