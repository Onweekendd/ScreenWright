import type { ComponentType } from "@/views/build/components/buildRender/type";

/**
 * @description 动画组基本信息
 */
export interface AnimationInfo {
  /** @description 动画组id */
  id: string;

  /** @description 动画组名称 */
  name: string;

  /** @description 动画组持续时间 */
  duration: number;

  /** @description 动态面板id */
  panelId?: number;

  /** @description 状态id */
  statusId?: string;
}

/**
 * @description 状态动画项映射
 */
export interface StatusAnimationMapping {
  /** @description 状态id */
  statusId: string;

  /** @description 状态名称 */
  statusName: string;
}

/**
 * @description 组件动画配置
 */
export interface ComponentAnimationConfig {
  /** @description 组件id */
  componentId: string;

  /** @description 横坐标 */
  left: number;

  /** @description 纵坐标 */
  top: number;

  /** @description 宽度 */
  width: number;

  /** @description 高度 */
  height: number;

  /** @description 透明度 */
  opacity: number;

  /** @description 旋转x */
  rotateX: number;

  /** @description 旋转y */
  rotateY: number;

  /** @description 旋转z */
  rotateZ: number;

  /** @description 显示 */
  display: boolean;

  /** @description 图片 */
  image?: string;

  /** @description 字体大小 */
  fontSize?: number;

  /** @description 层级 */
  zIndex: number;

  /** @description 视频 */
  video?: string;
}

export type AnimationProperty = Omit<ComponentAnimationConfig, "componentId">;

/**
 * @description 后端保存的状态动画数据
 */
export interface StatusAnimationResponse {
  /**
   *  @description 存储所有动画组的基本信息
   */
  animations: {
    [animationId: string]: AnimationInfo;
  };

  /**
   *  @description 存储状态动画项的映射关系
   */
  statusAnimations: {
    [animationId: string]: {
      [statusId: string]: StatusAnimationMapping;
    };
  };

  /**
   *  @description 存储组件动画的具体配置
   */
  componentAnimations: {
    [animationId: string]: {
      [statusId: string]: {
        [componentId: string]: ComponentAnimationConfig;
      };
    };
  };
}

/**
 * @description 属性节点接口
 */
export interface PropertyNode {
  /**
   * @description 节点ID
   * @example
   * 組件節點 1315258
   * 屬性分組節點 1315258-position
   * 屬性名稱節點 1315258-position-left
   */
  id: string;

  /** @description 属性名称 */
  property?: keyof ComponentAnimationConfig;

  /**
   * @description 分组名称
   * @example "position"
   */
  group?: string;

  /** @description 组件名称 */
  componentName?: string;

  /** @description 层级 */
  level: number;

  /** @description 各状态下的属性值 */
  states?: {
    [statusId: string]: any;
  };

  /** @description 子节点 */
  children?: PropertyNode[];

  /** @description 类型 */
  type?: string;
}

/**
 * @description 状态的数据结构
 */
export interface State extends StatusAnimationResponse {
  /**
   *  @description 编辑器是否显示
   */
  editorVisible: boolean;

  /**
   * @description 编辑器高度
   * */
  editorHeight: number;

  /**
   * @description 选中的动画组id
   */
  selectAnimationId: string;

  /**
   * @description 选中的状态动画id
   */
  selectStatusId: string;

  /**
   * @description 选中的Id（用于高亮显示）
   */
  selectedRowId: string;

  /**
   * @description 组件默认配置映射
   */
  componentDefaultConfigMap: Map<string, ComponentType>;
}

/**
 * 组件动画属性分组工具类
 * 根据ComponentAnimationConfig中的属性自动生成分组
 */

/**
 * 属性分组接口定义
 */
export interface PropertyGroup {
  /** 分组名称 */
  name: string;
  /** 属性类型 */
  type: "number" | "boolean";
  /** 属性名称列表 */
  properties: string[];
}

/**
 * 属性状态接口定义
 */
export interface PropertyState {
  /** 属性ID */
  id?: string;
  /** 属性名称 */
  property?: string;
  /** 各状态的属性值 */
  states?: Record<string, any>;
  /** 所属分组名称 */
  group?: string;
  /** 组件名称 */
  componentName?: string;
}

/**
 * 属性节点接口定义
 */
export interface PropertyNode {
  /** 节点ID */
  id: string;
  /** 属性名称 */
  property?: keyof ComponentAnimationConfig;
  /** 各状态的属性值 */
  states?: Record<string, any>;
}

/**
 * 分组节点接口定义
 */
export interface GroupNode {
  /** 节点ID */
  id: string;
  /** 分组名称 */
  group: string;
  /** 子节点 */
  children: PropertyNode[];
}

/**
 * 组件节点接口定义
 */
export interface ComponentNode {
  /** 节点ID */
  id: string;
  /** 组件名称 */
  componentName: string;
  /** 子节点 */
  children: GroupNode[];
}
