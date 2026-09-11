import type { ComponentType, PanelState, SystemComponentProps } from "@screenwright/types";
import { PanelEnum } from "@screenwright/types";

import type {
  LargeScreenConfigDto,
  LargeScreenInfoDto,
  LayerItem,
  PackageLargeScreen,
  ViewOption
} from "@/mastra/types";
import { PackageLargeScreenSchema } from "@/mastra/types";

/**
 * PanelState 的 config 转换为 ID 数组后的类型
 */
type PanelStateWithIdConfig = Omit<PanelState, "config"> & {
  config: number[];
};

/**
 * 打平后的组件类型，其中 children 和 panelData.config 都转换为 ID 数组
 */
export type FlattenedComponent = Omit<ComponentType, "children" | "parent"> & {
  parent?: number;
  children?: number[];
  panelData?: PanelStateWithIdConfig[];
};

/**
 * ViewOption 转换为 PackageLargeScreen 的选项
 */
export interface PackageConversionOptions {
  /** 大屏 ID（必填） */
  largeScreenId: number;
  /** 大屏配置 ID（必填） */
  largeScreenConfigId: number;
  /** 用户 ID（必填） */
  userId: number;
  /** 创建人（必填） */
  createdBy: string;
  /** 更新人（必填） */
  updatedBy: string;
  /** 分组 ID（默认：0） */
  groupId?: number;
  /** 类型（默认：1） */
  type?: number;
  /** 库存类型（默认：0） */
  stockType?: number;
  /** 状态（默认：false） */
  status?: boolean;
  /** 排序（默认：999999） */
  sort?: number;
  /** 邀请码（可选，未提供时自动生成） */
  invitationCode?: string;
  /** 创建时间（默认：当前时间戳） */
  createdTime?: number;
  /** 更新时间（默认：当前时间戳） */
  updatedTime?: number;
}

const renderSystemComponentType: PanelEnum[] = [PanelEnum.dynamicPanel, PanelEnum.encodePanel, PanelEnum.quotePanel];

function flattenGroupChildren({
  component,
  parentDynamicPanelId,
  result
}: {
  component: ComponentType;
  parentDynamicPanelId: number[] | undefined;
  result: FlattenedComponent[];
}) {
  flattenComponents({
    componentList: component.children as ComponentType[],
    groupParentId: component.id,
    parentDynamicPanelId,
    result
  });

  const childrenIds = component.children?.map((child) => child.id) ?? [];
  result.push({ ...component, children: childrenIds, parentDynamicPanelId });
}

function flattenPanelStates({
  component,
  parentDynamicPanelId,
  result
}: {
  component: SystemComponentProps;
  parentDynamicPanelId: number[] | undefined;
  result: FlattenedComponent[];
}) {
  component.panelData!.forEach((state) => {
    if (!state.config?.length) {
      return;
    }

    flattenComponents({
      componentList: state.config as ComponentType[],
      parentDynamicPanelId: [...(parentDynamicPanelId ?? []), component.id],
      result
    });
  });

  const directChildIds: PanelStateWithIdConfig[] = component.panelData.map((state) => {
    return {
      ...state,
      config: state.config.map((c) => c.id)
    };
  });

  result.push({ ...component, panelData: directChildIds, parentDynamicPanelId } as FlattenedComponent);
}

function buildFlattenedComponent({
  component,
  groupParentId,
  parentDynamicPanelId
}: {
  component: ComponentType;
  groupParentId: number | undefined;
  parentDynamicPanelId: number[] | undefined;
}): FlattenedComponent {
  const { children: _c, parent: _p, ...rest } = component;
  return {
    ...rest,
    parentDynamicPanelId,
    ...(groupParentId !== undefined && { parent: groupParentId })
  };
}

/**
 * 递归反转组件的子节点顺序
 * - 反转分组的 children
 * - 反转动态面板的 panelData[].config
 * @param components 组件列表
 */
function reverseComponentChildren(components: ComponentType[]): void {
  for (const component of components) {
    // 反转分组的 children
    if (component.children?.length) {
      component.children.reverse();
      reverseComponentChildren(component.children as ComponentType[]);
    }

    // 反转动态面板的 panelData[].config
    if ((component as SystemComponentProps).panelData) {
      const systemComp = component as SystemComponentProps;
      for (const state of systemComp.panelData) {
        if (state.config?.length) {
          state.config.reverse();
          reverseComponentChildren(state.config as ComponentType[]);
        }
      }
    }
  }
}

/**
 * 将嵌套组件结构打平为顶层数组
 * @param componentList 嵌套的组件列表
 * @param groupParentId 父分组组件 ID（仅当父节点是 Group 时传入）
 * @returns 打平的组件数组，其中嵌套的 children 和 panelData.config 替换为 ID 数组
 */
export function flattenComponents({
  componentList,
  groupParentId,
  parentDynamicPanelId = [],
  result = [] as FlattenedComponent[]
}: {
  componentList: ComponentType[];
  groupParentId?: number;
  parentDynamicPanelId?: number[];
  result?: FlattenedComponent[];
}): FlattenedComponent[] {
  if (!Array.isArray(componentList)) {
    console.error("flattenComponents: componentList 必须是数组，收到:", typeof componentList, componentList);
  }

  for (const component of componentList) {
    if (component.children?.length) {
      flattenGroupChildren({ component, parentDynamicPanelId, result });
    } else if (
      (component as SystemComponentProps).panelData &&
      renderSystemComponentType.includes(component.component?.prop as PanelEnum)
    ) {
      flattenPanelStates({ component: component as SystemComponentProps, parentDynamicPanelId, result });
    } else {
      result.push(buildFlattenedComponent({ component, groupParentId, parentDynamicPanelId }));
    }
  }

  return result;
}

/**
 * 将 ViewOption 转换为 PackageLargeScreen 结构（后端 package_large_screen 格式）
 * @param viewOption - view.js 中的 ViewOption 对象
 * @param options - 包含 ID 的转换选项
 * @returns 与后端 API 兼容的 PackageLargeScreen 对象
 *
 * @example
 * ```typescript
 * const package = convertViewToPackageLargeScreen(viewOption, {
 *   largeScreenId: 26429,
 *   largeScreenConfigId: 17298,
 *   userId: 219,
 *   createdBy: "onweekend",
 *   updatedBy: "onweekend"
 * });
 * ```
 */
export function convertViewToPackageLargeScreen(
  viewOption: ViewOption,
  options: PackageConversionOptions
): PackageLargeScreen {
  const {
    largeScreenId,
    largeScreenConfigId,
    userId,
    createdBy,
    updatedBy,
    groupId = 0,
    type = 1,
    stockType = 0,
    status = false,
    sort = 999999,
    invitationCode = crypto.randomUUID(),
    createdTime = Date.now(),
    updatedTime = Date.now()
  } = options;

  // 在打平之前，先反转所有组件的子节点顺序
  reverseComponentChildren(viewOption.component as ComponentType[]);

  const flattedComponents: FlattenedComponent[] = flattenComponents({
    componentList: viewOption.component as ComponentType[],
    groupParentId: undefined,
    parentDynamicPanelId: [],
    result: []
  });

  // 重新赋值 zIndex（从 1 开始递增）
  flattedComponents.forEach((comp, index) => {
    comp.zIndex = index + 1;
  });

  // 构建图层列表
  const layersList: LayerItem[] = flattedComponents.map((comp) => ({
    moduleId: comp.moduleId,
    largeId: largeScreenId,
    config: JSON.stringify(comp),
    minioIds: "[]",
    dataJson: "{}",
    versionCode: "1",
    createdBy,
    createdTime,
    updatedBy,
    updatedTime,
    id: comp.id,
    userId
  }));

  // 构建 largeScreenInfo
  const largeScreenInfo: LargeScreenInfoDto = {
    config: `[${flattedComponents
      .filter((comp) => !comp.parent && (!comp.parentDynamicPanelId || comp.parentDynamicPanelId.length === 0))
      .map((comp) => comp.id)
      .join(",")}]`,
    name: viewOption.detail.name,
    detail: JSON.stringify(viewOption.detail),
    sceneInfo: "{}",
    type,
    stockType,
    groupId,
    invitationCode,
    status,
    sort,
    versionCode: "1",
    minioIds: "[]",
    dataFilterArr: JSON.stringify(viewOption.dataFilterArr),
    aniFrameSet: JSON.stringify(viewOption.aniFrameSet),
    statusAnimation: JSON.stringify(viewOption.statusAnimation),
    createdBy,
    createdTime,
    updatedBy,
    updatedTime,
    id: largeScreenId,
    userId
  };

  // 构建 largeScreenConfig
  const largeScreenConfig: LargeScreenConfigDto = {
    largeId: largeScreenId,
    config: `[${flattedComponents
      .filter((comp) => !comp.parent && (!comp.parentDynamicPanelId || comp.parentDynamicPanelId.length === 0))
      .map((comp) => comp.id)
      .join(",")}]`,
    detail: JSON.stringify(viewOption.detail),
    dataFilterArr: JSON.stringify(viewOption.dataFilterArr),
    aniFrameSet: JSON.stringify(viewOption.aniFrameSet),
    statusAnimation: JSON.stringify(viewOption.statusAnimation),
    sceneInfo: "{}",
    status,
    minioIds: "[]",
    versionCode: "1",
    createdBy,
    createdTime,
    updatedBy,
    updatedTime,
    id: largeScreenConfigId,
    userId
  };

  const result = {
    largeScreenInfo,
    largeScreenConfig,
    layersList
  };

  // 使用 zod schema 验证并返回解析结果
  return PackageLargeScreenSchema.parse(result);
}
