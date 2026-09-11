import type * as THREE from "three";

/**
 * 图片项接口
 */
export interface ImageItem {
  /** 默认图片URL，为 null 时使用灰色材质（非选中状态） */
  defaultImage: string | null;
  /** 激活图片URL，为 null 时使用黄色材质 */
  activeImage: string | null;
  disabled: false;
}

/**
 * 图片网格接口
 */
export interface ImageMesh {
  mesh: THREE.Mesh;
  group: THREE.Group;
  material: THREE.ShaderMaterial;
  defaultTexture: THREE.Texture | null;
  activeTexture: THREE.Texture | null;
  imageSizes: [number, number];
  isActive: boolean;
  index: number;
  imageItem: ImageItem | null; // 存储原始的图片项配置，用于判断是否有配置
}

/**
 * 轮播配置接口
 */
export interface CarouselConfig {
  position: [number, number, number];
  imageSize: [number, number];
  gap: number;
  wheelFactor: number;
  wheelDirection: 1 | -1;
  curveFrequency: number;
  curveStrength: number;
  onImageClick?: (imageMesh: ImageMesh | null, index: number) => void;
}
