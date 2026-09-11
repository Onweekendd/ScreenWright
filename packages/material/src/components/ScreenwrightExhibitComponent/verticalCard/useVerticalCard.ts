import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { uuid } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { cloneDeep } from "lodash-es";
import { computed, nextTick, onUnmounted, ref } from "vue";

import { useAnimationDom } from "./useAnimationDom";

export const useVerticalCard = (element: ComponentType) => {
  const uid = ref(uuid());
  const mouseHover = ref<boolean>(false);
  const styleList = ref<any>([]);
  const timer = ref<NodeJS.Timeout | null>(null);
  const activeSpinnerIndex = ref<number>(-1); // 高亮项
  const dataChartItemList = ref<any>([]); // 数据列表
  const reseting = ref<boolean>(false); // 是否重置中，解决滚动一半时配置改变，标牌会交叉滚动回到初始位置问题
  const clickClockwise = ref<boolean>(false); // 点击标牌旋转-属性-点击子项切换时是否顺时针转
  const transitionTime = computed(
    () => `${reseting.value ? 0 : option.value.globalConfig.transitionTime}s`,
  );
  const { setExpandClip, setShrinkClip, isDownAndScale } = useAnimationDom();
  const {
    width,
    height,
    dataChart,
    option,
    styleSizeName,
    componentClasses,
    handleEventAndCallbackEvent,
  } = useBaseData(element);

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
      cardList
        .map((item: any) => item.defaultObj.width)
        .reduce((a: any, b: any) => a + b, 0) / cardList.length;
    // 如果是偶数，则补一个空值（因为这个布局要奇数展示）
    if (cardList.length % 2 === 0) {
      cardList.push(0);
    }
    for (let index = 0; index < cardList.length; index++) {
      const cardItem = cardList[index];
      if (cardItem === 0) {
        continue;
      }

      const key =
        index === activeSpinnerIndex.value ? "activeObj" : "defaultObj";
      let itemObj: Record<string, any> = {};
      console.log(cardItem[key].width, "cardItem[key].width");
      itemObj = {
        // width: `${cardItem[key].width}px`,
        // height: `${cardItem[key].height}px`,
        width: `600px`,
        height: `300px`,
        markOpacity: `${cardItem[key].markOpacity / 100}`,
        // background: `url(${
        //   dataChartItemList.value?.[index]?.url || setMinioUrl(cardItem.backgroundImg)
        // }) 50% 50% / 100% 100% no-repeat`,
        // background: 'url("http://127.0.0.1:60034/version-test/assets/defaultImg/verticalCard2.jpg")',
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
          top: `${cardItem[key].titleOffsetTop}px`,
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
          top: `${cardItem[key].textOffsetTop}px`,
        },
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
      itemObj["transform"] =
        `translate(-50%, -50%) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, ${x}, 0, ${y}, 1)`;
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
    transformStyleList = styleList.value.map((sl: any) => sl.transform),
  ) => {
    // 点击时跳过
    return new Promise((resolve) => {
      if (!isClick) {
        if (option.value.globalConfig.hoverPause && mouseHover.value) {
          return;
        }
      }

      if (!transformStyleList?.length) {
        return;
      }

      // 顺时针
      if (clockwise) {
        transformStyleList.unshift(
          transformStyleList[transformStyleList.length - 1],
        );
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
      console.log(activeSpinnerIndex.value, " rotaactiveSpinnerIndex.value");
      resolve(true);
    });
  };

  // 控制按钮点击
  const handleControlClick = async (type: string) => {
    let clickIndex = -1;
    switch (type) {
      case "l":
        if (activeSpinnerIndex.value === 0) {
          clickIndex = styleList.value.length - 1;
        } else {
          clickIndex = cloneDeep(activeSpinnerIndex.value - 1);
        }
        break;
      case "r": {
        if (activeSpinnerIndex.value === styleList.value.length - 1) {
          clickIndex = 0;
        } else {
          clickIndex = cloneDeep(activeSpinnerIndex.value + 1);
        }

        break;
      }
    }
    if (clickIndex !== -1) {
      console.log("🚀 ~ handleControlClick ~ clickIndex:", clickIndex);
      await handleClickSpinner(null, null, clickIndex);
    }
  };
  // 1. 声明全局防抖变量（放在函数外部，组件/模块作用域）
  let spinTimerList: number[] = []; // 存储旋转动画的定时器ID
  let clickDelayTimer: number | null = null; // 存储2秒等待的定时器ID
  let lastClickIndex: number | null = null; // 记录最后一次点击的索引
  // 新增：存储当前执行中的Promise回调，用于取消之前的Promise
  let currentAnimationPromise: {
    resolve: () => void;
    reject: (reason: any) => void;
  } | null = null;

  // 点击轮播项 - 改造为返回Promise的函数
  const handleClickSpinner = async (
    e: Event | null,
    item: any,
    index: number,
  ): Promise<void> => {
    // 封装为Promise，让外部可以监听动画结束
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        // 1. 取消之前的所有定时器和未完成的Promise
        spinTimerList.forEach((timer) => clearTimeout(timer));
        spinTimerList = [];

        // 清除2秒等待的定时器
        if (clickDelayTimer) {
          clearTimeout(clickDelayTimer);
          clickDelayTimer = null;
        }

        // 拒绝之前未完成的Promise
        if (currentAnimationPromise) {
          currentAnimationPromise.reject("新的点击操作取消了之前的动画");
          currentAnimationPromise = null;
        }

        // 记录当前Promise的回调，用于后续取消
        currentAnimationPromise = { resolve, reject };

        // 记录最后一次点击的索引
        lastClickIndex = index;

        // 计算旋转数量
        let spinNum;
        const differenceVal = Math.abs(activeSpinnerIndex.value - index);
        if (differenceVal > styleList.value.length / 2) {
          spinNum = styleList.value.length - differenceVal;
        } else {
          spinNum = differenceVal;
        }

        // 执行旋转动画
        if (spinNum) {
          const spinSpeed = option.value.globalConfig.transitionTime / spinNum;
          for (let i = 0; i < spinNum; i++) {
            setTimeout(
              () => {
                roateAnimate(true, clickClockwise.value);

                // 如果是最后一次旋转，更新激活索引
                if (i === spinNum - 1) {
                  activeSpinnerIndex.value = index;
                }
              },
              spinSpeed * 1000 * i,
            );
          }
        }

        // 获取卡片信息
        const cardInfo = dataChartItemList.value.length
          ? dataChartItemList.value?.[index]
          : {
              title: option.value.cardList[index]?.titleContent,
              text: option.value.cardList[index]?.textContent,
              url: option.value.cardList[index]?.backgroundImg,
            };
        console.log("🚀 ~ handleClickSpinner ~ cardInfo:", cardInfo);

        await nextTick();

        // 2秒延迟后执行展开/收缩动画
        clickDelayTimer = setTimeout(async () => {
          try {
            // 关键校验：只有当前索引是最后一次点击的索引，才执行动画
            if (lastClickIndex !== index) {
              reject(
                `索引不匹配，取消动画执行（当前:${index}, 最后点击:${lastClickIndex}）`,
              );
              currentAnimationPromise = null;
              return;
            }

            console.log(index, " index"); // 仅最后一次点击会打印
            const targetEle = document.getElementById(`spinner-item-${index}`);

            if (targetEle) {
              // 执行展开和收缩动画（等待动画完成）
              await setExpandClip(
                targetEle,
                option.value.cardList[index],
                element,
              );
              await setShrinkClip(
                targetEle,
                option.value.cardList[index],
                element,
              );
              console.log("这个时候结束了~~");
              console.log(isDownAndScale.value, "isDownAndScale.value");
            }

            // 动画全部完成，resolve Promise
            resolve();
            console.log(`索引${index}的动画已全部完成`);
          } catch (error) {
            // 动画执行过程中出错，reject Promise
            reject(error);
          } finally {
            // 清空状态
            lastClickIndex = null;
            currentAnimationPromise = null;
          }
        }, 2000) as unknown as number; // 适配TS类型
      } catch (error) {
        // 捕获同步代码的错误
        reject(error);
        currentAnimationPromise = null;
      }
    });
  };

  // 辅助函数：取消所有动画（可选，用于组件卸载等场景）
  const cancelAllSpinnerAnimation = () => {
    // 清除所有定时器
    spinTimerList.forEach((timer) => clearTimeout(timer));
    if (clickDelayTimer) {
      clearTimeout(clickDelayTimer);
    }

    // 拒绝未完成的Promise
    if (currentAnimationPromise) {
      currentAnimationPromise.reject("主动取消了所有动画");
      currentAnimationPromise = null;
    }

    // 重置状态
    spinTimerList = [];
    clickDelayTimer = null;
    lastClickIndex = null;
  };

  const init = () => {
    activeSpinnerIndex.value = 0;
    if (timer.value) {
      clearInterval(timer.value);
    }
    timer.value = null;
    setBaseStyle();
    // if (option.value && option.value.globalConfig && option.value.globalConfig.autoPlay) {
    //   timer.value = setInterval(
    //     () => {
    //       roateAnimate();
    //     },
    //     (option.value.globalConfig.intervalTime + option.value.globalConfig.transitionTime) * 1000
    //   );
    // }
    setTimeout(() => {
      reseting.value = false;
    }, 200);
  };

  const getControlButtonProps = (direction: string) => ({
    offsetLeftOrRight: option.value.globalConfig.controlBtnOffsetLeftOrRight,
    offsetTop: option.value.globalConfig.controlBtnOffsetTop,
    width: option.value.globalConfig.controlBtnWidth,
    height: option.value.globalConfig.controlBtnHeight,
    bgImage: setMinioUrl(
      option.value.globalConfig[`controlBtn${direction.toUpperCase()}Bg`],
    ),
  });
  onUnmounted(() => {
    cancelAllSpinnerAnimation();
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
    getControlButtonProps,
    roateAnimate,
  };
};
