import { computed, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import { onClickOutside } from "@vueuse/core";

import type { LargeScreenDetailInfo } from "@screenwright/types";

import { setMinioUrl } from "@/utils/config";

import { useHistoryData } from "../../../command/useHistoryData";
import { buildRenderIgnore } from "../../buildConfig/constants/index";
import type { ComponentType } from "../type";
import { useAction } from "./useAction";
import { useEditStore } from "./useEditStore";
import { useFtTextEdit } from "./useFtTextEdit";
import { useMenuAction } from "./useMenuAction";
import { useMouseHandle } from "./useMouseHandle";

export interface BaseRenderOptions {
  isDynamicPanel?: boolean;
  onEnterDynamicPanel?: (item: ComponentType) => void;
  onDbClick?: (e: MouseEvent, item: ComponentType) => void;
}
const matchesSelector = (el: Element, selector: string) => {
  const anyEl = el as Element & {
    matchesSelector?: (selectorText: string) => boolean;
    msMatchesSelector?: (selectorText: string) => boolean;
    webkitMatchesSelector?: (selectorText: string) => boolean;
  };
  const matcher = anyEl.matches || anyEl.matchesSelector || anyEl.msMatchesSelector || anyEl.webkitMatchesSelector;
  return typeof matcher === "function" ? matcher.call(el, selector) : false;
};

const closestBySelector = (el: Element | null, selector: string) => {
  let current: Element | null = el;
  while (current) {
    if (matchesSelector(current, selector)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

const isIgnoredTarget = (target: EventTarget | null) => {
  const targetElement = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  if (!targetElement) {
    return false;
  }
  return buildRenderIgnore.some((selector) => Boolean(closestBySelector(targetElement, selector)));
};

export const useBaseRender = (
  props: {
    modelValue: ComponentType[];
    editConfig: LargeScreenDetailInfo;
    disabled: boolean;
  },
  options: BaseRenderOptions = {}
) => {
  const { isDynamicPanel = false, onEnterDynamicPanel, onDbClick } = options;
  const { clearHistory } = useHistoryData();
  const { setTargetSelectChart, targetChart, editCanvas, isBuild } = useEditStore();
  const { loading } = useAction({ isDynamicPanel });
  const { handleContextMenu } = useMenuAction();
  const editorRef = ref();
  const router = useRouter();

  const { resetTextEdit } = useFtTextEdit();
  // 点击画布外侧取消选中
  onClickOutside(
    editorRef,
    async (e: MouseEvent) => {
      if (isIgnoredTarget(e.target)) {
        return;
      }

      const eventPath =
        typeof (e as PointerEvent & { composedPath?: () => EventTarget[] }).composedPath === "function"
          ? (e as PointerEvent & { composedPath: () => EventTarget[] }).composedPath()
          : [];

      if (eventPath.length && eventPath.some((target) => isIgnoredTarget(target))) {
        return;
      }
      // 防止 onClickOutside 的 ignore 不生效
      for (const ignore of buildRenderIgnore) {
        const ele = document.querySelectorAll(ignore);

        if (Array.from(ele).includes(e.target as HTMLElement)) {
          return;
        }
      }

      await nextTick();
      resetTextEdit(e);
      setTargetSelectChart(undefined);
    },
    {
      ignore: [...buildRenderIgnore]
    }
  );

  const { mouseenterHandle, mouseleaveHandle, mouseClickHandle, mousedownHandle, mousedownBoxSelect } = useMouseHandle({
    isDynamicPanel
  });

  const data = computed(() => {
    return [...props.modelValue].sort((a, b) => b.zIndex - a.zIndex).reverse();
  });

  // 是否显示背景图片
  const isShowImage = computed(() => {
    return (
      props.editConfig.showBackgroundImage &&
      props.editConfig.backgroundImage &&
      props.editConfig.backgroundImage.length > 0
    );
  });

  // 画布背景样式
  const btStyleAttrs = computed(() => {
    const backgroundImage = props.editConfig.backgroundImage
      ? `url(${setMinioUrl(props.editConfig.backgroundImage)})`
      : "none";

    let bgStyle = {};

    if (isShowImage.value) {
      bgStyle = {
        backgroundImage,
        backgroundSize: "100% 100%"
      };
    } else {
      bgStyle = {
        background: props.editConfig.backgroundColor
      };
    }

    return {
      ...bgStyle,
      width: "100%",
      height: "100%"
    };
  });

  const editorStyle = computed(() => {
    const { width, height } = props.editConfig;
    return {
      width: width + "px",
      height: height + "px",
      transform: `scale(1,1) translateX(0)`,
      transformOrigin: "top left"
    };
  });

  const handleDbClick = (e: MouseEvent, item: ComponentType) => {
    if (onDbClick) {
      clearHistory();
      onDbClick(e, item);
    }
  };

  const enterDynamicPanel = (item: ComponentType) => {
    if (!item?.id) {
      console.error("无效的面板项，缺少ID");
      return;
    }

    targetChart.value.selectId = [];
    clearHistory();

    if (onEnterDynamicPanel) {
      onEnterDynamicPanel(item);
    }
  };

  return {
    // 响应式引用
    editorRef,
    loading,
    targetChart,
    editCanvas,
    isBuild,

    // 计算属性
    data,
    isShowImage,
    btStyleAttrs,
    editorStyle,

    // 方法
    handleContextMenu,
    mouseenterHandle,
    mouseleaveHandle,
    mouseClickHandle,
    mousedownHandle,
    mousedownBoxSelect,
    handleDbClick,
    enterDynamicPanel,
    router,
    clearHistory
  };
};
