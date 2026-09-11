import { computed, ref, watch } from "vue";

import { orderBy } from "lodash-es";

// ,
import { notAllowToDynamicPanel, notAllowToGroup } from "@/views/build/components/buildConfig/constants/index";

import type { PanelType } from "../core/SystemComponent/type";
import { renderSystemComponentType } from "../core/SystemComponent/type";
import type { ComponentType } from "../type";
import { ContextMenuType } from "../type";
import { useEditStore } from "./useEditStore";

export const useActionDisabled = () => {
  const { selectTargetData, componentList, fetchTargetById } = useEditStore();
  /** 是否禁用置顶 */
  const isUpDisabled = ref(true);

  /** 是否禁用置底 */
  const isDownDisabled = ref(true);

  /** 是否禁用新增案例 */
  const isAddCaseDisabled = ref(true);

  /** 是否禁用组合 */
  const isCanGroup = ref(true);

  /** 是否禁用解散分组 */
  const isCanUnGroup = ref(true);
  /** 是否禁用删除 */
  const isCalDelete = ref(true);

  const isCanTop = ref(true);

  const isCanBottom = ref(true);

  const isCanSyncStyle = ref(true);

  const isCanTranslateDynamicPanel = ref(true);

  watch(
    () => selectTargetData.value,
    () => {
      initActionDisabled();
    }
  );

  const initActionDisabled = () => {
    isDownDisabled.value = isDownDisabledFun();
    isUpDisabled.value = isUpDisabledFun();
    isAddCaseDisabled.value = isAddCaseDisabledFun();
    isCanGroup.value = isCanGroupFun();
    isCanTranslateDynamicPanel.value = isCanTranslateDynamicPanelFun();
    isCanUnGroup.value = isCanUnGroupFun();
    isCalDelete.value = isCalDeleteFun();
    isCanTop.value = isCanTopFun();
    isCanBottom.value = isCanBottomFun();
    isCanSyncStyle.value = isCanSyncStyleFun();
  };

  const isLock = () => {
    if (selectTargetData.value.length === 0) {
      return true;
    }
    const isHasLock = selectTargetData.value.some((v) => v && v.isLock);
    return isHasLock;
  };
  // 是否可以同步样式
  const isCanSyncStyleFun = () => {
    if (selectTargetData.value.length === 0 || selectTargetData.value.length > 1) {
      return true;
    } else {
      const isPanel = selectTargetData.value.some((v) =>
        renderSystemComponentType.includes(v.component.prop as PanelType)
      );
      if (isPanel) {
        return true;
      }

      const isHasPanel = selectTargetData.value.some(
        (v) => v && v.component && notAllowToGroup.find((item) => item === v.component.prop)
      );
      const isHasGroup = selectTargetData.value.some((v) => v && v.children && v.children.length > 0);

      if (isHasPanel || isHasGroup) {
        return true;
      } else {
        return false;
      }
    }
  };

  // 是否可以置顶
  const isCanTopFun = () => {
    const lock = isLock();
    const isMulti = selectTargetData.value.length > 1;
    return lock || isMulti;
  };
  // 是否可以置底
  const isCanBottomFun = () => {
    const lock = isLock();
    const isMulti = selectTargetData.value.length > 1;
    return lock || isMulti;
  };

  const isCalDeleteFun = () => {
    return isLock();
  };

  // 新增案例是否禁用
  const isAddCaseDisabledFun = () => {
    if (selectTargetData.value.length === 0 || disablePanelTypeToAddCase()) {
      return true;
    } else {
      return false;
    }

    function disablePanelTypeToAddCase(): boolean {
      const isHasPanel = selectTargetData.value.some((v) =>
        renderSystemComponentType.includes(v.component.prop as PanelType)
      );
      return isHasPanel;
    }
    // if (selectTargetData.value.length === 1) {
    //   const target = selectTargetData.value[0] || {}
    //   const isGroup = target.children && target.children.length > 0
    //   return !isGroup
    // }
    // if (selectTargetData.value.length > 1) {
    //   const isHasGroup = selectTargetData.value.some((v) => v && v.children && v.children.length > 0)
    //   return !isHasGroup
    // }
  };

  // 分组按钮可用
  const isCanGroupFun = () => {
    if (selectTargetData.value.length < 2) return true;
    const isHasPanel = selectTargetData.value.some(
      (v) => v && v.component && notAllowToGroup.find((item) => item === v.component.prop)
    );
    if (isHasPanel) {
      return true;
    }
    if (selectTargetData.value.length >= 2) {
      // 说明是和分组组合, 不能分组
      const isHasGroup = selectTargetData.value.some((v) => v && v.children && v.children.length > 0);
      // 说明是和分组内部元素组合, 不能分组
      const isHasParent = selectTargetData.value.some((v) => v && v.parent);
      return isHasGroup || isHasParent;
    }
    return false;
  };

  // 组合动态面板是否可用
  const isCanTranslateDynamicPanelFun = () => {
    if (selectTargetData.value.length < 2) return true;
    const isHasPanel = selectTargetData.value.some(
      (v) => v && v.component && notAllowToDynamicPanel.find((item) => item === v.component.prop)
    );
    if (isHasPanel) {
      return true;
    }
    if (selectTargetData.value.length >= 2) {
      // 说明是和分组组合, 不能分组
      // const isHasGroup = selectTargetData.value.some((v) => v && v.children && v.children.length > 0);
      // 说明是和分组内部元素组合, 不能分组
      const isHasParent = selectTargetData.value.some((v) => v && v.parent);

      return isHasParent;
    }
    return false;
  };

  // 解散分组是否可用
  const isCanUnGroupFun = () => {
    if (selectTargetData.value.length === 0) return true;
    if (selectTargetData.value.length === 1) {
      const isHasGroup = selectTargetData.value.some((v) => v && v.children && v.children.length > 0);
      return !isHasGroup;
    }
    if (selectTargetData.value.length > 1) {
      const isAllGroup = selectTargetData.value.every((v) => v && v.children && v.children.length > 0);
      return !isAllGroup;
    }
    return false;
  };

  // 上移是否可用
  const isUpDisabledFun = () => {
    if (selectTargetData.value.length === 0 || selectTargetData.value.length > 1) {
      return true;
    }

    const isHasLock = selectTargetData.value.some((v) => v && v.isLock);
    if (isHasLock) {
      return true;
    }
    const target = selectTargetData.value[0];
    if (!target) {
      return true;
    }
    if (!target.parent) {
      return targetIsNoParent(selectTargetData.value, ContextMenuType.UP);
    }
    return targetIsParent(selectTargetData.value, ContextMenuType.UP);
  };

  // 下移是否可用
  const isDownDisabledFun = () => {
    if (selectTargetData.value.length === 0 || selectTargetData.value.length > 1) {
      return true;
    }
    const isHasLock = selectTargetData.value.some((v) => v && v.isLock);
    if (isHasLock) {
      return true;
    }
    const target = selectTargetData.value[0];
    if (!target) {
      return true;
    }
    if (!target.parent) {
      return targetIsNoParent(selectTargetData.value, ContextMenuType.DOWN);
    }
    return targetIsParent(selectTargetData.value, ContextMenuType.DOWN);
  };

  const targetIsNoParent = (selectTargetData: ComponentType[], type: ContextMenuType) => {
    if (selectTargetData.length === 0) {
      return true;
    }
    const target = selectTargetData[0];
    const sortComponentList = orderBy(componentList.value, ["zIndex"], ["desc"]);
    const index = sortComponentList.findIndex((v) => `${v.id}` === `${target.id}`);
    return type === ContextMenuType.DOWN ? index === sortComponentList.length - 1 : index === 0;
  };

  const targetIsParent = (selectTargetData: ComponentType[], type: ContextMenuType) => {
    if (selectTargetData.length === 0) {
      return true;
    }
    const target = selectTargetData[0];

    const parent = fetchTargetById(`${target.parent}`);
    if (!parent || !parent.children) {
      return true;
    }
    const index = parent.children.findIndex((v: ComponentType) => `${v.id}` === `${target.id}`);
    return type === ContextMenuType.UP ? index === 0 : index === parent.children.length - 1;
  };

  const disabledByType = computed<Record<ContextMenuType, boolean>>(() => {
    return {
      [ContextMenuType.TOP]: isCanTop.value,
      [ContextMenuType.BOTTOM]: isCanBottom.value,
      [ContextMenuType.UP]: isUpDisabled.value,
      [ContextMenuType.DOWN]: isDownDisabled.value,
      [ContextMenuType.GROUP]: isCanGroup.value,
      [ContextMenuType.TranslateDynamicPanel]: isCanTranslateDynamicPanel.value,
      [ContextMenuType.UN_GROUP]: isCanUnGroup.value,
      [ContextMenuType.ADD_CASE]: isAddCaseDisabled.value,
      [ContextMenuType.ADD_PERSON_CASE]: isAddCaseDisabled.value,
      [ContextMenuType.DEL]: isCalDelete.value,
      [ContextMenuType.COPY]: selectTargetData.value.length === 0,
      [ContextMenuType.PASTE]: false,
      [ContextMenuType.COPY_STYLE]: isCanSyncStyle.value,
      [ContextMenuType.PASTE_STYLE]: isCanSyncStyle.value,
      [ContextMenuType.CLEAR]: selectTargetData.value.length === 0,
      [ContextMenuType.LOCK]: selectTargetData.value.length === 0,
      [ContextMenuType.UN_LOCK]: selectTargetData.value.length === 0,
      [ContextMenuType.SYNC_STYLE]: isCanSyncStyle.value
    };
  });

  const getDisabledByType = (type: ContextMenuType) => {
    initActionDisabled();
    return disabledByType.value[type];
  };

  return {
    selectTargetData,
    isDownDisabled,
    isAddCaseDisabled,
    isCanGroup,
    isCanUnGroup,
    isUpDisabled,
    getDisabledByType
  };
};
