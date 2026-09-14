import { computed, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { filterPropToEncodeConfig } from "@screenwright/types";
import { cloneDeep } from "lodash-es";

import { interactiveEnum, mediaEnum } from "@/components/componentEntry/type";
import { extractComponentId, uuid } from "@/utils/utils";
import {
  templateEncodeActions,
  templateEncodeEvent
} from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/options";
import type { TreeNode } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/utils";
import {
  buildTree,
  calculateComponentValue,
  processPanelComponents,
  traverseTrees
} from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/utils";
import { EncodeEventTypeEnum } from "@/views/build/components/buildConfig/constants/event";
import { useUpdateInstance } from "@/views/build/components/buildConfig/useUpdateInstance";
import { extendsEnumType } from "@/views/build/components/buildRender/core/ExtendsComponents/type";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type { EncodeAction, EncodeEvent } from "@/views/build/components/buildRender/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { useEncodePanelInfo } from "@/views/build/components/encodeEditor/useEncodePanelInfo";
import { buildComponentMap, useGlobalComponentData } from "@/views/build/useGlobalComponentData";

/**
 *  不需要事件就能添加到远程控制目标的组件类型
 */
const autoRemoteControlComponents = [extendsEnumType.PageReload, mediaEnum.FtVideo];

export const useEncodeEventConfig = createGlobalState(() => {
  const { componentList } = useEditStore();
  const { selectTargetData, update } = useUpdateInstance();
  const { globalComponentMap, encodeComponentMap } = useGlobalComponentData();
  const { encodePanelId } = useEncodePanelInfo();

  // 编码事件相关状态
  const currentEncodeEvent = ref<EncodeEvent>(templateEncodeEvent());
  const currentEncodeAction = ref<EncodeAction>(templateEncodeActions());
  const currentEncodeEventId = ref("");
  const currentEncodeActionId = ref("");

  const eventExcludes = computed(() => {
    const { prop } = selectTargetData.value[0].component;
    const { eventsEx } = filterPropToEncodeConfig(prop);
    return eventsEx;
  });

  /**
   * @description 当前组件数据
   */
  const localComponent = computed<TreeNode[]>(() => {
    return buildTree(traverseTrees(componentList.value, false));
  });

  /**
   * @description 全局组件数据
   */
  const globalComponent = computed<TreeNode[]>(() => {
    const encodePanel = encodeComponentMap.value.get(String(encodePanelId.value));
    if (!encodePanel) {
      return [];
    }

    const encodePanelMap = new Map<string, ComponentType & { parentDynamicPanelId: number[] }>();
    buildComponentMap({
      componentList: [encodePanel] as ComponentType[],
      componentMap: encodePanelMap,
      parentDynamicPanelId: [...encodePanel.parentDynamicPanelId]
    });

    return buildTree(traverseTrees(processPanelComponents(Array.from(encodePanelMap.values())), true));
  });

  /**
   * @description 远程控制组件数据
   */
  const remoteControlComponent = computed(() => {
    const componentHasEvent = (component: ComponentType) => {
      if (component.events && component.events.length > 0) {
        return true;
      }
      return false;
    };

    const componentIsAutoRemoteControl = (component: ComponentType) => {
      if (autoRemoteControlComponents.includes(component.component.prop as extendsEnumType | mediaEnum)) {
        return true;
      }
      return false;
    };

    return Array.from(globalComponentMap.value.values())
      .filter((component) => componentIsAutoRemoteControl(component) || componentHasEvent(component))
      .filter((component) => {
        if (currentEncodeEvent.value.trigger === EncodeEventTypeEnum.VideoControls) {
          return component.component.prop === mediaEnum.FtVideo;
        }

        return true;
      })
      .map((component) => ({
        label: component.name,
        value: calculateComponentValue(component, false)
      }));
  });

  /**
   * @description 获取特殊组件的控制数据
   * @param componentType 组件类型
   * @returns 返回特殊组件的控制项数据，如果不是特殊组件则返回 null
   */
  const getSpecialComponentData = (
    componentType: ComponentType["component"]["prop"]
  ): { label: string; value: string; hotword?: string }[] | null => {
    const ComponentOfSpecialData: Record<
      interactiveEnum.FtPageTurning | interactiveEnum.FtPageQuery | interactiveEnum.FtVoiceControl,
      { label: string; value: string; hotword?: string }[]
    > = {
      [interactiveEnum.FtPageTurning]: [
        { label: "上一页", value: "prev" },
        { label: "下一页", value: "next" }
      ],
      [interactiveEnum.FtPageQuery]: [
        { label: "上一页", value: "prev" },
        { label: "下一页", value: "next" }
      ],
      [interactiveEnum.FtVoiceControl]: [
        { label: "开始", value: "start", hotword: "" },
        { label: "结束", value: "stop", hotword: "" }
      ]
    };

    if (componentType in ComponentOfSpecialData) {
      return ComponentOfSpecialData[
        componentType as interactiveEnum.FtPageTurning | interactiveEnum.FtPageQuery | interactiveEnum.FtVoiceControl
      ];
    }

    return null;
  };

  /**
   * @description 当前组件数据
   */
  const currentComponentControlItem = computed(() => {
    if (!currentEncodeAction.value?.component?.length) {
      return [];
    }

    const componentId = extractComponentId(currentEncodeAction.value.component[0]);
    const component = globalComponentMap.value.get(String(componentId));

    if (!component) {
      return [];
    }

    const specialData = getSpecialComponentData(component.component.prop);
    if (specialData) {
      return specialData;
    }

    // 处理普通组件的控制项数据
    const controlItems = (component.data || []).map((item: { label?: any; name?: any; value?: any }, index: number) => {
      const label = item.label || item.name || `数据${index + 1}`;
      return {
        label,
        value: item.value || label
      };
    });

    return controlItems;
  });

  // 编码事件选项
  const encodeEventOptions = computed(() => {
    return selectTargetData.value[0]?.encodes || [];
  });

  // 处理事件选择
  const handleEncodeEventSelect = (eventId: string) => {
    const foundEvent = selectTargetData.value[0].encodes?.find((item: any) => item.id === eventId);
    if (foundEvent) {
      currentEncodeEvent.value = foundEvent;
      currentEncodeEventId.value = eventId;

      if (currentEncodeEvent.value.actions && currentEncodeEvent.value.actions.length > 0) {
        handleEncodeActionTabs(currentEncodeEvent.value.actions[0].id);
      }
    }
  };

  // 处理动作选择
  const handleEncodeActionTabs = (actionId: string) => {
    if (!currentEncodeEvent.value) {
      return;
    }

    const foundAction = currentEncodeEvent.value.actions.find((item) => item.id === actionId);
    if (foundAction) {
      currentEncodeAction.value = foundAction;
      currentEncodeActionId.value = actionId;
    }
  };

  // 设置初始编码事件
  const setInitialEncodeEvent = () => {
    const encodes = selectTargetData.value[0]?.encodes;
    if (encodes && encodes.length) {
      currentEncodeEvent.value = encodes[0];
      currentEncodeEventId.value = encodes[0].id;
      if (encodes[0].actions && encodes[0].actions.length) {
        currentEncodeAction.value = encodes[0].actions[0];
        currentEncodeActionId.value = encodes[0].actions[0].id;
      }
    } else {
      currentEncodeEvent.value = templateEncodeEvent();
      currentEncodeAction.value = templateEncodeActions();
      currentEncodeEventId.value = "";
      currentEncodeActionId.value = "";
    }
  };

  /**
   * 创建新的编码事件
   * @returns 新创建的编码事件对象
   */
  const createNewEncodeEvent = () => {
    let newEvent = cloneDeep(templateEncodeEvent());

    // 如果已有事件，基于最后一个事件创建新事件
    if (encodeEventOptions.value?.length) {
      const lastEvent = encodeEventOptions.value[encodeEventOptions.value.length - 1];
      newEvent = cloneDeep({
        ...lastEvent,
        id: "encode_event_" + uuid()
      });
    }

    return newEvent;
  };

  /**
   * 更新当前编码事件状态
   * @param event 要设置为当前的编码事件
   */
  const updateCurrentEncodeEvent = (event: any) => {
    currentEncodeEventId.value = event.id;
    currentEncodeEvent.value = event;

    if (event.actions?.length > 0) {
      currentEncodeAction.value = event.actions[0];
      currentEncodeActionId.value = event.actions[0].id;
    }
  };

  /**
   * 重置编码事件状态到默认值
   */
  const resetEncodeEventState = () => {
    currentEncodeEventId.value = "";
    currentEncodeEvent.value = templateEncodeEvent();
    currentEncodeAction.value = templateEncodeActions();
    currentEncodeActionId.value = "";
  };

  /**
   * 添加新的编码事件
   */
  const addEncodeEvent = () => {
    const newEvent = createNewEncodeEvent();

    // 确保encodes数组存在并添加新事件
    if (selectTargetData.value[0]?.encodes?.length) {
      selectTargetData.value[0].encodes.push(newEvent);
    } else {
      selectTargetData.value[0]["encodes"] = [newEvent];
    }

    // 在数据中查找新添加的事件（确保引用正确）
    const foundEvent = selectTargetData.value[0].encodes.find((item: any) => item.id === newEvent.id);
    if (foundEvent) {
      updateCurrentEncodeEvent(foundEvent);
    }
  };

  /**
   * 删除当前编码事件
   */
  const deleteEncodeEvent = () => {
    if (!currentEncodeEventId.value) {
      console.warn("尝试删除编码事件，但没有选中的事件");
      return;
    }

    const currentId = currentEncodeEventId.value;
    const deleteIndex = encodeEventOptions.value.findIndex((item: any) => item.id === currentId);

    if (deleteIndex === -1) {
      console.warn("要删除的编码事件不存在");
      return;
    }

    // 删除事件
    encodeEventOptions.value.splice(deleteIndex, 1);

    // 处理删除后的状态
    if (encodeEventOptions.value.length > 0) {
      // 选择前一个事件，如果是第一个则选择当前位置的事件
      const nextIndex = deleteIndex > 0 ? deleteIndex - 1 : 0;
      const nextEvent = encodeEventOptions.value[nextIndex];
      updateCurrentEncodeEvent(nextEvent);
    } else {
      // 没有事件了，重置状态
      resetEncodeEventState();
    }
  };

  /**
   * 处理编码事件操作
   * @param eventType 操作类型："add" | "delete"
   */
  const handleOnEvent = (eventType: string) => {
    try {
      switch (eventType) {
        case "add":
          addEncodeEvent();
          break;
        case "delete":
          deleteEncodeEvent();
          break;
        default:
          console.warn(`未知的事件操作类型: ${eventType}`);
          return;
      }

      // 操作完成后更新数据
      update();
    } catch (error) {
      console.error(`处理编码事件操作失败:`, error);
    }
  };

  /**
   * 创建新的编码动作
   * @returns 新创建的编码动作对象
   */
  const createNewEncodeAction = () => {
    let newAction = cloneDeep(templateEncodeActions());

    // 如果当前事件已有动作，基于最后一个动作创建新动作
    if (currentEncodeEvent.value.actions?.length) {
      const lastAction = currentEncodeEvent.value.actions[currentEncodeEvent.value.actions.length - 1];
      newAction = cloneDeep({
        ...lastAction,
        id: "encode_action_" + uuid()
      });
    }

    return newAction;
  };

  /**
   * 添加新的编码动作
   */
  const addEncodeAction = () => {
    if (!currentEncodeEvent.value || !selectTargetData.value[0].encodes) {
      console.warn("尝试添加编码动作，但没有当前事件");
      return;
    }

    const newAction = createNewEncodeAction();

    // 通过事件ID找到对应的事件索引并添加动作
    const eventIndex = selectTargetData.value[0].encodes.findIndex(
      (item: any) => item.id === currentEncodeEventId.value
    );

    if (eventIndex !== -1) {
      selectTargetData.value[0].encodes[eventIndex].actions.push(newAction);
      currentEncodeActionId.value = newAction.id;
      handleEncodeActionTabs(newAction.id);
    } else {
      console.warn("找不到对应的编码事件");
    }
  };

  /**
   * 删除当前编码动作
   */
  const deleteEncodeAction = () => {
    if (!currentEncodeActionId.value || !currentEncodeEvent.value) {
      console.warn("尝试删除编码动作，但没有选中的动作或事件");
      return;
    }

    const currentId = currentEncodeActionId.value;
    const deleteIndex = currentEncodeEvent.value.actions.findIndex((item: any) => item.id === currentId);

    if (deleteIndex === -1) {
      console.warn("要删除的编码动作不存在");
      return;
    }

    // 删除动作
    currentEncodeEvent.value.actions.splice(deleteIndex, 1);

    // 处理删除后的状态
    if (currentEncodeEvent.value.actions.length > 0) {
      // 选择前一个动作，如果是第一个则选择当前位置的动作
      const nextIndex = deleteIndex > 0 ? deleteIndex - 1 : 0;
      const nextAction = currentEncodeEvent.value.actions[nextIndex];
      currentEncodeActionId.value = nextAction.id;
      currentEncodeAction.value = nextAction;
    } else {
      // 没有动作了，清空状态
      currentEncodeActionId.value = "";
      currentEncodeAction.value = templateEncodeActions();
    }
  };

  /**
   * 处理编码动作操作
   * @param eventType 操作类型："add" | "delete"
   */
  const handleOnActionEvent = (eventType: string) => {
    try {
      switch (eventType) {
        case "add":
          addEncodeAction();
          break;
        case "delete":
          deleteEncodeAction();
          break;
        default:
          console.warn(`未知的动作操作类型: ${eventType}`);
          return;
      }

      // 操作完成后更新数据
      update();
    } catch (error) {
      console.error(`处理编码动作操作失败:`, error);
    }
  };

  // 初始化
  const initEncodeEvent = () => {
    setInitialEncodeEvent();
  };

  /**
   * @description 是否为没有控制项组件
   * @param {string} $id 组件ID
   * @returns {boolean} 是否为没有控制项组件
   */
  const isNoControlItemComponent = ($id: string): boolean => {
    const cId = extractComponentId($id);
    const component = globalComponentMap.value.get(String(cId));
    if (!component) {
      return false;
    }
    const noControlItemComponent = [interactiveEnum.FtMutual, mediaEnum.FtVideo, extendsEnumType.PageReload];
    return noControlItemComponent.includes(component.component.prop as interactiveEnum | mediaEnum | extendsEnumType);
  };

  return {
    // 状态变量
    currentEncodeEvent,
    currentEncodeAction,
    currentEncodeEventId,
    currentEncodeActionId,

    // 计算属性
    currentComponentControlItem,
    encodeEventOptions,
    eventExcludes,
    localComponent,
    globalComponent,
    remoteControlComponent,

    // 方法
    handleEncodeEventSelect,
    handleEncodeActionTabs,
    setInitialEncodeEvent,
    initEncodeEvent,
    isNoControlItemComponent,
    getSpecialComponentData,

    // 事件和动作处理方法
    handleOnEvent,
    handleOnActionEvent,
    createNewEncodeEvent,
    updateCurrentEncodeEvent,
    resetEncodeEventState,
    addEncodeEvent,
    deleteEncodeEvent,
    createNewEncodeAction,
    addEncodeAction,
    deleteEncodeAction,

    // 继承的状态和方法
    selectTargetData,
    update
  };
});
