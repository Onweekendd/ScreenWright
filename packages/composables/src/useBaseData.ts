import { setPx } from "@screenwright/core";
import type { AllComponentType, ChildComponent, ComponentType, Event } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import type { CSSProperties, WritableComputedRef } from "vue";
import { computed } from "vue";

import { useEncodeEvent, useEvent } from "./event";
import { getBaseDataExtraEvents } from "./ports/baseDataPort";
import { useBaseFilter } from "./useBaseFilter";

interface BaseDataEventParams {
  id?: string | number;
  triggerType: EventTypeEnum;
  events?: Event[];
  throwValue?: unknown;
  isExecuteOnlyInViewMod?: boolean;
  isExecuteOnlyConditionSatisfied?: boolean;
}

/** 获取 CSS 动画结束事件名（兼容各浏览器前缀），纯 DOM 逻辑，无 app 耦合 */
const getAnimationType = (element: HTMLElement): string => {
  const animations = {
    animation: "animationend",
    OAnimation: "oAnimationEnd",
    MozAnimation: "animationend",
    WebkitAnimation: "webkitAnimationEnd"
  };

  for (const i in animations) {
    if (element.style[i as keyof CSSStyleDeclaration] !== undefined) {
      return animations[i as keyof typeof animations];
    }
  }
  return animations.animation;
};

/**
 * 每个物料组件的基底 composable：尺寸/展示态/数据绑定/事件转发/编码联动。
 * 事件触发/终端编码通信直接调用本包的 useEvent/useEncodeEvent；蓝图追加事件通过
 * initBaseDataExtraEvents 注入（依赖后端 HTTP 拉取，仍留在 app）。
 */
export const useBaseData = <Prop extends AllComponentType = AllComponentType, Option = any, DataChart = any>(
  baseComponent: ComponentType<Prop, Option>
) => {
  const { inputData, initData } = useBaseFilter(baseComponent as ComponentType | ChildComponent);
  const dataChart = computed({
    get() {
      return inputData.value as DataChart;
    },
    set(value: DataChart) {
      inputData.value = value;
    }
  }) as WritableComputedRef<DataChart>;

  const events = computed(() => baseComponent.events || []);
  const encodes = computed(() => baseComponent.encodes || []);
  const height = computed(() => baseComponent.component.height);
  const width = computed(() => baseComponent.component.width);
  const option = computed<typeof baseComponent.option>(() => baseComponent.option);
  const isEdit = computed(() => baseComponent.isEdit);
  const id = computed(() => baseComponent.id);
  const autoplay = computed(() => baseComponent.autoplay);
  const component = computed(() => baseComponent.component);
  const display = computed(() => baseComponent.display);
  const cbArgs = computed(() => baseComponent.cbArgs);
  const minWidth = computed(() => (baseComponent.option as any)?.minWidth);
  const presetChild = computed(() => (baseComponent.presetChild ? baseComponent.presetChild : []));

  // 使用 getter 属性模拟 computed 行为，保持 .value 访问模式
  const isBuild = {
    get value() {
      return window.location.href.includes("/build");
    }
  };
  const isView = {
    get value() {
      return window.location.href.includes("/view");
    }
  };
  const isShare = {
    get value() {
      return window.location.href.includes("/shareScreen");
    }
  };

  const handleEvents = (params: BaseDataEventParams) => {
    useEvent().handleEvents({
      id: params.id,
      triggerType: params.triggerType,
      events: params.events ?? [],
      throwValue: (params.throwValue ?? {}) as Record<string, any>,
      isExecuteOnlyInViewMod: params.isExecuteOnlyInViewMod,
      isExecuteOnlyConditionSatisfied: params.isExecuteOnlyConditionSatisfied
    });
  };

  const handleAllEvents = (params: BaseDataEventParams) => {
    useEvent().handleEventAndCallbackEvent({
      id: params.id,
      triggerType: params.triggerType,
      events: [...(params.events || []), ...(params.id ? getBaseDataExtraEvents(params.id) : [])],
      throwValue: (params.throwValue ?? {}) as Record<string, any>,
      isExecuteOnlyInViewMod: params.isExecuteOnlyInViewMod ?? params.triggerType === EventTypeEnum.DataChange,
      isExecuteOnlyConditionSatisfied:
        params.isExecuteOnlyConditionSatisfied === undefined ? true : params.isExecuteOnlyConditionSatisfied
    });
  };

  const componentClasses = computed(() => ({
    "component-bind-events": true,
    "has-bind": events.value?.length && isBuild.value,
    "has-encode": encodes.value?.length && isBuild.value
  }));

  const styleSizeName = computed<CSSProperties>(() => {
    if ((baseComponent.option as any).minWidth) {
      if ((baseComponent.option as any).minWidth > width.value) {
        return (baseComponent.option as any).minWidth;
      }
      return {
        width: setPx(`${width.value}`),
        height: setPx(`${height.value}`),
        overflowX: "auto",
        overflowY: "hidden"
      };
    } else {
      return {
        width: setPx(`${width.value}`),
        height: setPx(`${height.value}`)
      };
    }
  });

  const updateData = (value: any) => {
    baseComponent.data = value;
  };

  const handleEncode = (throwValue: any) => {
    useEncodeEvent().handleEncodeEventThrottled({
      sourceComponent: baseComponent as ComponentType,
      encodes: encodes.value,
      throwValue
    });
  };

  const clickFormatter = (item: any) => {
    const fomatterFunction = new Function(`return ${(baseComponent as any).clickFormatter}`);
    return fomatterFunction(item);
  };

  return {
    height,
    minWidth,
    width,
    dataChart,
    component,
    option,
    isBuild,
    styleSizeName,
    id,
    isEdit,
    autoplay,
    events,
    encodes,
    cbArgs,
    isView,
    isShare,
    componentClasses,
    presetChild,
    display,
    initData,
    updateData,
    handleEvents,
    handleEventAndCallbackEvent: handleAllEvents,
    handleEncode,
    getAnimationType,
    clickFormatter
  };
};
