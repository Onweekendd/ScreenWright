import { SceneEnum } from "@screenwright/types";

// 从 @screenwright/types 重新导出 sceneEnum，保持本地命名
export { SceneEnum as sceneEnumType };

export const sceneComponentType: SceneEnum[] = [SceneEnum.EchartcommonMap, SceneEnum.EchartGlmap];

// 坐标系统配置信息
export interface CoordinateOptions {
  lon: number;
  lat: number;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  scale: number;
  mapZoom: number;
}
