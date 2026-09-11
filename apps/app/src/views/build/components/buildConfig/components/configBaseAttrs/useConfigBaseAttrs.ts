import { computed, ref, watch } from "vue";

// import { horizontalConstEnum, verticalConstEnum } from "./configLayoutConstraint/type";
import { horizontalConstEnum, verticalConstEnum } from "@screenwright/types";
import { ElMessage } from "element-plus";
import { has, isUndefined } from "lodash-es";

import { useScreenEditor } from "@/core-adapter/useScreenEditor";
import { useAction } from "@/views/build/components/buildRender/hooks/useAction";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { direction } from "@/views/build/components/buildRender/type";
import { handleGroupByParent, saveParentGroupData } from "@/views/build/components/buildRender/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { PanelType } from "../../../buildRender/core/SystemComponent/type";
import { useUpdateInstance } from "../../useUpdateInstance";
enum positionType {
  left = "left",
  top = "top"
}

export const useConfigBaseAttrs = () => {
  const editor = useScreenEditor();
  const { isPanel } = useEditStore();
  const { allComponentMap } = useGlobalComponentData();
  const { updateComponentLayers } = useAction({
    isDynamicPanel: isPanel()
  });
  const { update, selectTargetData, isLock } = useUpdateInstance({
    isDynamicPanel: isPanel()
  });
  const globalText = ref("");

  const enableDataAnalysisComputed = computed({
    get() {
      return selectTargetData.value[0].enableDataAnalysis ?? false;
    },
    set(value) {
      selectTargetData.value[0].enableDataAnalysis = value;
    }
  });

  const dataAnalysisNameComputed = computed({
    get() {
      return selectTargetData.value[0].dataAnalysisName ?? "";
    },
    set(value) {
      selectTargetData.value[0].dataAnalysisName = value;
    }
  });

  // 计算是否为编码面板
  const isEncodePanel = computed(() => {
    if (selectTargetData.value.length === 0) {
      return false;
    }
    const props = selectTargetData.value[0].component.prop;
    return props === PanelType.encodePanel;
  });

  // 处理 width 和 height 保存
  const handleDirectionChange = (point: direction, val: number | undefined) => {
    if (selectTargetData.value.length === 0) {
      return;
    }
    const target = selectTargetData.value[0];
    if (target.isLock) {
      return;
    }
    const isGroup = target.children && target.children.length > 0;
    if (isGroup) {
      const newWidth = point === direction.r ? val : target.component.width;
      const newHeight = point === direction.b ? val : target.component.height;
      if (newWidth === undefined || newHeight === undefined) {
        return;
      }

      handleGroupByParent({ attr: target, point, newWidth, newHeight });
      saveParentGroupData(target);
    } else {
      if (point === direction.r) {
        target.component.width = val ?? 0;
      } else {
        target.component.height = val ?? 0;
      }

      if (target.parent) {
        const parent = allComponentMap.value.get(`${target.parent}`);
        if (!parent || !parent.children) {
          return;
        }
        // 属性面板直接改成员的宽高，不经 core，父分组包围盒得在这里收口
        editor.component.reflowGroup(parent);
        saveParentGroupData(parent);
      } else {
        updateComponentLayers(target, { fullUpdateGroup: false });
      }
    }
  };

  const initConstraint = () => {
    // verticalConst horizontalConst
    if (!selectTargetData.value || !selectTargetData.value[0]) {
      return;
    }
    if (!has(selectTargetData.value[0], "verticalConst")) {
      selectTargetData.value[0].verticalConst = verticalConstEnum.Top;
      selectTargetData.value[0].horizontalConst = horizontalConstEnum.Left;
      console.log("init constraintSetting", selectTargetData.value[0]);
      // update();
    }
  };

  const constraintSettings = computed({
    get() {
      return {
        verticalConst: selectTargetData.value[0].verticalConst || verticalConstEnum.Top,
        horizontalConst: selectTargetData.value[0].horizontalConst || horizontalConstEnum.Left
      };
    },
    set(val) {
      selectTargetData.value[0].verticalConst = val.verticalConst;
      selectTargetData.value[0].horizontalConst = val.horizontalConst;
    }
  });

  watch(
    () => selectTargetData.value && selectTargetData.value[0] && selectTargetData.value[0].id,
    async () => {
      // nVal, oVal
      // console.log("选中目标变化，更新 globalText", oVal);
      // const prevComponent = allComponentMap.value.get(`${oVal}`);
      // if (prevComponent && globalText.value.length > 0) {
      //   if (prevComponent.name.length === 0) {
      //     prevComponent.name = globalText.value;
      //     const isGroup = prevComponent.children && prevComponent.children.length > 0;
      //     if (isGroup) {
      //       saveParentGroupData(prevComponent);
      //     } else {
      //       updateComponentLayers(prevComponent, { fullUpdateGroup: false });
      //     }
      //     globalText.value = "";
      //   }
      // }

      initConstraint();
    }
  );
  const handleBlur = () => {
    const target = selectTargetData.value[0];
    console.log("失去焦点", target.name);
    // if(globalText.value !== target.name) {}
    if (!target) {
      return;
    }
    if (target.name.length === 0) {
      target.name = globalText.value;
      const isGroup = target.children && target.children.length > 0;
      if (isGroup) {
        saveParentGroupData(target);
      } else {
        updateComponentLayers(target, { fullUpdateGroup: false });
      }
      globalText.value = "";
    }
  };

  const handleFocus = () => {
    const target = selectTargetData.value[0];
    if (target) {
      globalText.value = target.name;
    }
    console.log("获得焦点", target.name);
  };

  // 处理name保存
  const handleChangeInput = (val: string) => {
    if (selectTargetData.value.length === 0) {
      return;
    }
    const target = selectTargetData.value[0];
    if (target.isLock) {
      return;
    }
    if (!val || val.length === 0) {
      target.name = "";
      ElMessage.error("不可空白命名");
      return;
    }
    target.name = val;
    const isGroup = target.children && target.children.length > 0;
    if (isGroup) {
      saveParentGroupData(target);
    } else {
      updateComponentLayers(target, { fullUpdateGroup: false });
    }
  };

  // 处理 left 和 top 保存
  const handlePosition = (type: positionType, val: number | undefined) => {
    if (selectTargetData.value.length === 0 || isUndefined(val)) {
      return;
    }
    const target = selectTargetData.value[0];
    if (target.isLock) {
      return;
    }
    const isGroup = target.children && target.children.length > 0;
    if (isGroup) {
      const dis = val - target[type];
      const children = target.children || [];
      for (let i = 0; i < children.length; i++) {
        const t = children[i];
        t[type] = target.isOuter ? dis + t[type] : t[type];
      }
      target[type] = val;
      saveParentGroupData(target);
    } else {
      if (target.parent) {
        const parent = allComponentMap.value.get(`${target.parent}`);
        if (!parent || !parent.children) {
          return;
        }
        target[type] = val;
        // 同上：改的是成员的 left/top
        editor.component.reflowGroup(parent);
        saveParentGroupData(parent);
      } else {
        target[type] = val;
        update();
      }
    }
  };

  // 控制光标样式的标识
  const isClickable = computed(() => {
    // 这里可以根据你的业务逻辑来判断
    // 比如某个状态为 true 时显示可点击光标
    return selectTargetData.value.length > 0 && !isLock.value;
  });

  // 动态光标样式类名
  const getCursorClass = (shouldShowCursor: boolean, enableCtrlClick = false) => {
    return {
      "cursor-pointer": shouldShowCursor && isClickable.value,
      "cursor-not-allowed": isLock.value,
      "cursor-default": !shouldShowCursor && !isLock.value && !enableCtrlClick,
      "cursor-ctrl-hover": enableCtrlClick && !isLock.value
    };
  };

  return {
    // 状态和计算属性
    selectTargetData,
    isLock,
    isEncodePanel,
    enableDataAnalysisComputed,
    dataAnalysisNameComputed,
    isClickable,
    positionType,
    constraintSettings,

    // 方法
    handleDirectionChange,
    handleChangeInput,
    handlePosition,
    getCursorClass,
    update,
    handleBlur,
    handleFocus,
    initConstraint
  };
};
