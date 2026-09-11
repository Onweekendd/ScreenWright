import { toRaw } from "vue";
import { onBeforeUnmount, onMounted, watch } from "vue";
import { createGlobalState } from "@vueuse/core";

import { ElMessage } from "element-plus";
import { debounce } from "lodash-es";

import { updateLargeScreen } from "@/api/library";
import { uuid } from "@/utils/utils";
import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { useGlobalAnimation } from "@/views/build/components/buildRender/hooks/useGlobalAnimation";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { usePanelData } from "@/views/build/components/panelEditor/usePanelData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import type { ActiveAnimationList, AnimationItem, ComponentSettingItem } from "./type";
import { useCustomAnimationData } from "./useCustomAnimationData";
import {
  addLocalProperty,
  filterLocalProperty,
  getNewAnimationListAfterComponentOperation,
  highlightComponent,
  isAnimationAvailable,
  removeComponentIdFromAllAnimations,
  updateAnimationList,
  updateRemoteData,
  updateRemoteDataThrottle
} from "./util";

/**
 * 自定义动画操作层 hooks
 * 包含所有复杂业务逻辑、异步操作和历史记录功能
 * 依赖 useCustomAnimationData 提供数据支持
 */
export const useCustomAnimation = createGlobalState(() => {
  const { navInfo } = useLargeScreenInfo();
  const { triggerRegistry } = useGlobalAnimation();
  const { allComponentMap } = useGlobalComponentData();

  // 获取数据层实例
  const { history, canUndo, canRedo, ...dataLayer } = useCustomAnimationData();

  const { activeStatusId, panelInfo } = usePanelData();

  watch(
    () => activeStatusId.value,
    (newVal) => {
      if (!dataLayer.showCustomAnimation.value) {
        return;
      }

      const currentAnimationList = dataLayer.getCurrentAnimationList({
        panelId: panelInfo.value.config.id,
        statusId: newVal
      });

      if (currentAnimationList.length > 0) {
        dataLayer.setSelectId(currentAnimationList[0].id);
      }

      clearHistory();
    }
  );

  // ==================== 进度动画控制 ====================

  /** 进度监控定时器 */
  let progressTimer: NodeJS.Timeout | null = null;

  /** 开始进度动画 */
  const startProgressAnimation = (maxTime: number) => {
    dataLayer.setMaxProgressTime(maxTime);
    dataLayer.setProgressRunning(true);

    // 清除之前的定时器
    if (progressTimer) {
      clearTimeout(progressTimer);
    }

    // 设置新的定时器，在maxTime后自动停止
    progressTimer = setTimeout(() => {
      stopProgressAnimation();
      dataLayer.changePlay(false);
    }, maxTime);
  };

  /** 停止进度动画 */
  const stopProgressAnimation = () => {
    dataLayer.setProgressRunning(false);
    dataLayer.setMaxProgressTime(0);

    // 清除定时器
    if (progressTimer) {
      clearTimeout(progressTimer);
      progressTimer = null;
    }
  };

  // ==================== 复杂业务逻辑方法 ====================

  onMounted(() => {
    // 初始化事件监听器
    initEventListeners();
  });

  onBeforeUnmount(() => {
    // 销毁事件监听器
    destroyEventListeners();
  });

  /**
   * 停止当前播放的动画
   * @param animationId 可选，指定要停止的动画ID，不传则使用当前选中的动画
   */
  const stopCurrentAnimation = (animationId?: string) => {
    if (dataLayer.isPlay.value && (animationId || dataLayer.selectId.value)) {
      const targetId = animationId || dataLayer.selectId.value;
      const currentAnimation = dataLayer.animationList.value.find((item) => item.id === targetId);
      if (currentAnimation) {
        stopProgressAnimation();
        triggerAnimationStop(currentAnimation);
        dataLayer.changePlay(false);
      }
    }
  };

  /** 打开编辑 */
  const openEdit = () => {
    if (dataLayer.showCustomAnimation.value) {
      return;
    }
    dataLayer.setShowCustomAnimation(true);
    if (dataLayer.animationList.value.length > 0) {
      dataLayer.setSelectId(dataLayer.animationList.value[0].id);
    } // 默认选中第一个
  };

  /** 选择动画 */
  const onAnimationSelect = (id: string) => {
    if (id === dataLayer.selectId.value) {
      return;
    }

    // 如果当前正在播放动画且切换到不同的动画，则停止当前动画
    if (dataLayer.isPlay.value && dataLayer.selectId.value && dataLayer.selectId.value !== id) {
      stopCurrentAnimation();
    }

    if (dataLayer.selectId.value) {
      dataLayer.updateAnimationListState((draft) => {
        const index = draft.findIndex((v) => v.id === dataLayer.selectId.value);
        if (index !== -1) {
          draft[index].isRename = false;
        }
      });
    }
    dataLayer.setSelectId(id);
  };

  /** 关闭编辑 */
  const closeEdit = () => {
    // 关闭编辑器时，如果有动画正在播放，则停止播放
    stopCurrentAnimation();

    dataLayer.setShowCustomAnimation(false);
    dataLayer.resetTimeLineScrollLeft();
    dataLayer.resetEditorHeight();
    clearHistory();
  };

  /** 开始重命名 */
  const onStartRename = () => {
    dataLayer.updateAnimationListState((draft) => {
      const index = draft.findIndex((v) => v.id === dataLayer.selectId.value);
      if (index !== -1) {
        draft[index].isRename = true;
      }
    });
  };

  /** 修改名称 */
  const onChangeName = (payload: { id: string; name: string; isFirstChange?: boolean }) => {
    const { id, name, isFirstChange = false } = payload;

    // 如果是第一次更改，保存历史
    if (isFirstChange) {
      saveHistory();
    }

    dataLayer.updateAnimationListState((draft) => {
      const index = draft.findIndex((v) => v.id === id);
      if (index !== -1) {
        draft[index].name = name;
      }
    });
  };

  /** 结束重命名 */
  const onEndRename = () => {
    dataLayer.updateAnimationListState((draft) => {
      const index = draft.findIndex((v) => v.id === dataLayer.selectId.value);
      if (index !== -1) {
        draft[index].isRename = false;
      }
    });
  };

  /** 选择组件 */
  const selectComponent = (componentId: number) => {
    if (dataLayer.showCustomAnimation.value && dataLayer.selectId.value) {
      dataLayer.updateAnimationListState((draft) => {
        const item = draft.find((v) => v.id === dataLayer.selectId.value);
        if (item) {
          const componentIndex = item.componentSetting.findIndex((v) => v.id === componentId);
          if (componentIndex === -1) {
            const newComponentSetting: ComponentSettingItem = {
              id: componentId,
              animationType: "none",
              direction: "none",
              timingFunction: "none",
              delay: 0,
              duration: 0,
              type: "none"
            };
            item.componentSetting.push(newComponentSetting);
          } else {
            item.componentSetting.splice(componentIndex, 1);
          }
        }
      });
    }
  };

  /** 初始化动画 */
  const onAnimationInit = () => {
    if (!navInfo.value.aniFrameSet) {
      return;
    }

    const aniFrameSet = toRaw(navInfo.value.aniFrameSet);
    const { animationList, activeAnimationList } = aniFrameSet;

    dataLayer.onAnimationListUpdate({ animationList: animationList ? addLocalProperty(animationList) : [] });
    dataLayer.onActiveAnimationListUpdate({ activeAnimationList: activeAnimationList ?? [] });
  };

  // ==================== 历史记录相关 ====================

  /** 保存历史记录 */
  const saveHistory = () => {
    if (history.undoList.length >= 20) {
      history.undoList.shift();
    }

    // 临时记录并移除所有动画项的isRename状态，确保不会被保存到历史
    const isRenameMap: { [key: string]: boolean } = {};
    dataLayer.updateAnimationListState((draft) => {
      draft.forEach((animation) => {
        if (animation.isRename) {
          isRenameMap[animation.id] = true;
          animation.isRename = false;
        }
      });
    });

    // Immer 已经保证 animationList 不可变，activeAnimationList 使用 JSON 深拷贝
    const currentState = {
      animationList: dataLayer.animationList.value, // Immer 状态已经不可变
      activeAnimationList: JSON.parse(JSON.stringify(dataLayer.activeAnimationList.value))
    };

    history.undoList.push(currentState);
    history.redoList = [];

    // 恢复之前的isRename状态
    if (Object.keys(isRenameMap).length > 0) {
      dataLayer.updateAnimationListState((draft) => {
        Object.keys(isRenameMap).forEach((id) => {
          const index = draft.findIndex((v) => v.id === id);
          if (index !== -1) {
            draft[index].isRename = true;
          }
        });
      });
    }
  };

  /** 清除历史记录 */
  const clearHistory = () => {
    history.undoList = [];
    history.redoList = [];
  };

  /** 撤销 */
  const undo = () => {
    if (history.undoList.length === 0) {
      return;
    }

    stopCurrentAnimation();

    // 记录现有的isRename状态
    const currentIsRenameMap: { [key: string]: boolean } = {};
    dataLayer.animationList.value.forEach((animation) => {
      if (animation.isRename) {
        currentIsRenameMap[animation.id] = true;
      }
    });

    // 在保存前临时移除isRename状态
    dataLayer.updateAnimationListState((draft) => {
      draft.forEach((animation) => {
        if (animation.isRename) {
          animation.isRename = false;
        }
      });
    });

    // 保存当前状态到redoList
    const currentState = {
      animationList: dataLayer.animationList.value, // Immer 状态已经不可变
      activeAnimationList: JSON.parse(JSON.stringify(dataLayer.activeAnimationList.value))
    };

    if (history.redoList.length >= 20) {
      history.redoList.shift();
    }

    history.redoList.push(currentState);

    // 恢复undoList中的状态
    const previousState = history.undoList.pop();
    if (previousState) {
      dataLayer.onAnimationListUpdate({ animationList: previousState.animationList });
      dataLayer.onActiveAnimationListUpdate({ activeAnimationList: previousState.activeAnimationList });
    }

    // 恢复之前记录的isRename状态
    if (Object.keys(currentIsRenameMap).length > 0) {
      dataLayer.updateAnimationListState((draft) => {
        Object.keys(currentIsRenameMap).forEach((id) => {
          const index = draft.findIndex((v) => v.id === id);
          if (index !== -1) {
            draft[index].isRename = true;
          }
        });
      });
    }
  };

  /** 重做 */
  const redo = () => {
    if (history.redoList.length === 0) {
      return;
    }

    stopCurrentAnimation();

    // 记录现有的isRename状态
    const currentIsRenameMap: { [key: string]: boolean } = {};
    dataLayer.animationList.value.forEach((animation) => {
      if (animation.isRename) {
        currentIsRenameMap[animation.id] = true;
      }
    });

    // 在保存前临时移除isRename状态
    dataLayer.updateAnimationListState((draft) => {
      draft.forEach((animation) => {
        if (animation.isRename) {
          animation.isRename = false;
        }
      });
    });

    // 保存当前状态到undoList
    const currentState = {
      animationList: dataLayer.animationList.value, // Immer 状态已经不可变
      activeAnimationList: JSON.parse(JSON.stringify(dataLayer.activeAnimationList.value))
    };

    if (history.undoList.length >= 20) {
      history.undoList.shift();
    }

    history.undoList.push(currentState);

    // 恢复redoList中的状态
    const nextState = history.redoList.pop();
    if (nextState) {
      dataLayer.onAnimationListUpdate({ animationList: nextState.animationList });
      dataLayer.onActiveAnimationListUpdate({ activeAnimationList: nextState.activeAnimationList });
    }

    // 恢复之前记录的isRename状态
    if (Object.keys(currentIsRenameMap).length > 0) {
      dataLayer.updateAnimationListState((draft) => {
        Object.keys(currentIsRenameMap).forEach((id) => {
          const index = draft.findIndex((v) => v.id === id);
          if (index !== -1) {
            draft[index].isRename = true;
          }
        });
      });
    }
  };

  // ==================== 异步操作方法 ====================

  /** 防抖保存历史记录 */
  const saveHistoryDebounced: (() => void) & { cancel: () => void; flush: () => void } = debounce(
    () => {
      saveHistory();
    },
    300,
    {
      leading: true,
      trailing: false
    }
  );

  /** 添加动画 */
  const onAddAnimation = async (params: { panelId?: number; statusId?: string }) => {
    const { panelId, statusId } = params;
    saveHistory();

    const newAnimation: AnimationItem = {
      id: uuid(32),
      name: `动画${dataLayer.animationList.value.length + 1}`,
      isRename: false,
      componentSetting: [],
      isEnable: true,
      panelId,
      statusId
    };

    const newAnimationList = [...dataLayer.animationList.value, newAnimation];

    dataLayer.onAnimationListUpdate({ animationList: newAnimationList });
    onAnimationSelect(newAnimation.id);

    try {
      const { code } = await updateLargeScreen({
        id: navInfo.value.id,
        filterType: true,
        aniFrameSet: JSON.stringify({
          animationList: filterLocalProperty(newAnimationList)
        })
      });

      if (code !== 200) {
        throw new Error("更新失败");
      }
    } catch (error) {
      console.log(error);
      undo();
      history.redoList.pop();
      onAnimationSelect("");
    }
  };

  /** 删除动画 */
  const onDeleteAnimation = async (params: { animationId: string }) => {
    const { animationId } = params;

    // 如果删除的是当前播放的动画，先停止播放
    if (dataLayer.isPlay.value && dataLayer.selectId.value === animationId) {
      stopCurrentAnimation(animationId);
    }

    saveHistory();

    const newAnimationList = dataLayer.animationList.value.filter((v) => v.id !== animationId);
    const newActiveAnimationList = dataLayer.activeAnimationList.value.filter((v) => v.animationId !== animationId);

    dataLayer.onAnimationListUpdate({ animationList: newAnimationList });
    dataLayer.onActiveAnimationListUpdate({ activeAnimationList: newActiveAnimationList });

    try {
      const { code } = await updateLargeScreen({
        id: navInfo.value.id,
        filterType: true,
        aniFrameSet: JSON.stringify({
          animationList: filterLocalProperty(newAnimationList),
          activeAnimationList: newActiveAnimationList
        })
      });

      if (code !== 200) {
        throw new Error("更新失败");
      }
    } catch (error) {
      console.log(error);
      undo();
      history.redoList.pop();
    }
  };

  /** 完成重命名 */
  const onReNameFinish = async (screenId: number) => {
    onEndRename();
    try {
      const { code } = await updateLargeScreen({
        id: screenId,
        filterType: true,
        aniFrameSet: JSON.stringify({
          animationList: filterLocalProperty(dataLayer.animationList.value)
        })
      });
      if (code !== 200) {
        throw new Error("更新失败");
      }
    } catch (error) {
      console.error(error);
    }
  };

  /** 选择组件 */
  const onAddComponentAnimation = async (params: { componentId: number }) => {
    const { componentId } = params;
    if (!dataLayer.showCustomAnimation.value || !dataLayer.selectId.value) {
      return;
    }

    // 如果动画正在播放，先停止动画
    stopCurrentAnimation();

    saveHistory();

    const newAnimationList = getNewAnimationListAfterComponentOperation({
      animationList: dataLayer.animationList.value,
      selectId: dataLayer.selectId.value,
      componentId,
      isAdd: true,
      delay: dataLayer.progressTime.value
    });

    dataLayer.onAnimationListUpdate({ animationList: newAnimationList });

    try {
      const { code } = await updateLargeScreen({
        id: navInfo.value.id,
        filterType: true,
        aniFrameSet: JSON.stringify({ animationList: filterLocalProperty(newAnimationList) })
      });

      if (code !== 200) {
        throw new Error("更新失败");
      }
    } catch (error) {
      console.log(error);
      undo();
      history.redoList.pop();
    }
  };

  /** 删除组件 */
  const onComponentDelete = async (params: { componentId: number }) => {
    const { componentId } = params;
    if (!dataLayer.showCustomAnimation.value || !dataLayer.selectId.value) {
      return;
    }

    stopCurrentAnimation();

    saveHistory();

    const newAnimationList = getNewAnimationListAfterComponentOperation({
      animationList: dataLayer.animationList.value,
      selectId: dataLayer.selectId.value,
      componentId,
      isAdd: false
    });

    dataLayer.onAnimationListUpdate({ animationList: newAnimationList });

    try {
      const { code } = await updateLargeScreen({
        id: navInfo.value.id,
        filterType: true,
        aniFrameSet: JSON.stringify({ animationList: filterLocalProperty(newAnimationList) })
      });

      if (code !== 200) {
        throw new Error("更新失败");
      }
    } catch (error) {
      console.log(error);
      undo();
      history.redoList.pop();
    }
  };

  /** 全局删除组件 */
  const onComponentDeleteGlobal = async ({ component }: { component: ComponentType }) => {
    stopCurrentAnimation();

    const oldAnimationList = [...dataLayer.animationList.value];

    const newAnimationList = removeComponentIdFromAllAnimations({
      animationList: dataLayer.animationList.value,
      componentId: component.id
    });
    dataLayer.onAnimationListUpdate({ animationList: newAnimationList });

    try {
      const { code } = await updateLargeScreen({
        id: navInfo.value.id,
        filterType: true,
        aniFrameSet: JSON.stringify({ animationList: filterLocalProperty(newAnimationList) })
      });

      if (code !== 200) {
        throw new Error("更新失败");
      }

      clearHistory();
    } catch (error) {
      console.log(error);
      dataLayer.onAnimationListUpdate({ animationList: oldAnimationList });
    }
  };

  /** 添加组件到自定义动画 */
  const onComponentAddToCustomAnimation = ({ component }: { component: ComponentType }) => {
    if (!dataLayer.showCustomAnimation.value) {
      return;
    }
    // console.log(s.value, "ffff");
    // console.log(p.value, "pppp");

    const currentAnimationList = dataLayer.getCurrentAnimationList({
      panelId: panelInfo.value.config.id,
      statusId: activeStatusId.value
    });

    if (currentAnimationList && currentAnimationList.length === 0) {
      ElMessage.info("请先添加动画");
      return;
    }

    if (dataLayer.selectId.value === "" || !dataLayer.selectId.value) {
      ElMessage.info("请先选中动画");
      return;
    }

    const currentAnimation = currentAnimationList.find((item) => item.id === dataLayer.selectId.value);
    if (!currentAnimation) {
      ElMessage.info("当前选中的动画不存在");
      return;
    }

    const index = currentAnimation.componentSetting.findIndex((item) => item.id === component.id);
    if (index !== -1) {
      stopCurrentAnimation();
      ElMessage.info("该组件已添加到自定义动画");

      // 高亮组件并自动滚动到位置
      highlightComponent(component.id, 1000, true);
      return;
    }

    onAddComponentAnimation({ componentId: component.id });
  };

  // ==================== 生命周期管理 ====================

  /** 初始化事件监听器 */
  const initEventListeners = () => {
    // 移除事件监听器，改为直接调用函数
  };

  /** 销毁事件监听器 */
  const destroyEventListeners = () => {
    // 移除事件监听器，改为直接调用函数
  };

  /** 动画属性变更 */
  const onAnimationPropertyChange = async <P extends keyof ComponentSettingItem>(params: {
    property: P;
    value: ComponentSettingItem[P];
    componentSettingItem: ComponentSettingItem;
    isFormOutside?: boolean;
    animationId?: string;
  }) => {
    const { property, value, componentSettingItem, isFormOutside = false, animationId = null } = params;

    // 如果动画正在播放且属性发生变化，先停止当前动画
    stopCurrentAnimation();

    if (!isFormOutside) {
      saveHistoryDebounced();
    }

    const updateAnimationId = animationId || dataLayer.selectId.value;

    const newAnimationList = updateAnimationList({
      animationList: dataLayer.animationList.value,
      selectId: updateAnimationId,
      newComponentSetting: {
        ...componentSettingItem,
        [property]: value
      }
    });

    if (!newAnimationList) {
      return;
    }

    dataLayer.onAnimationListUpdate({ animationList: newAnimationList });

    updateRemoteDataThrottle({
      screenId: navInfo.value.id,
      data: {
        activeAnimationList: dataLayer.activeAnimationList.value,
        animationList: filterLocalProperty(newAnimationList)
      },
      onError: () => {
        if (!isFormOutside) {
          undo();
          history.redoList.pop();
        }
      }
    });
  };

  /** 更新多个属性 */
  const onUpdateMultipleProperty = async (params: {
    changeProperty: Partial<ComponentSettingItem>;
    componentSettingItem: ComponentSettingItem;
  }) => {
    stopCurrentAnimation();

    const { changeProperty, componentSettingItem } = params;
    saveHistoryDebounced();

    const newAnimationList = updateAnimationList({
      animationList: dataLayer.animationList.value,
      selectId: dataLayer.selectId.value,
      newComponentSetting: {
        ...componentSettingItem,
        ...changeProperty
      }
    });
    if (!newAnimationList) {
      return;
    }
    dataLayer.onAnimationListUpdate({ animationList: newAnimationList });

    updateRemoteDataThrottle({
      screenId: navInfo.value.id,
      data: {
        activeAnimationList: dataLayer.activeAnimationList.value,
        animationList: filterLocalProperty(newAnimationList)
      },
      onError: () => {
        undo();
        history.redoList.pop();
      }
    });
  };

  /** 激活动画变更 */
  const onActiveAnimationChange = async (params: {
    panelId?: number;
    statusId?: string;
    animationId: string;
    type: "load" | "unload";
  }) => {
    const { panelId, statusId, animationId, type } = params;
    saveHistory();
    const newActiveAnimationList = [...dataLayer.activeAnimationList.value];

    const loadAnimationIndex = newActiveAnimationList.findIndex(
      (v) => v.type === type && v.panelId === panelId && v.statusId === statusId
    );

    if (loadAnimationIndex === -1) {
      newActiveAnimationList.push({
        panelId,
        statusId,
        animationId,
        type
      });
    } else {
      newActiveAnimationList.splice(loadAnimationIndex, 1, {
        ...newActiveAnimationList[loadAnimationIndex],
        animationId
      });
    }

    dataLayer.onActiveAnimationListUpdate({ activeAnimationList: newActiveAnimationList });

    updateRemoteData({
      screenId: navInfo.value.id,
      data: {
        activeAnimationList: newActiveAnimationList,
        animationList: filterLocalProperty(dataLayer.animationList.value)
      },
      onError: () => {
        undo();
        history.redoList.pop();
      }
    });
  };

  /** 撤销变更 */
  const undoChange = async () => {
    if (history.undoList.length === 0) {
      return;
    }

    undo();

    try {
      await updateLargeScreen({
        id: navInfo.value.id,
        filterType: true,
        aniFrameSet: JSON.stringify({
          animationList: filterLocalProperty(dataLayer.animationList.value),
          activeAnimationList: dataLayer.activeAnimationList.value
        })
      });
    } catch (error) {
      redo();
      console.error("撤销操作同步失败:", error);
    }
  };

  /** 重做变更 */
  const redoChange = async () => {
    if (history.redoList.length === 0) {
      return;
    }

    redo();

    try {
      await updateLargeScreen({
        id: navInfo.value.id,
        filterType: true,
        aniFrameSet: JSON.stringify({
          animationList: filterLocalProperty(dataLayer.animationList.value),
          activeAnimationList: dataLayer.activeAnimationList.value
        })
      });
    } catch (error) {
      undo();
      console.error("重做操作同步失败:", error);
    }
  };

  /**
   * 获取可播放的组件设置
   */
  const getAvailablePlayComponentSetting = (currentAnimation?: AnimationItem) => {
    return currentAnimation?.componentSetting?.filter((componentSetting) => {
      const component = allComponentMap.value.get(componentSetting.id.toString());
      if (!component) {
        return false;
      }

      // if (enablePlayComponentAnimation(component) && componentSetting.type === "load") {
      //   return false
      // }

      return isAnimationAvailable(componentSetting);
    });
  };

  /**
   * 触发动画播放
   */
  const triggerAnimationPlay = (currentAnimation?: AnimationItem) => {
    const availablePlayComponentSetting = getAvailablePlayComponentSetting(currentAnimation);
    if (!availablePlayComponentSetting?.length) {
      return;
    }

    // 触发组件动画
    availablePlayComponentSetting.forEach((componentSetting) => {
      const trigger = triggerRegistry.get(componentSetting.id.toString());
      if (trigger) {
        trigger({
          animation: {
            ...componentSetting,
            type: componentSetting.animationType
          },
          triggerType: "preview"
        });
      }
    });
  };

  /**
   * 停止动画播放（触发一个不存在的动画来重置组件状态）
   */
  const triggerAnimationStop = (currentAnimation?: AnimationItem) => {
    const availablePlayComponentSetting = getAvailablePlayComponentSetting(currentAnimation);
    if (!availablePlayComponentSetting?.length) {
      return;
    }

    // 触发一个不存在的动画来停止当前动画
    availablePlayComponentSetting.forEach((componentSetting) => {
      const trigger = triggerRegistry.get(componentSetting.id.toString());
      if (trigger) {
        trigger({
          animation: {
            type: "none",
            direction: "none",
            timingFunction: "none",
            duration: 0,
            delay: 0
          },
          triggerType: "preview"
        });
      }
    });
  };

  /**
   * 复制组件设置，更新组件ID映射
   * @param componentSetting 原始组件设置
   * @param componentIdMap 组件ID映射表
   * @returns 复制的组件设置或null
   */
  const copyComponentSetting = (
    componentSetting: ComponentSettingItem,
    componentIdMap: Record<number, number>
  ): ComponentSettingItem | null => {
    const newComponentId = componentIdMap[componentSetting.id];
    if (!newComponentId) {
      return null; // 组件没有被复制，跳过
    }
    return {
      ...componentSetting,
      id: newComponentId
    };
  };

  /**
   * 复制动画列表，生成新的动画配置
   * @param originalAnimationList 原始动画列表
   * @param copiedStatus 复制的状态
   * @param componentIdMap 组件ID映射表
   * @returns 复制的动画列表
   */
  const copyAnimationList = (
    originalAnimationList: AnimationItem[],
    copiedStatus: PanelState,
    componentIdMap: Record<number, number>
  ): AnimationItem[] => {
    return originalAnimationList.map((animation) => ({
      ...animation,
      id: uuid(32), // 生成新的动画ID
      name: `${animation.name}_副本`, // 添加副本标识
      panelId: panelInfo.value.config.id,
      statusId: copiedStatus.id,
      isRename: false, // 重置重命名状态
      componentSetting: animation.componentSetting
        .map((componentSetting) => copyComponentSetting(componentSetting, componentIdMap))
        .filter(Boolean) as ComponentSettingItem[] // 过滤掉null值并断言类型
    }));
  };

  /**
   * 复制激活动画列表，更新动画ID映射
   * @param originalActiveAnimationList 原始激活动画列表
   * @param copiedStatus 复制的状态
   * @param originalAnimationList 原始动画列表
   * @param copiedAnimationList 复制的动画列表
   * @returns 复制的激活动画列表
   */
  const copyActiveAnimationList = (
    originalActiveAnimationList: ActiveAnimationList,
    copiedStatus: PanelState,
    originalAnimationList: AnimationItem[],
    copiedAnimationList: AnimationItem[]
  ): ActiveAnimationList => {
    // 创建原始动画ID到新动画ID的映射
    const animationIdMap = new Map<string, string>();
    originalAnimationList.forEach((originalAnimation, index) => {
      const copiedAnimation = copiedAnimationList[index];
      if (copiedAnimation) {
        animationIdMap.set(originalAnimation.id, copiedAnimation.id);
      }
    });

    return originalActiveAnimationList.map((activeAnimation) => ({
      panelId: panelInfo.value.config.id,
      statusId: copiedStatus.id,
      animationId: animationIdMap.get(activeAnimation.animationId) || activeAnimation.animationId,
      type: activeAnimation.type
    }));
  };

  /**
   * 同步动画数据到服务器
   * @param newAnimationList 新的动画列表
   * @param newActiveAnimationList 新的激活动画列表
   */
  const syncAnimationDataToServer = async (
    newAnimationList: AnimationItem[],
    newActiveAnimationList: ActiveAnimationList
  ) => {
    await updateLargeScreen({
      id: navInfo.value.id,
      filterType: true,
      aniFrameSet: JSON.stringify({
        animationList: filterLocalProperty(newAnimationList),
        activeAnimationList: newActiveAnimationList
      })
    });
  };

  /**
   * 复制状态时同时复制相关的动画配置
   * @param originalStatus 原始状态
   * @param copiedStatus 复制的新状态
   * @param componentIdMap 新旧组件ID映射表，key为旧组件ID，value为新组件ID
   *
   * @example
   * ```typescript
   * // 在复制状态时，需要先收集组件ID映射表
   * const componentIdMap: Record<number, number> = {}
   *
   * // 假设在复制组件时收集映射关系
   * originalStatus.config.forEach((originalComponent, index) => {
   *   const copiedComponent = copiedStatus.config[index]
   *   if (originalComponent && copiedComponent) {
   *     componentIdMap[originalComponent.id] = copiedComponent.id
   *   }
   * })
   *
   * // 然后调用复制动画配置
   * await copyAnimationOnStatusCopy(originalStatus, copiedStatus, componentIdMap)
   * ```
   */
  const copyAnimationOnStatusCopy = async (
    originalStatus: PanelState,
    copiedStatus: PanelState,
    componentIdMap: Record<number, number>
  ) => {
    try {
      // 1. 获取原始状态相关的动画列表
      const originalAnimationList = dataLayer.getCurrentAnimationList({
        panelId: panelInfo.value.config.id,
        statusId: originalStatus.id
      });

      if (originalAnimationList.length === 0) {
        return; // 没有动画需要复制
      }

      // 2. 复制动画列表
      const copiedAnimationList = copyAnimationList(originalAnimationList, copiedStatus, componentIdMap);

      // 3. 获取并复制激活动画列表
      const originalActiveAnimationList = dataLayer.getCurrentActiveAnimationList({
        panelId: panelInfo.value.config.id,
        statusId: originalStatus.id
      });
      const copiedActiveAnimationList = copyActiveAnimationList(
        originalActiveAnimationList,
        copiedStatus,
        originalAnimationList,
        copiedAnimationList
      );

      // 4. 更新本地状态
      const newAnimationList = [...dataLayer.animationList.value, ...copiedAnimationList];
      const newActiveAnimationList = [...dataLayer.activeAnimationList.value, ...copiedActiveAnimationList];

      saveHistory();
      dataLayer.onAnimationListUpdate({ animationList: newAnimationList });
      dataLayer.onActiveAnimationListUpdate({ activeAnimationList: newActiveAnimationList });

      // 5. 同步到服务器
      await syncAnimationDataToServer(newAnimationList, newActiveAnimationList);

      console.log(`成功复制 ${copiedAnimationList.length} 个动画配置到新状态`, {
        originalStatusId: originalStatus.id,
        copiedStatusId: copiedStatus.id,
        componentIdMap,
        copiedAnimationCount: copiedAnimationList.length,
        copiedActiveAnimationCount: copiedActiveAnimationList.length
      });
    } catch (error) {
      console.error("复制动画配置失败:", error);
      // 如果出错，回滚操作
      if (canUndo.value) {
        undo();
        history.redoList.pop();
      }
    }
  };

  // ==================== 返回所有方法和状态 ====================

  return {
    // 从数据层继承所有状态和基础方法
    ...dataLayer,

    // 历史记录状态
    history,

    // 历史记录计算属性
    canUndo,
    canRedo,

    saveHistoryDebounced,

    // 复杂业务逻辑方法
    openEdit,
    closeEdit,
    onStartRename,
    onChangeName,
    onEndRename,
    selectComponent,
    onAnimationInit,
    startProgressAnimation,
    stopProgressAnimation,
    stopCurrentAnimation,
    onAnimationSelect,

    // 历史记录操作
    saveHistory,
    clearHistory,
    undo,
    redo,

    // 异步操作方法
    onAddAnimation,
    onDeleteAnimation,
    onReNameFinish,
    onComponentSelect: onAddComponentAnimation,
    onComponentDelete,
    onComponentDeleteGlobal,
    onAnimationPropertyChange,
    onUpdateMultipleProperty,
    onActiveAnimationChange,
    undoChange,
    redoChange,

    // 组件添加到自定义动画
    onComponentAddToCustomAnimation,

    // 生命周期管理
    initEventListeners,
    destroyEventListeners,

    // 动画控制函数
    getAvailablePlayComponentSetting,
    triggerAnimationPlay,
    triggerAnimationStop,

    // 状态复制相关
    copyAnimationOnStatusCopy
  };
});

/**
 * 自定义动画操作层 hooks 类型定义
 */
export type UseCustomAnimationReturn = ReturnType<typeof useCustomAnimation>;
