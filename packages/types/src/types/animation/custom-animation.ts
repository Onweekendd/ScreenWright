/**
 * 动画时间函数类型
 * @description 定义动画的速度曲线，控制动画在执行过程中的速度变化
 */
export type TimingFunctionType =
  | "none" // 无缓动效果
  | "linear" // 匀速运动
  | "ease" // 慢快慢（默认缓动）
  | "ease-in" // 慢速开始
  | "ease-out" // 慢速结束
  | "ease-in-out"; // 慢速开始和结束

/**
 * 动作类型
 * @description 定义具体的动作效果类型
 */
export type ActionType =
  | "opacity" // 透明度变化（渐隐渐现）
  | "slideLeft" // 向左滑动
  | "slideRight" // 向右滑动
  | "slideUp" // 向上滑动
  | "slideDown" // 向下滑动
  | ""; // 无动作

/**
 * 动画类型
 * @description 定义组件进入或退出的动画效果
 */
export type AnimationType =
  | "" // 无动画
  | "none" // 无效果
  | "slide-mini-in" // 小幅度移入
  | "slide-in" // 移入
  | "slide-in-blurred" // 模糊移入
  | "slide-clip-in" // 擦除移入
  | "slide-scale-in" // 缩放移入
  | "opacity-in" // 渐入
  | "slide-mini-out" // 小幅度移出
  | "slide-out" // 移出
  | "slide-out-blurred" // 模糊移出
  | "slide-clip-out" // 擦除移出
  | "slide-scale-out" // 缩放移出
  | "opacity-out"; // 渐出

/**
 * 动画方向
 * @description 定义动画执行的方向
 */
export type AnimationDirection =
  | "left" // 从左到右
  | "right" // 从右到左
  | "top" // 从上到下
  | "bottom" // 从下到上
  | "center" // 从中心
  | "tl" // 从左上角
  | "tr" // 从右上角
  | "bl" // 从左下角
  | "br" // 从右下角
  | "" // 无方向
  | "none"; // 方向不可用

/**
 * 激活的动画列表
 * @description 记录当前激活状态下的动画配置
 */
export type ActiveAnimationList = Array<{
  /** 动态面板 ID（可选） */
  panelId?: number;
  /** 状态 ID（可选） */
  statusId?: string;
  /** 动画唯一标识符 */
  animationId: string;
  /** 动画触发类型：加载时或卸载时 */
  type: "load" | "unload";
}>;

/**
 * 动画响应项
 * @description 需要上传到后端的动画配置数据结构
 */
export type AnimationResponseItem = {
  /** 动画唯一标识符（UUID 格式） */
  id: string;

  /** 动画组标题/名称 */
  name: string;

  /** 组件动画设置列表 */
  componentSetting: Array<ComponentSettingItem>;

  /** 是否启用该动画（可选） */
  isEnable?: boolean;

  /** 关联的动态面板 ID（可选） */
  panelId?: number;

  /** 关联的状态 ID（可选） */
  statusId?: string;
};

/**
 * 组件动画设置项
 * @description 定义单个组件的动画配置参数
 */
export type ComponentSettingItem = {
  /** 组件 ID */
  id: number;

  /** 动画效果类型 */
  animationType: AnimationType;

  /** 动画执行方向 */
  direction: AnimationDirection;

  /** 动画速度曲线/时间函数 */
  timingFunction: TimingFunctionType;

  /** 动画持续时间（单位：毫秒） */
  duration: number;

  /** 动画开始前的延迟时间（单位：毫秒） */
  delay: number;

  /** 动画迭代次数（可选，默认为 1 次） */
  iterationCount?: number;

  /** 动画触发时机：加载、卸载或无 */
  type: "load" | "unload" | "none";
};

/**
 * 动画项
 * @description 动画项的完整数据结构，继承自响应项并添加本地属性
 */
export type AnimationItem = AnimationResponseItem & {
  /** 是否正在重命名（本地 UI 状态，不保存到后端） */
  isRename?: boolean;
};

export type OnAnimationPropertyChangePayload<P extends keyof ComponentSettingItem> = {
  property: P;
  value: ComponentSettingItem[P];
  componentSettingItem: ComponentSettingItem;
  isThrottle?: boolean;
  isFormOutside?: boolean;
  animationId?: string;
};

/**
 * 自定义动画编辑器状态
 * @description 动画编辑器的完整状态管理结构
 */
export interface State {
  /** 动画列表 */
  animationList: Array<AnimationItem>;

  /** 当前选中的动画 ID */
  selectId: string;

  /** 是否显示自定义动画编辑器 */
  showCustomAnimation: boolean;

  /** 是否正在播放动画预览 */
  isPlay: boolean;

  /** 当前动画播放进度时间（毫秒） */
  progressTime: number;

  /** 当前激活的动画列表 */
  activeAnimationList: ActiveAnimationList;

  /** 时间轴滚动距离（像素） */
  timeLineScrollLeft: number;

  /** 时间轴步长（毫秒/格） */
  step: number;

  /** 时间轴每格对应的像素宽度 */
  stepDistance: number;

  /** 时间轴可见区域宽度（像素） */
  visibleWidth: number;

  /** 编辑器高度（像素） */
  editorHeight: number;

  /** 动画最大时长（毫秒） */
  maxTime: number;

  /** 历史记录（用于撤销/重做） */
  history: {
    /** 撤销列表 */
    undoList: Array<{ animationList: AnimationItem[]; activeAnimationList: ActiveAnimationList }>;
    /** 重做列表 */
    redoList: Array<{ animationList: AnimationItem[]; activeAnimationList: ActiveAnimationList }>;
    /** 最大历史记录数量 */
    maxHistory: number;
  };
}

export type ComponentResponseSetting = ComponentSettingItem;
