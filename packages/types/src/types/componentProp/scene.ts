/**
 * 场景组件类型
 * @description 场景类组件的类型标识
 */

/**
 * 场景组件枚举
 * @description 各种场景组件的类型标识
 */
export enum SceneEnum {
  /** 地图投影 */
  MapProjection = "map-project",
  /** Maptalks地图 */
  Maptalks = "maptalks",
  /** Echart通用地图 */
  EchartcommonMap = "echartcommonMap",
  /** Mars3D地球 */
  Mapmars = "mapmars",
  /** 三维场景 */
  ThreeScene = "threescene",
  /** 工业场景 */
  IndustryScene = "industryscene",
  /** Echart GL地图 */
  EchartGlmap = "echart-glmap"
}

/** @deprecated 使用 SceneEnum 代替 */
export const sceneEnum = SceneEnum;

/** @deprecated 使用 SceneEnum 代替 */
export type sceneEnumType = SceneEnum;
