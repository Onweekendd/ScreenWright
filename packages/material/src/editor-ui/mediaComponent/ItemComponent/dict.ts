import {
  EAnimationSpeed,
  EAnimationType,
  EArrowOption,
  EBackgroundImageType,
  EBackgroundType,
  EMixBlendMode,
  EObjectFit,
  ESeriesLabelOrient,
  ETextAlign,
  imgEAnimationType,
} from "./enum";
// 通用接口定义
import type { dictString } from "./type";

// 混合模式
export const mixBlendMode: dictString[] = [
  {
    label: "正常",
    value: EMixBlendMode.Normal,
  },
  {
    label: "正片叠底",
    value: EMixBlendMode.Multiply,
  },
  {
    label: "滤色",
    value: EMixBlendMode.Screen,
  },
  {
    label: "叠加",
    value: EMixBlendMode.Overlay,
  },
  {
    label: "变暗",
    value: EMixBlendMode.Darken,
  },
  {
    label: "变亮",
    value: EMixBlendMode.Lighten,
  },
  {
    label: "颜色减淡",
    value: EMixBlendMode.ColorDodge,
  },
  {
    label: "颜色加深",
    value: EMixBlendMode.ColorBurn,
  },
  {
    label: "强光",
    value: EMixBlendMode.HardLight,
  },
  {
    label: "柔光",
    value: EMixBlendMode.SoftLight,
  },
  {
    label: "差值",
    value: EMixBlendMode.Difference,
  },
  {
    label: "排除",
    value: EMixBlendMode.Exclusion,
  },
  {
    label: "色相",
    value: EMixBlendMode.Hue,
  },
  {
    label: "饱和度",
    value: EMixBlendMode.Saturation,
  },
  {
    label: "颜色",
    value: EMixBlendMode.Color,
  },
  {
    label: "亮度",
    value: EMixBlendMode.Luminosity,
  },
];

// 动画速度
export const animationSpeed: dictString[] = [
  { label: "匀速", value: EAnimationSpeed.Constant },
  { label: "慢快慢", value: EAnimationSpeed.SlowFastSlow },
  { label: "低速开始", value: EAnimationSpeed.StartSlow },
  { label: "低速结束", value: EAnimationSpeed.EndSlow },
];

// 动画类型
export const animationType: dictString[] = [
  {
    label: "默认",
    value: EAnimationType.Default,
  },
  {
    label: "透明度",
    value: EAnimationType.Opacity,
  },
  {
    label: "缩放",
    value: EAnimationType.Zoom,
  },
  {
    label: "顺时针旋转",
    value: EAnimationType.Clockwise,
  },
  {
    label: "逆时针旋转",
    value: EAnimationType.Counterclockwise,
  },
  {
    label: "回旋转",
    value: EAnimationType.BackAndForth,
  },
  {
    label: "上下平移",
    value: EAnimationType.UpOrDown,
  },
];

// 动画类型
export const imgAnimationType: dictString[] = [
  {
    label: "默认",
    value: imgEAnimationType.Default,
  },
  {
    label: "透明度",
    value: imgEAnimationType.Opacity,
  },
  {
    label: "缩放",
    value: imgEAnimationType.Zoom,
  },
  {
    label: "顺时针旋转",
    value: imgEAnimationType.Clockwise,
  },
  {
    label: "逆时针旋转",
    value: imgEAnimationType.Counterclockwise,
  },
  {
    label: "回旋转",
    value: imgEAnimationType.BackAndForth,
  },
  {
    label: "上下平移",
    value: imgEAnimationType.UpOrDown,
  },
  {
    label: "自定义",
    value: imgEAnimationType.Customize,
  },
];

// 背景填充方式
export const backgroundType: dictString[] = [
  { label: "颜色", value: EBackgroundType.Color },
  { label: "自定义", value: EBackgroundType.Custom },
];

//填充类型
export const backgroundImageType: dictString[] = [
  { label: "适应", value: EBackgroundImageType.Adapt },
  { label: "原比例", value: EBackgroundImageType.Contain },
  { label: "裁切", value: EBackgroundImageType.Cover },
];

// 显示时机
export const arrowOption: dictString[] = [
  { label: "总是", value: EArrowOption.Always },
  { label: "悬浮", value: EArrowOption.Hover },
  { label: "从不", value: EArrowOption.Never },
];

// 轮播方向
export const seriesLabelOrient: dictString[] = [
  { label: "水平", value: ESeriesLabelOrient.Horizontal },
  { label: "垂直", value: ESeriesLabelOrient.Vertical },
];

// 尺寸类型
export const objectFit: dictString[] = [
  { label: "无", value: EObjectFit.None },
  { label: "填充", value: EObjectFit.Fill },
  { label: "缩放", value: EObjectFit.ScaleDown },
  { label: "裁切", value: EObjectFit.Cover },
  { label: "保持宽高比", value: EObjectFit.Contain },
];

// 对齐
export const textAlign: dictString[] = [
  { label: "居中", value: ETextAlign.Center },
  { label: "左对齐", value: ETextAlign.Left },
  { label: "右对齐", value: ETextAlign.Right },
];
