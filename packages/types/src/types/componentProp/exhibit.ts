/**
 * 展品组件类型
 * @description 展品类组件的类型标识
 */

/**
 * 展品组件枚举
 * @description 各种展品组件的类型标识
 */
export enum ExhibitEnum {
  /** 3D环形指示器 */
  RingIndicator3d = "ringIndicator3d",
  /** 3D环形指示器新版 */
  ringIndicator3dNew = "ringIndicator3dNew",
  /** 3D图片列表 */
  ImagesList3d = "imagesList3d",
  /** 空间粒子 */
  SwParticles = "sw-particles",
  /** 滤镜组件 */
  SwFilter = "sw-filter",
}

/** @deprecated 使用 ExhibitEnum 代替 */
export type ExhibitEnumType = ExhibitEnum;
