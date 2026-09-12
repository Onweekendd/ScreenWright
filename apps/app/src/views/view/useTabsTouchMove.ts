// 若需要手动解绑，引入Vue的生命周期钩子（自动解绑版无需）
// import { onUnmounted, ref } from "vue";

import { type ComponentType, InteractiveEnum } from "@screenwright/types";

import { useActionEvent } from "@/hooks/eventHandling/useActionEvent";

// 引入封装的滑动Hook和类型
import { type TouchDirection, useDomTouch } from "./useDomTouch";
export const useTabsTouchMove = () => {
  const { eventList } = useActionEvent();
  // 🌟 核心：定义变量存储useDomTouch的返回结果，用于后续手动解绑（关键）
  let touchHookInstance: ReturnType<typeof useDomTouch> | null = null;

  const initTabsTouchMove = (componentList: ComponentType[]) => {
    console.log(componentList, "componentList");
    // 1. 获取目标DOM容器（子标签滚动的容器）
    const renderDom = document.getElementById("render-container");
    // 2. 原业务：过滤需要跟随画布滑动的子标签配置
    const isTouchingScroll = [InteractiveEnum.Subtabs];
    const filterTouchingScroll = componentList
      .filter((v) => isTouchingScroll.includes(v.component.prop as InteractiveEnum))
      .filter((v) => v.option.followCanvasSlide);

    // 🌟 核心逻辑：有符合条件的子标签，才初始化滑动事件（避免无意义绑定）
    if (filterTouchingScroll.length > 0 && renderDom) {
      console.log("初始化子标签触摸滚动", filterTouchingScroll);
      touchHookInstance = useDomTouch(
        renderDom, // 绑定目标DOM（直接传原生元素，Hook兼容MaybeRef/原始元素）
        (direction) => {
          handleTabsTouch(direction, filterTouchingScroll);
        }, // 滑动/点击的核心业务回调
        {
          minDistance: 5 // 🔧 自定义滑动阈值（建议调大，避免误触，原默认2）
          // forceTouch: true, // 可选：强制开启触摸模式（移动端场景可开）
        }
      );
    } else {
      if (touchHookInstance) {
        touchHookInstance.unbindEvents();
        touchHookInstance = null;
      }
      console.log("无需要跟随滑动的子标签，移除触摸滚动事件");
    }
  };

  // 🌟 子标签滑动的业务回调：处理左/右滑动核心逻辑（上下滑动忽略）
  const handleTabsTouch = (direction: TouchDirection, filterTouchingScroll: ComponentType[]) => {
    console.log("子标签容器滑动方向：", direction);
    // 核心业务：只处理【左/右】滑动（子标签一般是横向滚动），忽略上下/点击
    switch (direction) {
      case "left":
        // 左滑逻辑：子标签容器 向右滚动（跟随画布左滑）
        handleTabsScroll("right", filterTouchingScroll);
        break;
      case "right":
        // 右滑逻辑：子标签容器 向左滚动（跟随画布右滑）
        handleTabsScroll("left", filterTouchingScroll);
        break;
      // 上下滑动/点击：无操作，直接return
      case "up":
      case "down":
      case "click":
      default:
        return;
    }
  };

  const handleTabsScroll = (scrollDir: "left" | "right", filterTouchingScroll: ComponentType[]) => {
    console.log(scrollDir, "scrollDir", filterTouchingScroll);
    console.log(eventList.value, "scrollDirscrollDirscrollDirscrollDir");
    // const subTabsInstance = eventList.value["subtabs-2749019"];
    // console.log(subTabsInstance, "subTabsInstance");
    for (let i = 0; i < filterTouchingScroll.length; i++) {
      const target = filterTouchingScroll[i];
      const prefix = `${target.component.prop}-${target.id}` as any;
      const subTabsInstance = eventList.value[prefix];
      if (subTabsInstance) {
        if (scrollDir === "right") {
          const nextIndex = target.option.active;
          if (nextIndex >= (target.data.length || 0)) {
            return;
          }
          target.option.active++;

          console.log(nextIndex, "nextIndexright");
          subTabsInstance.handleClick({
            label: target.data[nextIndex]?.label || "",
            value: nextIndex
          });
        } else if (scrollDir === "left") {
          console.log(target.option.active, "target.option.active");
          const nextIndex = target.option.active;
          if (nextIndex <= 1) {
            return;
          }
          target.option.active--;

          console.log(nextIndex, "nextIndexright");
          subTabsInstance.handleClick({
            label: target.data[nextIndex]?.label || "",
            value: nextIndex
          });
        }
      }
    }
    // if (subTabsInstance) {
    //   subTabsInstance.handleClick({
    //     label: "区域点击",
    //     value: 2
    //   });
    // }
    // handleEventAndCallbackEvent({
    //   throwValue: {
    //     label: "区域点击",
    //     value: 1
    //   },
    //   events: [
    //     {
    //       name: "事件",
    //       id: uuid(),
    //       trigger: EventTypeEnum.Click,
    //       actions: [{ action: ActionTypeEnum.SetIndex, id: uuid(), component: ["$component(2749019)"] } as Action]
    //     }
    //   ],
    //   isExecuteOnlyConditionSatisfied: false,
    //   triggerType: type,
    //   id: props.element.id
    // });
  };

  // 🌟 手动解绑方法：对外暴露，可在组件/业务需要时主动解绑（比如切换页面、刷新组件）
  const unbindTabsTouch = () => {
    if (touchHookInstance) {
      touchHookInstance.unbindEvents();
      touchHookInstance = null;
      console.log("主动解绑子标签触摸滚动事件");
    }
  };

  return {
    initTabsTouchMove, // 初始化触摸滚动
    unbindTabsTouch, // 主动解绑事件（对外暴露）
    handleTabsTouch // 可选：暴露滑动回调，方便外部扩展
  };
};
