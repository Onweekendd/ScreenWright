/**
 * 三维组件类型
 * @description 三维类组件的类型标识
 */

/**
 * 三维组件枚举
 * @description 各种三维组件的类型标识
 */
export enum ThreeComponentEnum {
  /** Maptalks地图 */
  MapTalks = "maptalks",
  /** 三维场景 */
  Threescene = "threescene",
  /** 三维场景图标列表 */
  ThreeSceneIconList = "threeSceneIconList",
  /** 三维场景孪生图标列表 */
  ThreeSceneTwinIconList = "threeSceneTwinIconList",
  /** 三维场景孪生面板图标列表 */
  ThreeSceneTwinPanelIconList = "threeSceneTwinPanelIconList",
  /** 工业场景 */
  IndustryScene = "industryscene",
  /** 三维地图标牌子组件 */
  ThreeMapMapGlIcon = "threeMapMapGlIcon",
  /** 三维地图 */
  EchartGlmap = "echart-glmap"
}

/** @deprecated 使用 ThreeComponentEnum 代替 */
export const threeComponentEnum = ThreeComponentEnum;
