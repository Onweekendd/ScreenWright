import { computed, ref, toRaw, watch } from "vue";
import { createGlobalState } from "@vueuse/core";

import { filterPropToConfig } from "@screenwright/types";

import { extractComponentId } from "@/utils/utils";
import { ActionTypeEnum } from "@/views/build/components/buildConfig/constants/action";
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type { Action, ComponentType, Event } from "@/views/build/components/buildRender/type";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { EventTypeEnum } from "../../../constants/event";
import { useUpdateInstance } from "../../../useUpdateInstance";
import { focusLayerProp } from "./options";
import { moreActionSExcludes } from "./options";
import { createTemplateAction, templateActions, templateEvents } from "./options";
import { buildTree, processPanelComponents, traverseTrees } from "./utils";

interface TreeNode {
  id: string;
  label: string;
  name: string;
  value: string;
  title: string;
  terminalId: string;
  events: any;
  children?: TreeNode[];
}

export const useCustomEvent = createGlobalState(() => {
  const { componentList: localComponentMap } = useEditStore();
  const { globalComponentMap, allComponentMap } = useGlobalComponentData();
  const { selectTargetData, update } = useUpdateInstance();

  // 移动状态变量到此处
  const currentAction = ref<Action>({
    ...templateActions(),
    ...createTemplateAction(ActionTypeEnum.ShowHide)
  });
  const currentEvent = ref<Event>(templateEvents({}));
  const currentIndex = ref(0);

  // 当 action.action 改变时，用对应类型的默认值补全缺失字段
  watch(
    () => currentAction.value?.action,
    (newActionType) => {
      if (!newActionType) {
        return;
      }

      const template = createTemplateAction(newActionType);
      for (const key in template) {
        const k = key as keyof Action;
        if (currentAction.value[k] === undefined) {
          (currentAction.value as any)[k] = template[k];
        }
      }
    }
  );

  const isSendUE4Msg = computed(() => {
    return currentAction.value?.action?.includes("sendUe4Msg");
  });

  const isUpdateConfig = computed(() => {
    return currentAction.value?.action == "updateConfig";
  });

  const isSwitchState = computed(() => {
    return ["switchState", "switchTCState"].includes(currentAction.value?.action || "");
  });

  const componentProp = computed(() => {
    return selectTargetData.value[0].component.prop as string;
  });
  const unConditionalJudgment = computed(() => {
    return componentProp.value !== "threescene";
  });

  // 事件选择模型集合
  const eventSceneModels = computed(() => {
    if (!currentAction.value) {
      return [];
    }

    return selectTargetData.value[0].option?.simplifySceneList[0]?.models.map((item: any) => {
      return {
        label: item.name,
        value: item.id,
        assetsType: item.type,
        children: item.children?.map((item: any) => {
          return {
            label: item.name,
            value: item.id,
            assetsType: item.type
          };
        })
      };
    });
  });
  // 场景模板组件模型节点树列表
  const eventSceneModelNodes = computed(() => {
    return selectTargetData.value[0].option.sceneModelNodeList || [];
  });

  // 事件选择模型集合
  const eventSceneLayers = computed(() => {
    if (!currentEvent.value) {
      return [];
    }
    const currentTrigger = currentEvent.value.trigger;
    const assessType: { [key: string]: string[] } = {
      [EventTypeEnum.ModelClick]: ["ModelLayer"],
      [EventTypeEnum.LayerClick]: ["TileLayer"],
      [EventTypeEnum.VectorClick]: ["geojson"],
      [EventTypeEnum.ThreeDTilesClick]: ["3DTilesLayer"]
    };
    const fullList =
      selectTargetData.value[0].option.simplifySceneList[0]?.models
        .filter((item: any) => assessType[currentTrigger].includes(item.type))
        .map((item: any) => {
          return {
            label: item.name,
            value: item.name,
            assetsType: item.type,
            cityName: item.cityName,
            children: item.children?.map((item: any) => {
              return {
                label: item.name,
                value: item.name,
                assetsType: item.type,
                cityName: item.cityName
              };
            })
          };
        }) || [];
    return fullList.filter((lyr: any) => {
      return !lyr.cityName;
    });
  });

  const handleChangeAssets = (idList: any, infoList: any) => {
    if (!currentEvent.value || !currentAction.value) {
      return;
    }

    currentEvent.value.model = toRaw(idList);
    currentEvent.value.modelDetailList = toRaw(infoList);
    if (infoList.every((item: any) => item.assetsType !== "icon") && currentAction.value.action === "followIcon") {
      currentAction.value.action = ActionTypeEnum.Default;
    }
    update();
  };

  // 切换选择模型节点
  const handleChangeModelNodeList = (idList: any, infoList: any) => {
    if (!currentEvent.value) {
      return;
    }

    currentEvent.value.modelNodeList = toRaw(idList);
    currentEvent.value.modelNodeDetailList = toRaw(infoList);
    update();
  };
  // 切换选择图层
  const handleChangeAssetsLayer = (idList: any, infoList: any) => {
    if (!currentEvent.value) {
      return;
    }

    currentEvent.value.layer = toRaw(idList);
    currentEvent.value.layerList = toRaw(infoList);
    update();
  };

  // 切换选择场景对象
  const handleChangeSceneObjectList = (idList: any, infoList: any) => {
    if (!currentEvent.value || !currentAction.value) {
      return;
    }

    currentAction.value.sceneObject!.nameList = toRaw(idList);
    if (infoList) {
      currentAction.value.sceneObject!.objInfoList = toRaw(infoList);
    } else {
      currentAction.value.sceneObject!.objInfoList = currentAction.value.sceneObject!.objInfoList.filter((item: any) =>
        idList.includes(item.value)
      );
    }
  };

  // 切换选择场景子组件
  const handleChangeSceneChildComponentList = (idList: any, infoList: any) => {
    if (!currentEvent.value || !currentAction.value) {
      return;
    }

    currentAction.value.sceneChildComponent!.nameList = toRaw(idList);
    if (infoList) {
      currentAction.value.sceneChildComponent!.childComponentInfoList = toRaw(infoList);
    } else {
      currentAction.value.sceneChildComponent!.childComponentInfoList =
        currentAction.value.sceneChildComponent!.childComponentInfoList.filter((item: any) =>
          idList.includes(item.value)
        );
    }
  };

  // 切换选择地图子组件
  const handleChangeMapChildComponentList = (idList: any, infoList: any) => {
    if (!currentEvent.value || !currentAction.value) {
      return;
    }

    currentAction.value.mapChildComponent!.nameList = toRaw(idList);
    if (infoList) {
      currentAction.value.mapChildComponent!.childComponentInfoList = toRaw(infoList);
    } else {
      currentAction.value.mapChildComponent!.childComponentInfoList =
        currentAction.value.mapChildComponent!.childComponentInfoList.filter((item: any) =>
          idList.includes(item.value)
        );
    }
  };

  // 是否过滤跟随图标动作
  const isFilterFollowIcon = () => {
    if (!currentEvent.value) {
      return false;
    }
    // 事件为点击图标子组件时添加跟随图标动作
    if (currentEvent.value.trigger === EventTypeEnum.ChildComponentClick) {
      return false;
    }

    const modelList = Array.isArray(currentEvent.value.modelDetailList)
      ? currentEvent.value.modelDetailList
      : [currentEvent.value.modelDetailList];
    const isInclude = modelList.every((item: any) => ["icon", "model"].includes(item?.assetsType));
    // 以下两种情况不会过滤掉跟随图标动作(return true 就是过滤掉该动作)
    // 情况一：事件为鼠标点击模型事件且选择的对象是图标
    // 情况二：事件为鼠标点击图标（批量识别）事件
    // 前提是场景模板为activeObj
    if (currentEvent.value.trigger === EventTypeEnum.ModelClick && isInclude) {
      return false;
    }
    if (currentEvent.value.trigger === EventTypeEnum.MultiplyIconClick) {
      return false;
    }
    // 如果选择点击图层，则过滤图标跟随
    if (currentEvent.value.trigger === EventTypeEnum.LayerClick) {
      return true;
    }
    // 如果是funcity。需要图标跟随
    if ((selectTargetData.value[0].component.prop as string) === "maptalks") {
      return false;
    }
    return true;
  };

  const actionComponent = computed(() => {
    if (!currentAction.value) {
      return {};
    }
    const componentIds = currentAction.value.component.map((a) => extractComponentId(a));

    if (!componentIds.length) {
      return {};
    }
    const actionObj = allComponentMap.value.get(`${componentIds[0]}`);

    if (!actionObj) {
      return {};
    }
    return actionObj.component;
  });

  // 添加type参数定义
  const type = ref<string | undefined>(undefined);

  // 将actionExcludes修改为computed属性
  const actionExcludes = computed(() => {
    const actionList = currentAction.value?.component;

    if (!currentEvent.value || !currentAction.value) {
      return "";
    }

    if (!actionList || type.value === "encodeEvent") {
      return "";
    }

    if (actionList.length > 1) {
      // 多个组件时，重置动作并返回排除列表
      if (isUpdateConfig.value || isSwitchState.value || isSendUE4Msg.value) {
        currentAction.value.action = ActionTypeEnum.Default;
      }
      return moreActionSExcludes();
    } else if (actionList.length === 1) {
      // 单个组件时
      const { actionEx } = filterPropToConfig((actionComponent.value as ComponentType["component"]).prop);
      let disActions = actionEx;
      // 更新-城市模板-聚焦BIM图层要素
      if (!focusLayerProp(currentEvent.value?.trigger)) {
        disActions += ",focusLayer";
      }
      // 是否包含跟随图标动作
      if (isFilterFollowIcon()) {
        disActions += ",followIcon";
      }
      return disActions;
    } else {
      // 没有组件时，重置动作
      if (isUpdateConfig.value || isSwitchState.value || isSendUE4Msg.value) {
        currentAction.value.action = ActionTypeEnum.Default;
      }
      currentAction.value.stateId = ""; // 状态恢复默认
      currentAction.value.action = ActionTypeEnum.Default;
      return "";
    }
  });

  /**
   * @description 当前组件数据
   */
  const localComponent = ref<TreeNode[]>([]);

  /**
   * @description 全局组件数据
   */
  const globalComponent = ref<TreeNode[]>([]);

  const eventExcludes = computed(() => {
    const { prop } = selectTargetData.value[0].component;
    const { eventsEx } = filterPropToConfig(prop);
    return eventsEx;
  });

  const init = () => {
    const localData = [...localComponentMap.value].filter((item) => item.component.prop !== PanelType.encodePanel);
    const globalData = Array.from(globalComponentMap.value.values());

    localComponent.value = buildTree(traverseTrees(localData, false));
    globalComponent.value = buildTree(traverseTrees(processPanelComponents(globalData), true));
  };

  // 添加事件处理相关函数
  const handleEventSelect = (eventId: string) => {
    const foundEvent = selectTargetData.value[0].events.find((item: any) => item.id === eventId);
    if (foundEvent) {
      currentEvent.value = foundEvent;

      if (currentEvent.value.actions && currentEvent.value.actions.length > 0) {
        handleActionTabs(currentEvent.value.actions[0].id);
      }
    }
  };

  const handleActionTabs = (actionId: string) => {
    if (!currentEvent.value) {
      return;
    }

    const foundAction = currentEvent.value.actions.find((item: any) => item.id === actionId);
    currentAction.value = (foundAction || templateActions()) as Action;
  };

  const setInitialEvent = () => {
    const events = selectTargetData.value[0].events;
    if (events && events.length) {
      currentIndex.value = 0;
      currentEvent.value = events[0];
      if (events[0].actions && events[0].actions.length) {
        currentAction.value = events[0].actions[0] as Action;
      }
    } else {
      currentIndex.value = 0;
      currentEvent.value = templateEvents({});
      currentAction.value = templateActions();
    }
  };

  return {
    eventExcludes,
    actionExcludes,
    actionComponent,

    eventSceneModels,
    eventSceneModelNodes,
    eventSceneLayers,
    allComponentMap,

    isUpdateConfig,
    componentProp,
    unConditionalJudgment,
    isSwitchState,
    localComponent,
    globalComponent,

    // 导出移动到此处的状态变量
    currentAction,
    currentEvent,
    currentIndex,
    selectTargetData,
    update,

    // 导出功能函数
    handleEventSelect,
    handleActionTabs,
    setInitialEvent,
    init,

    handleChangeAssets,
    handleChangeModelNodeList,
    handleChangeAssetsLayer,
    handleChangeSceneObjectList,
    handleChangeSceneChildComponentList,
    handleChangeMapChildComponentList,

    // 导出type变量
    type
  };
});
