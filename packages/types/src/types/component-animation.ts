/**
 * 组件动画配置接口
 * @description 定义组件加载时的动画效果
 *
 * @note 这个 Animation 类型用于组件加载动画
 * @note 与 types/animation/index.ts 中的大屏动画类型不同
 */
export interface Animation {
  /** 动画类型 */
  type: string;

  /** 动画方向（可选） */
  direction?: string;

  /** 动画持续时间（毫秒） */
  duration: number;

  /** 动画延迟时间（毫秒） */
  delay: number;

  /** 时间函数/缓动效果 */
  timingFunction: string;

  /** 是否同时做透明度过渡（可选） */
  opacityOpen?: boolean;
}
