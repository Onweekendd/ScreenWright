import type { timingFunctionType } from "../../../constants/index";

/**
 * @description 用于定义动作类型
 */
type ActionType = "opacity" | "slideLeft" | "slideRight" | "slideUp" | "slideDown" | "";

/**
 * @description 用于定义动画类型
 */
type AnimationType =
  | ""
  | "none"
  | "slide-mini-in"
  | "slide-in"
  | "slide-in-blurred"
  | "slide-clip-in"
  | "slide-scale-in"
  | "opacity-in"
  | "slide-mini-out"
  | "slide-out"
  | "slide-out-blurred"
  | "slide-clip-out"
  | "slide-scale-out"
  | "opacity-out";

/**
 * @description 用于定义动画速率
 */
type TimingFunctionType = timingFunctionType;

/**
 * @description 用于定义动画方向
 */
type AnimationDirection = "left" | "right" | "top" | "bottom" | "center" | "tl" | "tr" | "bl" | "br" | "" | "none";

type ActiveAnimationList = Array<{
  panelId?: number;
  statusId?: string;
  animationId: string;
  type: "load" | "unload";
}>;

/**
 * @description 需要上传到后端
 */
type AnimationResponseItem = {
  /** @description uuid */
  id: string;

  /** @description 标题 */
  name: string;

  /** @description 组件设置 */
  componentSetting: Array<ComponentSettingItem>;

  /** @description 是否启用 */
  isEnable?: boolean;

  /** @description 面板id */
  panelId?: number;

  /** @description 状态id */
  statusId?: string;
};

type ComponentSettingItem = {
  /** @description 组件id */
  id: number;

  /** @description 动效 */
  animationType: AnimationType;

  /** @description 方向 */
  direction: AnimationDirection;

  /** @description 速率 */
  timingFunction: TimingFunctionType;

  /** @description 持续时间（时长）ms */
  duration: number;

  /** @description 开始时间（延时）ms */
  delay: number;

  /** @description 迭代次数 */
  iterationCount?: number;

  /**@description 载出或卸载 */
  type: "load" | "unload" | "none";
};

/**
 * @description 动画项的数据结构
 */
type AnimationItem = AnimationResponseItem & {
  /** @description 是否正在重命名 本地属性 */
  isRename?: boolean;
};

type OnAnimationPropertyChangePayload<P extends keyof ComponentSettingItem> = {
  property: P;
  value: ComponentSettingItem[P];
  componentSettingItem: ComponentSettingItem;
  isThrottle?: boolean;
  isFormOutside?: boolean;
  animationId?: string;
};

/**
 * @description 状态的数据结构
 */
interface State {
  /** @description 动画列表 */
  animationList: Array<AnimationItem>;

  /** @description 当前选中的动画的key */
  selectId: string;

  /** @description 是否编辑动画中 */
  showCustomAnimation: boolean;

  /** @description 是否播放中 */
  isPlay: boolean;

  /** @description 当前进度的时间 */
  progressTime: number;

  /** @description 当前激活的动画列表 */
  activeAnimationList: ActiveAnimationList;

  /** @description 时间轴滚动距离 */
  timeLineScrollLeft: number;

  /** @description 时间轴步长 */
  step: number;

  /** @description 时间轴步长对应的像素 */
  stepDistance: number;

  /** @description 可见宽度 */
  visibleWidth: number;

  /** @description 编辑器高度 */
  editorHeight: number;

  /** @description 最大时间 */
  maxTime: number;

  /** @description 历史记录 */
  history: {
    undoList: Array<{ animationList: AnimationItem[]; activeAnimationList: ActiveAnimationList }>;
    redoList: Array<{ animationList: AnimationItem[]; activeAnimationList: ActiveAnimationList }>;
    maxHistory: number;
  };
}

export type {
  ActionType,
  ActiveAnimationList,
  AnimationDirection,
  AnimationItem,
  AnimationResponseItem,
  AnimationType,
  ComponentSettingItem as ComponentResponseSetting,
  ComponentSettingItem,
  OnAnimationPropertyChangePayload,
  State,
  TimingFunctionType
};
