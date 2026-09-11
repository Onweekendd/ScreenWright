import { throttle } from "lodash-es";

import { updateLargeScreen } from "@/api/library";
import { uuid } from "@/utils/utils";
import type { ComponentType } from "@/views/build/components/buildRender/type";

import { ComponentConfigBuilder } from "../components/hooks/generators/ComponentConfigBuilder";
import { COMPONENT_TYPE_MAPPINGS, DEFAULT_PROPERTY_MAPPINGS } from "../components/hooks/generators/mappings";
import type { ComponentAnimationConfig, PropertyNode, StatusAnimationMapping, StatusAnimationResponse } from "../type";
import type { AnimationProperty } from "../type";

export interface UpdateRemoteDataParam {
  screenId: number;
  data: StatusAnimationResponse;
  onSuccess?: (result?: any) => void;
  onError?: (error?: any) => void;
}

interface PropertyGroup {
  name: string;
  type: "number" | "boolean" | "string";
  properties: Array<keyof ComponentAnimationConfig>;
}

interface CreateDefaultAnimationParams {
  panelId?: number;
  activeStatusId?: string;
  statusIndex: number;
  existingAnimations: StatusAnimationResponse;
}

interface CreateNewStatusParams {
  animationId: string;
  statusAnimations: StatusAnimationResponse["statusAnimations"];
  componentAnimations: StatusAnimationResponse["componentAnimations"];
  sourceStatusId: string;
}

interface CreateNewStatusResult {
  newStatusId: string;
  newStatusAnimation: StatusAnimationResponse["statusAnimations"];
  newComponentAnimations: StatusAnimationResponse["componentAnimations"];
}

interface PrepareUpdateDataParams {
  animations: StatusAnimationResponse["animations"];
  statusAnimations: StatusAnimationResponse["statusAnimations"];
  componentAnimations: StatusAnimationResponse["componentAnimations"];
  newStatusAnimation: StatusAnimationResponse["statusAnimations"];
  newComponentAnimations: StatusAnimationResponse["componentAnimations"];
}

interface PrepareUpdateDataResult {
  backUpData: StatusAnimationResponse;
  toUpdateData: StatusAnimationResponse;
}

export interface DeleteStatusParams {
  animationId: string;
  statusId: string;
  statusAnimations: StatusAnimationResponse["statusAnimations"];
  componentAnimations: StatusAnimationResponse["componentAnimations"];
}

export interface DeleteStatusResult {
  newStatusAnimations: StatusAnimationResponse["statusAnimations"];
  newComponentAnimations: StatusAnimationResponse["componentAnimations"];
}

/**
 * 更新远程数据
 */
const updateRemoteData = async ({ screenId, data, onSuccess, onError }: UpdateRemoteDataParam): Promise<void> => {
  try {
    const { code } = await updateLargeScreen({
      id: screenId,
      filterType: true,
      statusAnimation: JSON.stringify(data)
    });
    if (code !== 200) {
      throw new Error("更新失败");
    }
    onSuccess?.(data);
  } catch (error) {
    onError?.(error);
  }
};

/**
 * 节流更新远程数据
 */
export const updateRemoteDataThrottle: (param: UpdateRemoteDataParam) => void = throttle(
  async (param: UpdateRemoteDataParam) => {
    await updateRemoteData(param);
  },
  700,
  { trailing: true }
);

/**
 * 创建默认动画数据
 */
export const createDefaultAnimation = ({
  panelId,
  activeStatusId,
  statusIndex,
  existingAnimations
}: CreateDefaultAnimationParams): StatusAnimationResponse => {
  // 生成唯一的动画ID
  let animationId = uuid();
  let retryCount = 0;
  const maxRetries = 10;

  // 检查动画ID是否冲突，如果冲突则重新生成
  while (
    existingAnimations &&
    existingAnimations.animations &&
    Object.prototype.hasOwnProperty.call(existingAnimations.animations, animationId) &&
    retryCount < maxRetries
  ) {
    console.warn(`动画ID冲突检测: ${animationId} 已存在，正在重新生成...`);
    animationId = uuid();
    retryCount++;
  }

  if (retryCount >= maxRetries) {
    console.error("无法生成唯一的动画ID，已达到最大重试次数");
    throw new Error("动画ID生成失败：无法创建唯一标识符");
  }

  // 生成唯一的状态ID
  let statusId = uuid();
  retryCount = 0;

  // 检查状态ID在所有动画中是否冲突
  const allExistingStatusIds = new Set<string>();
  if (existingAnimations && existingAnimations.statusAnimations) {
    Object.values(existingAnimations.statusAnimations).forEach((statusMap) => {
      Object.keys(statusMap).forEach((sId) => allExistingStatusIds.add(sId));
    });
  }

  while (allExistingStatusIds.has(statusId) && retryCount < maxRetries) {
    console.warn(`状态ID冲突检测: ${statusId} 已存在，正在重新生成...`);
    statusId = uuid();
    retryCount++;
  }

  if (retryCount >= maxRetries) {
    console.error("无法生成唯一的状态ID，已达到最大重试次数");
    throw new Error("状态ID生成失败：无法创建唯一标识符");
  }

  if (retryCount > 0) {
    console.log(`成功生成唯一ID - 动画ID: ${animationId}, 状态ID: ${statusId}`);
  }

  return {
    animations: {
      [animationId]: {
        id: animationId,
        name: `动画${statusIndex}`,
        duration: 1000,
        panelId: panelId,
        statusId: activeStatusId
      }
    },
    statusAnimations: {
      [animationId]: {
        [statusId]: {
          statusId,
          statusName: `状态1`
        }
      }
    },
    componentAnimations: {
      [animationId]: {
        [statusId]: {}
      }
    }
  };
};

/**
 * 创建新状态
 */
export const createNewStatus = ({
  animationId,
  statusAnimations,
  componentAnimations,
  sourceStatusId
}: CreateNewStatusParams): CreateNewStatusResult => {
  // 获取当前动画组的所有状态
  const currentAnimationStatusMap = statusAnimations[animationId] || {};
  const statusIds = Object.keys(currentAnimationStatusMap);

  // 生成新状态ID和名称
  const newStatusId = uuid();
  const newStatusName = `状态_${statusIds.length + 1}`;

  // 创建新状态对象
  const newStatus: StatusAnimationMapping = {
    statusId: newStatusId,
    statusName: newStatusName
  };

  // 复制组件动画配置
  const sourceComponentConfigs = componentAnimations[animationId]?.[sourceStatusId] || {};

  const newComponentConfigs: Record<string, ComponentAnimationConfig> = {};

  // 深拷贝组件配置
  Object.keys(sourceComponentConfigs).forEach((componentId) => {
    newComponentConfigs[componentId] = { ...sourceComponentConfigs[componentId] };
  });

  // 构建新的状态动画对象
  const newStatusAnimation = {
    ...statusAnimations,
    [animationId]: {
      ...statusAnimations[animationId],
      [newStatusId]: newStatus
    }
  };

  // 构建新的组件动画对象
  const newComponentAnimations = {
    ...componentAnimations,
    [animationId]: {
      ...componentAnimations[animationId],
      [newStatusId]: newComponentConfigs
    }
  };

  return {
    newStatusId,
    newStatusAnimation,
    newComponentAnimations
  };
};

/**
 * 准备更新数据
 */
export const prepareUpdateData = ({
  animations,
  statusAnimations,
  componentAnimations,
  newStatusAnimation,
  newComponentAnimations
}: PrepareUpdateDataParams): PrepareUpdateDataResult => {
  // 备份原始数据
  const backUpData = {
    animations,
    statusAnimations,
    componentAnimations
  };

  // 创建要更新的数据
  const toUpdateData = {
    animations,
    statusAnimations: newStatusAnimation,
    componentAnimations: newComponentAnimations
  };

  return {
    backUpData,
    toUpdateData
  };
};

/**
 * 删除状态
 */
export const deleteStatus = ({
  animationId,
  statusId,
  statusAnimations,
  componentAnimations
}: DeleteStatusParams): DeleteStatusResult => {
  // 创建新的状态映射和组件动画对象
  const newStatusAnimations = { ...statusAnimations };
  const newComponentAnimations = { ...componentAnimations };

  // 删除状态映射
  const { [statusId]: _, ...restStatuses } = newStatusAnimations[animationId];
  newStatusAnimations[animationId] = restStatuses;

  // 删除对应的组件动画配置
  const { [statusId]: __, ...restComponentAnimations } = newComponentAnimations[animationId];
  newComponentAnimations[animationId] = restComponentAnimations;

  return {
    newStatusAnimations,
    newComponentAnimations
  };
};

/**
 * 属性分组配置
 */
const PROPERTY_GROUP_CONFIG: Record<string, Omit<PropertyGroup, "properties">> = {
  // 位置组
  position: {
    name: "定位",
    type: "number"
  },
  // 尺寸组
  size: {
    name: "尺寸",
    type: "number"
  },
  // 旋转组
  rotation: {
    name: "旋转",
    type: "number"
  },
  // 外观组
  appearance: {
    name: "透明度",
    type: "number"
  },
  // 显示组
  display: {
    name: "显示",
    type: "boolean"
  },
  zIndex: {
    name: "层级",
    type: "number"
  },
  // 图片组
  image: {
    name: "图片",
    type: "string"
  },
  // 字体大小组
  fontSize: {
    name: "字体大小",
    type: "number"
  },
  // 视频组
  video: {
    name: "视频",
    type: "string"
  }
};

/**
 * 从属性映射中自动推导属性组
 * @param componentType 组件类型
 * @returns 属性组配置
 */
export const derivePropertyGroupsFromMappings = (componentType: string): PropertyGroup[] => {
  // 获取该组件类型的所有映射
  const allMappings = [...DEFAULT_PROPERTY_MAPPINGS, ...(COMPONENT_TYPE_MAPPINGS[componentType] || [])];

  // 按分组收集属性
  const groupProperties: Record<string, string[]> = {};

  allMappings.forEach((mapping) => {
    if (mapping.group) {
      if (!groupProperties[mapping.group]) {
        groupProperties[mapping.group] = [];
      }
      groupProperties[mapping.group].push(mapping.source as string);
    }
  });

  // 构建属性组配置
  const propertyGroups: PropertyGroup[] = [];

  Object.entries(groupProperties).forEach(([groupKey, properties]) => {
    const groupConfig = PROPERTY_GROUP_CONFIG[groupKey];
    if (groupConfig) {
      propertyGroups.push({
        ...groupConfig,
        properties: [...new Set(properties)] as (keyof ComponentAnimationConfig)[]
      });
    }
  });

  return propertyGroups;
};

/**
 * 获取组件属性组配置（自动推导版本）
 * @param componentType 组件类型
 * @returns 属性组名称数组
 */
export const getComponentPropertyGroups = (componentType: string): string[] => {
  const propertyGroups = derivePropertyGroupsFromMappings(componentType);
  return propertyGroups.map((group) => {
    // 根据属性组名称返回对应的键名
    const groupKey = Object.keys(PROPERTY_GROUP_CONFIG).find((key) => PROPERTY_GROUP_CONFIG[key].name === group.name);
    return groupKey || group.name;
  });
};

/**
 * 获取完整的属性组配置（包含属性列表）
 * @param componentType 组件类型
 * @returns 完整的属性组配置
 */
export const getComponentPropertyGroupsWithProperties = (componentType: string): PropertyGroup[] => {
  return derivePropertyGroupsFromMappings(componentType);
};

/**
 * 创建属性组层级
 */
export const createPropertyGroupLevel = (componentId: string, componentType: string): PropertyNode[] => {
  const propertyGroups = getComponentPropertyGroupsWithProperties(componentType);
  return propertyGroups.map((group) => ({
    id: `${componentId}-${group.name}`,
    group: group.name,
    type: group.type,
    properties: group.properties,
    children: [],
    level: 2
  }));
};

/**
 * 创建属性层级
 */
export const createPropertyLevel = (
  componentId: string,
  targetGroupName: string,
  componentType: string
): PropertyNode[] => {
  const propertyGroups = getComponentPropertyGroupsWithProperties(componentType);
  return propertyGroups
    .filter((group) => group.name === targetGroupName)
    .map((group) => {
      return group.properties.map((property) => {
        const propertyNode: PropertyNode = {
          id: `${componentId}-${group.name}-${property}`,
          property,
          type: group.type,
          states: {},
          level: 3
        };
        return propertyNode;
      });
    })
    .flat();
};

/**
 * 根据指定键创建精简的组件动画配置
 * - 使用 ComponentConfigBuilder 的反向提取功能
 * - 仅挑选 keys 中的属性；如包含 image 则自动提取
 * - 始终附带 componentId
 */
export function createComponentAnimationConfigWithKeys(
  component: ComponentType,
  keys: Array<keyof AnimationProperty>
): ComponentAnimationConfig {
  // 创建模板对象，只包含需要提取的属性键
  const template: Partial<ComponentAnimationConfig> = {};
  for (const key of keys) {
    template[key] = undefined; // 值不重要，只需要键存在
  }

  // 使用 ComponentConfigBuilder 进行反向提取
  const builder = ComponentConfigBuilder.createDefault();
  const extractResult = builder.extract({ component, animationConfig: template });

  // 处理提取结果
  const extracted = extractResult.config as Partial<AnimationProperty>;

  return {
    ...extracted,
    componentId: `${component.id}`
  } as ComponentAnimationConfig;
}
