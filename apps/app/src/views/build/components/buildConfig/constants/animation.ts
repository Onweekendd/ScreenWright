// 动画类型
export type animationType =
  | ""
  | "none"
  | "slide-mini-in"
  | "slide-in"
  | "slide-in-blurred"
  | "slide-clip-in"
  | "slide-scale-in"
  | "opacity-in";

export const animationList: { label: string; value: animationType }[] = [
  { label: "无", value: "none" },
  { label: "移入(小)", value: "slide-mini-in" },
  { label: "移入", value: "slide-in" },
  { label: "划变", value: "slide-in-blurred" },
  { label: "擦除", value: "slide-clip-in" },
  { label: "缩放", value: "slide-scale-in" },
  { label: "渐隐渐显", value: "opacity-in" }
];

export type animationOutType =
  | "none"
  | "slide-mini-out"
  | "slide-out"
  | "slide-out-blurred"
  | "slide-clip-out"
  | "slide-scale-out"
  | "opacity-out";

export const animationOutList: { label: string; value: animationOutType }[] = [
  { label: "无", value: "none" },
  { label: "移出(小)", value: "slide-mini-out" },
  { label: "移出", value: "slide-out" },
  { label: "划变", value: "slide-out-blurred" },
  { label: "擦除", value: "slide-clip-out" },
  { label: "缩放", value: "slide-scale-out" },
  { label: "渐隐渐显", value: "opacity-out" }
];

// 时间函数
export type timingFunctionType = "none" | "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
export const timingFunction: { label: string; value: timingFunctionType }[] = [
  { label: "无", value: "none" },
  { label: "匀速", value: "linear" },
  { label: "慢快慢", value: "ease" },
  { label: "慢速开始", value: "ease-in" },
  { label: "慢速结束", value: "ease-out" },
  { label: "慢速开始和结束", value: "ease-in-out" }
];

// 动画位置
export enum animationPositionEnum {
  none = "",
  left = "left",
  right = "right",
  top = "top",
  bottom = "bottom",
  center = "center",
  tl = "tl",
  tr = "tr",
  bl = "bl",
  br = "br"
}

export type animationPositionType =
  | animationPositionEnum.none
  | animationPositionEnum.left
  | animationPositionEnum.right
  | animationPositionEnum.top
  | animationPositionEnum.bottom
  | animationPositionEnum.center
  | animationPositionEnum.tl
  | animationPositionEnum.tr
  | animationPositionEnum.bl
  | animationPositionEnum.br;

export const animationPosition: { label: string; value: animationPositionType }[] = [
  { label: "动画无方向", value: animationPositionEnum.none },
  { label: "方向不可用", value: animationPositionEnum.none },
  { label: "从左至右", value: animationPositionEnum.left },
  { label: "从右至左", value: animationPositionEnum.right },
  { label: "从上至下", value: animationPositionEnum.top },
  { label: "从下至上", value: animationPositionEnum.bottom },
  { label: "从中间到两侧", value: animationPositionEnum.center },
  { label: "从左上到右下", value: animationPositionEnum.tl },
  { label: "从右上到左下", value: animationPositionEnum.tr },
  { label: "从左下到右上", value: animationPositionEnum.bl },
  { label: "从右下到左上", value: animationPositionEnum.br }
];

// 动画退出位置
export enum animationOutPositionEnum {
  empty = "",
  none = "none",
  left = "left",
  right = "right",
  top = "top",
  bottom = "bottom",
  center = "center"
}
export type animationOutPositionType =
  | animationOutPositionEnum.empty
  | animationOutPositionEnum.none
  | animationOutPositionEnum.left
  | animationOutPositionEnum.right
  | animationOutPositionEnum.top
  | animationOutPositionEnum.bottom
  | animationOutPositionEnum.center;

export const animationOutPosition: { label: string; value: animationOutPositionType }[] = [
  { label: "动画无方向", value: animationOutPositionEnum.empty },
  { label: "方向不可用", value: animationOutPositionEnum.none },
  { label: "从左离场", value: animationOutPositionEnum.left },
  { label: "从右离场", value: animationOutPositionEnum.right },
  { label: "从上离场", value: animationOutPositionEnum.top },
  { label: "从下离场", value: animationOutPositionEnum.bottom },
  { label: "从中间离场", value: animationOutPositionEnum.center }
];

// 动作动画类型
export enum ActionAnimationTypeEnum {
  None = "none",
  Opacity = "opacity",
  SlideLeft = "slideLeft",
  SlideRight = "slideRight",
  SlideUp = "slideUp",
  SlideDown = "slideDown"
}
export type ActionTypeType =
  | ActionAnimationTypeEnum.None
  | ActionAnimationTypeEnum.Opacity
  | ActionAnimationTypeEnum.SlideLeft
  | ActionAnimationTypeEnum.SlideRight
  | ActionAnimationTypeEnum.SlideUp
  | ActionAnimationTypeEnum.SlideDown;

// 动画相关选项
export const actionTypeOptions: { label: string; value: ActionTypeType }[] = [
  { label: "无", value: ActionAnimationTypeEnum.None },
  { label: "渐隐渐现", value: ActionAnimationTypeEnum.Opacity },
  { label: "向左移动", value: ActionAnimationTypeEnum.SlideLeft },
  { label: "向右移动", value: ActionAnimationTypeEnum.SlideRight },
  { label: "向上移动", value: ActionAnimationTypeEnum.SlideUp },
  { label: "向下移动", value: ActionAnimationTypeEnum.SlideDown }
];
