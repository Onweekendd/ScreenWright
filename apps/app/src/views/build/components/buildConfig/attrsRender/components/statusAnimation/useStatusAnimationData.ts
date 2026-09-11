import { computed, ref, toRaw, watch } from "vue";
import { createGlobalState } from "@vueuse/core";

import { cloneDeep } from "lodash-es";

import type { ComponentType } from "@/views/build/components/buildRender/type";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import { useImmer } from "../customAnimation/useImmer";
import { smartApplyComponentConfig } from "./components/hooks/generators";
import { ComponentConfigBuilder } from "./components/hooks/generators/ComponentConfigBuilder";
import type {
  AnimationInfo,
  ComponentAnimationConfig,
  PropertyNode,
  StatusAnimationMapping,
  StatusAnimationResponse
} from "./type";
import { createPropertyGroupLevel, createPropertyLevel } from "./utils/utils";

// 动画相关状态（使用 immer 管理）
interface AnimationState {
  animations: Record<string, AnimationInfo>;
  statusAnimations: Record<string, Record<string, StatusAnimationMapping>>;
  componentAnimations: Record<string, Record<string, Record<string, ComponentAnimationConfig>>>;
}

// 初始动画状态
const initialAnimationState: AnimationState = {
  animations: {},
  statusAnimations: {},
  componentAnimations: {}
};

// 创建全局状态管理
export const useStatusAnimationData = createGlobalState(() => {
  const { navInfo } = useLargeScreenInfo();
  // 使用 immer 管理动画相关状态
  const [animationState, updateAnimationState] = useImmer<AnimationState>(initialAnimationState);

  watch(animationState, (newState) => {
    navInfo.value.statusAnimation = newState;
  });

  // 其他状态直接声明为 ref
  const editorVisible = ref(false);
  const editorHeight = ref(488);
  const selectAnimationId = ref("");
  const selectStatusId = ref("");
  const selectedRowId = ref("");
  const componentDefaultConfigMap = ref(new Map<string, ComponentType & { parentDynamicPanelId: number[] }>());
  const dragCompleteSignal = ref(0); // 用于触发拖拽完成动画的信号

  const { allComponentMap } = useGlobalComponentData();

  const setEditorVisible = (visible: boolean) => {
    editorVisible.value = visible;
    if (!visible) {
      resetComponentConfig();
      selectAnimationId.value = "";
      selectStatusId.value = "";
      selectedRowId.value = "";
    } else {
      snapshotComponentConfig();
    }
  };

  const setEditorHeight = (height: number) => {
    editorHeight.value = height;
  };

  const setSelectAnimationId = (animationId: string) => {
    resetComponentConfig();

    selectAnimationId.value = animationId;
  };

  const setSelectStatusId = (statusId: string) => {
    selectStatusId.value = statusId;
  };

  const setSelectedRowId = (rowId: string) => {
    selectedRowId.value = rowId;
  };

  const triggerDragCompleteAnimation = () => {
    dragCompleteSignal.value++;
  };

  const updateAnimationStateData = (newState: StatusAnimationResponse) => {
    updateAnimationState((draft: AnimationState) => {
      draft.animations = newState.animations;
      draft.statusAnimations = newState.statusAnimations;
      draft.componentAnimations = newState.componentAnimations;
    });
  };

  const setStatusAnimation = (animationId: string, statusId: string, statusMapping: StatusAnimationMapping) => {
    updateAnimationState((draft: AnimationState) => {
      if (!draft.statusAnimations[animationId]) {
        draft.statusAnimations[animationId] = {};
      }
      draft.statusAnimations[animationId][statusId] = statusMapping;
    });
  };

  const setComponentAnimations = (
    animationId: string,
    statusId: string,
    componentAnimations: Record<string, ComponentAnimationConfig>
  ) => {
    updateAnimationState((draft: AnimationState) => {
      if (!draft.componentAnimations[animationId]) {
        draft.componentAnimations[animationId] = {};
      }
      draft.componentAnimations[animationId][statusId] = componentAnimations;
    });
  };

  const resetStatusAnimationOnPanelChange = () => {
    resetComponentConfig();

    componentDefaultConfigMap.value = new Map();
    selectAnimationId.value = "";
    selectStatusId.value = "";
    selectedRowId.value = "";
    editorHeight.value = 488;
    editorVisible.value = false;
  };

  const resetState = () => {
    updateAnimationState(() => ({ ...initialAnimationState }));
    editorVisible.value = false;
    editorHeight.value = 488;
    selectAnimationId.value = "";
    selectStatusId.value = "";
    selectedRowId.value = "";
    componentDefaultConfigMap.value = new Map();
  };

  // 动画数据
  const animations = computed(() => animationState.value.animations);
  const statusAnimations = computed(() => animationState.value.statusAnimations);
  const componentAnimations = computed(() => animationState.value.componentAnimations);

  // 计算属性
  const getCurrentAnimationList = (panelId?: number, statusId?: string) => {
    return Object.entries(animationState.value.animations)
      .map(([_, animationInfo]) => animationInfo)
      .filter((animationInfo) => {
        if (panelId && statusId) {
          return animationInfo.panelId === panelId && animationInfo.statusId === statusId;
        } else {
          return !animationInfo.panelId && !animationInfo.statusId;
        }
      });
  };

  // 获取所有被添加到状态动画的组件 ID 集合
  const animatedComponentIds = computed(() => {
    const uniqueComponentIds = new Set<string>();
    for (const animationId of Object.keys(animationState.value.componentAnimations)) {
      const statusIdToComponents = animationState.value.componentAnimations[animationId];
      for (const statusId of Object.keys(statusIdToComponents)) {
        const components = statusIdToComponents[statusId];
        if (!components) continue;
        for (const componentId of Object.keys(components)) {
          uniqueComponentIds.add(componentId);
        }
      }
    }
    return uniqueComponentIds;
  });

  const getRenderTableData = computed(() => {
    // 需要构建一颗四层的树
    // 第一层 组件名称
    const currentAnimation = animationState.value.animations[selectAnimationId.value];
    if (!currentAnimation) {
      return [];
    }

    const statusList = getCurrentStatusList.value;

    // 组件层级
    const componentLevel: PropertyNode[] = [];

    // 构建组件层级
    const buildComponentLevel = () => {
      if (!selectAnimationId.value || !animationState.value.componentAnimations[selectAnimationId.value]) {
        return;
      }

      Object.entries(animationState.value.componentAnimations[selectAnimationId.value][statusList[0].statusId]).forEach(
        ([componentId, _componentAnimation]) => {
          const component = allComponentMap.value.get(componentId);
          if (!component) return;

          componentLevel.push({
            id: componentId,
            componentName: component.name,
            level: 1,
            children: []
          });
        }
      );
    };

    /**
     * 设置属性状态数据
     * @param status 状态
     * @param property 属性
     * @param componentId 组件ID
     */
    const setPropertyStatusData = (status: StatusAnimationMapping, property: PropertyNode, componentId: string) => {
      if (!property.states || !property.property) return;

      const animationConfig =
        animationState.value.componentAnimations[selectAnimationId.value][status.statusId][componentId];

      if (!animationConfig) return;

      property.states[status.statusId] = animationConfig[property.property];
    };

    /**
     * 构建属性层级
     * @param componentLevelNode 组件层级节点
     */
    const buildPropertyLevel = (componentLevelNode: PropertyNode) => {
      if (!componentLevelNode.children) return;

      const componentConfig = allComponentMap.value.get(componentLevelNode.id);
      if (!componentConfig) return;

      // 获取该组件在所有状态中实际存在的属性
      const existingProperties = new Set<keyof ComponentAnimationConfig>();
      statusList.forEach((status) => {
        const animationConfig =
          animationState.value.componentAnimations[selectAnimationId.value][status.statusId][componentLevelNode.id];
        if (animationConfig) {
          Object.keys(animationConfig).forEach((key) => {
            if (key !== "componentId") {
              existingProperties.add(key as keyof ComponentAnimationConfig);
            }
          });
        }
      });

      if (existingProperties.size === 0) return;

      // 创建属性组（基于组件类型的完整分组）
      const allPropertyGroupLevel = createPropertyGroupLevel(componentLevelNode.id, componentConfig.component.prop);

      // 过滤并构建实际存在的属性组和属性
      const filteredPropertyGroupLevel: PropertyNode[] = [];

      allPropertyGroupLevel.forEach((propertyGroup) => {
        if (!propertyGroup.children) return;

        const allPropertyLevel = createPropertyLevel(
          componentLevelNode.id,
          propertyGroup.group ?? "",
          componentConfig.component.prop
        );

        // 过滤出实际存在的属性
        const existingPropertyLevel = allPropertyLevel.filter((property) => {
          return property.property && existingProperties.has(property.property);
        });

        // 如果该组有实际存在的属性，才添加这个属性组
        if (existingPropertyLevel.length > 0) {
          // 设置每个状态的属性数据
          statusList.forEach((status) => {
            existingPropertyLevel.forEach((property) => {
              setPropertyStatusData(status, property, componentLevelNode.id);
            });
          });

          // 创建新的属性组节点，只包含实际存在的属性
          const filteredPropertyGroup: PropertyNode = {
            ...propertyGroup,
            children: [...existingPropertyLevel]
          };

          filteredPropertyGroupLevel.push(filteredPropertyGroup);
        }
      });

      componentLevelNode.children.push(...filteredPropertyGroupLevel);
    };

    buildComponentLevel();
    componentLevel.forEach(buildPropertyLevel);

    return componentLevel;
  });

  const getCurrentStatusList = computed(() => {
    if (!selectAnimationId.value || !animationState.value.statusAnimations[selectAnimationId.value]) {
      return [];
    }
    return Object.entries(animationState.value.statusAnimations[selectAnimationId.value]).map(
      ([_statusId, statusAnimation]) => statusAnimation
    );
  });

  const snapshotComponentConfig = () => {
    const uniqueComponentIds = new Set<string>();

    // 单次遍历：动画 -> 状态 -> 组件
    for (const animationId of Object.keys(animationState.value.componentAnimations)) {
      const statusIdToComponents = animationState.value.componentAnimations[animationId];
      for (const statusId of Object.keys(statusIdToComponents)) {
        const components = statusIdToComponents[statusId];
        if (!components) continue;
        for (const componentId of Object.keys(components)) {
          uniqueComponentIds.add(componentId);
        }
      }
    }

    // 快照组件配置
    uniqueComponentIds.forEach((componentId) => {
      const componentConfig = allComponentMap.value.get(componentId);
      if (!componentConfig) return;

      // 使用 JSON 深拷贝
      const clone: typeof componentConfig = cloneDeep(toRaw(componentConfig));
      componentDefaultConfigMap.value.set(`${componentConfig.id}`, clone);
    });
  };

  const resetComponentConfig = () => {
    // 获取当前激活的动画ID和状态ID
    const currentAnimationId = selectAnimationId.value;
    const statusList = getCurrentStatusList.value;
    if (!currentAnimationId || !statusList.length) {
      return;
    }

    const currentRenderComponentList = getRenderTableData.value.map((item) => item.id);

    const currentStatusId = statusList[0].statusId;
    if (!currentAnimationId || !currentStatusId) {
      return;
    }

    // 使用 resetTargetComponentConfig 来重置每个组件
    for (const componentId of currentRenderComponentList) {
      resetTargetComponentConfig(componentId.toString());
    }
  };

  const resetTargetComponentConfig = (componentId: string) => {
    const component = allComponentMap.value.get(componentId);
    if (!component) {
      return;
    }

    const rawComponent = componentDefaultConfigMap.value.get(componentId);
    if (!rawComponent) {
      return;
    }

    // 获取当前激活的动画ID和状态ID
    const currentAnimationId = selectAnimationId.value;
    const statusList = getCurrentStatusList.value;

    if (!currentAnimationId || !statusList.length) {
      // 如果没有激活的动画，直接深拷贝
      const clonedRawComponent = cloneDeep(toRaw(rawComponent));
      smartApplyComponentConfig(component, clonedRawComponent);
      return;
    }

    const currentStatusId = statusList[0].statusId;
    const builder = ComponentConfigBuilder.createDefault();

    // 获取该组件在当前动画状态下的配置
    const componentAnimationConfig =
      animationState.value.componentAnimations[currentAnimationId]?.[currentStatusId]?.[componentId];

    if (componentAnimationConfig) {
      // 使用 ComponentConfigBuilder 的反向提取功能，从备份组件中提取动画相关属性
      const extractResult = builder.extractToComponent({
        animationConfig: componentAnimationConfig,
        component: rawComponent
      });
      const clonedResult = JSON.parse(JSON.stringify(extractResult.config));
      if (extractResult.config) {
        smartApplyComponentConfig(component, clonedResult);
      }
    } else {
      // 如果没有动画配置，直接深拷贝原始组件
      const clonedRawComponent = cloneDeep(toRaw(rawComponent));
      smartApplyComponentConfig(component, clonedRawComponent);
    }
  };

  return {
    state: {
      ...animationState.value,
      editorVisible: editorVisible.value,
      editorHeight: editorHeight.value,
      selectAnimationId: selectAnimationId.value,
      selectStatusId: selectStatusId.value,
      selectedRowId: selectedRowId.value,
      componentDefaultConfigMap: componentDefaultConfigMap.value
    },
    editorVisible,
    editorHeight,
    selectAnimationId,
    selectStatusId,
    selectedRowId,
    componentDefaultConfigMap,
    animations,
    statusAnimations,
    componentAnimations,
    animatedComponentIds,
    getRenderTableData,
    getCurrentStatusList,

    getCurrentAnimationList,
    setEditorVisible,
    setEditorHeight,
    setSelectAnimationId,
    setSelectStatusId,
    setSelectedRowId,
    updateAnimationState: updateAnimationStateData,
    setStatusAnimation,
    setComponentAnimations,
    snapshotComponentConfig,
    resetComponentConfig,
    resetState,
    resetStatusAnimationOnPanelChange,
    resetTargetComponentConfig,
    triggerDragCompleteAnimation,
    dragCompleteSignal
  };
});

export type UseStatusAnimationDataReturn = ReturnType<typeof useStatusAnimationData>;
