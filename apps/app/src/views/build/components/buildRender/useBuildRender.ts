import { computed, nextTick, toRefs } from "vue";
import { useRoute } from "vue-router";

import type { LargeScreenDetailInfo } from "@screenwright/types";

import { textEnum } from "@/components/componentEntry/type";
import { setMinioUrl } from "@/utils/config";

import { AdaptationType } from "../buildConfig/graphConfig/options";
import { PanelType } from "./core/SystemComponent/type";
import { useBaseRender } from "./hooks/useBaseRender";
import { useFtTextEdit } from "./hooks/useFtTextEdit";
import { useMouseHandle } from "./hooks/useMouseHandle";
import type { ComponentType } from "./type";

export const useBuildRender = (props: {
  modelValue: ComponentType[];
  editConfig: LargeScreenDetailInfo & { enableScroll?: boolean };
  disabled: boolean;
}) => {
  const { editConfig, disabled } = toRefs(props);
  const route = useRoute();
  const { setTextEdit } = useFtTextEdit();
  const { handleDbClick } = useMouseHandle();

  const baseRender = useBaseRender(props, {
    isDynamicPanel: false,
    onDbClick: async (e: MouseEvent, item: ComponentType) => {
      handleDbClick(e, item);

      if (item.component.prop === PanelType.dynamicPanel && isBuild.value) {
        if (item.isLock) {
          return;
        }
        await onEnterDynamicPanel(item);
      }

      if (item.component.prop === textEnum.FtText && isBuild.value) {
        setTextEdit(item);
      }
    }
  });

  const isBuild = computed(() => route && route.name === "build");

  // 画布滤镜样式
  const filterAttrs = computed(() => {
    const hueRotate = editConfig.value.screenFilterInfo?.hueRotate || 0;
    const saturate = editConfig.value.screenFilterInfo?.saturate || 0;
    const brightness = editConfig.value.screenFilterInfo?.brightness || 0;
    const contrast = editConfig.value.screenFilterInfo?.contrast || 0;
    const grayscale = editConfig.value.screenFilterInfo?.grayscale || 0;
    const showScreenFilter = editConfig.value.showScreenFilter;
    return showScreenFilter
      ? {
          filter: `blur(0px) brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) hue-rotate(${hueRotate}deg) saturate(${saturate}%)`
        }
      : {};
  });

  const getOverflow = (enableScroll?: boolean) => {
    if (enableScroll === undefined) {
      return {};
    }
    return {
      overflow: enableScroll ? "auto" : "hidden"
    };
  };

  // 重写 editorStyle 来支持滤镜和滚动
  const editorStyle = computed(() => {
    const { width, height, enableScroll, adaptationType } = editConfig.value;
    const { width: _, height: __, ...btStyleWithoutSize } = baseRender.btStyleAttrs.value;

    if (adaptationType === AdaptationType.constraint && !isBuild.value) {
      return {
        width: "100%",
        height: "100%",
        transform: `scale(1.001,1.001)`,
        transformOrigin: "top left",
        ...filterAttrs.value,
        ...btStyleWithoutSize,
        ...getOverflow(enableScroll)
      };
    } else {
      return {
        width: width + "px",
        height: height + "px",
        transform: `scale(1.001,1.001)`,
        transformOrigin: "top left",
        ...filterAttrs.value,
        ...btStyleWithoutSize,
        ...getOverflow(enableScroll)
      };
    }
  });

  // 重写 btStyleAttrs 来支持 build 页面特有的样式
  const btStyleAttrs = computed(() => {
    const backgroundImage = editConfig.value.backgroundImage
      ? `url(${setMinioUrl(editConfig.value.backgroundImage)})`
      : "none";

    const isShowImage =
      editConfig.value.showBackgroundImage &&
      editConfig.value.backgroundImage &&
      editConfig.value.backgroundImage.length > 0;

    return isShowImage
      ? {
          backgroundImage,
          backgroundSize: "100% 100%"
        }
      : {
          background: editConfig.value.backgroundColor
        };
  });

  const handleEditorMouseDown = (e: MouseEvent) => {
    if (disabled.value) {
      return;
    }
    baseRender.mousedownBoxSelect(e);
  };

  const onEnterDynamicPanel = async (item: ComponentType) => {
    const { id } = item;
    if (!item?.id) {
      console.error("无效的面板项，缺少ID");
      return;
    }

    baseRender.targetChart.value.selectId = [];

    await nextTick();
    baseRender.clearHistory();
    const isDynamicPanel = item.component.prop === PanelType.dynamicPanel;

    if (isBuild.value && isDynamicPanel) {
      baseRender.router.push({
        name: "panel",
        params: { cid: id }
      });
    }
  };

  return {
    ...baseRender,
    isBuild,

    // 重写的计算属性
    btStyleAttrs,
    filterAttrs,
    editorStyle,

    // 扩展的方法
    handleEditorMouseDown,
    onEnterDynamicPanel
  };
};
