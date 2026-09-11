import { ElMessage } from "element-plus";
import Proj4 from "proj4";
import * as THREE from "three";
// @ts-ignore
import { MeshLine, MeshLineMaterial } from "three.meshline";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";

import GeoDataUtils from "../echartcommonMap/geoDataUtils";
import { getPointByProj4 } from "../echartcommonMap/utils";
import { FlowLineManager } from "./FlowLineManager";
import { loadStaticGeoJson } from "./geoJsonRegionProvider";
import { MapBarManager } from "./MapBarManager";
import { MapClusteringHeatManager } from "./MapClusteringHeatManager";
import { MapColorMapManager } from "./MapColorMapManager";
import { MapFenceManager } from "./MapFenceManager";
import { MapGlIconManager, type MapGlIconActiveOptions } from "./MapGlIconManager";
import { MapPathManager } from "./MapPathManager";
import { MapRegionOutlineManager } from "./MapRegionOutlineManager";
import { MapScatterManager } from "./MapScatterManager";
import { cloneMapMaterial } from "./materialEffects";
import { PlaneManager } from "./PlaneManager";
import {
  DEFAULT_WORLD_WRAP_CENTER_LNG,
  isWorldGeoJsonSource,
  rewrapWorldFeatureCollection,
  wrapWorldLongitude
} from "./worldGeoJsonRewrap";

interface geoJsonProps {
  type: string;
  features: any[];
}

interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * 文本样式配置
 */
export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fontStyle?: "normal" | "italic" | "oblique";
  fontWeight?: "normal" | "bold" | "bolder" | "lighter" | number;
}

export interface MapSourceConfig {
  regionId?: string;
  provider?: "china-adcode" | "geojson-file";
  geoJsonUrl?: string;
  allowDrillDown?: boolean;
}

export interface SceneViewVector {
  x: number;
  y: number;
  z: number;
}

export interface SceneViewCamera {
  position: SceneViewVector;
  target: SceneViewVector;
}

export type SceneViewEasing = "linear" | "easeOutCubic";

export interface SceneViewItem {
  name: string;
  duration: number;
  camera: SceneViewCamera;
}

export interface SceneShotItem {
  id: string;
  name: string;
  duration: number;
  camera: SceneViewCamera;
}

export interface SceneStateItem {
  id: string;
  name: string;
  shots: SceneShotItem[];
}

export interface GlMapEditorRuntimeContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  domElement: HTMLElement | null;
  css2dDomElement: HTMLElement | null;
  mapGroup: THREE.Group | null;
  controls: OrbitControls | null;
  mapSize: number;
  baseHeight: number;
}

/**
 * 地图渲染配置属性
 */
export interface startProps {
  /** 区域代码（行政区划代码） */
  adcode: string;
  mapSource?: MapSourceConfig;
  /** 地图填充方式：color(颜色) 或 picture(图片纹理填充) */
  fillType?: "color" | "picture";
  /** 区域颜色（当 fillType 为 color 时使用） */
  areaColor?: string;
  /** 悬停区域颜色（当 fillType 为 color 时使用） */
  activeAreaColor?: string;
  /** 图片URL（当 fillType 为 picture 时使用） */
  picture?: string;
  /** 悬停图片URL（当 fillType 为 picture 时使用） */
  activePicture?: string;
  /** 法线贴图 */
  normalMap?: string;
  /** 法线贴图强度 */
  normalMapIntensity?: number;
  /** 边界宽度（各个区块、省份、市之间的边界宽度） */
  borderWidth?: number;
  /** 边界颜色 */
  borderColor?: string;
  /** 地块颜色 */
  sideGlowColor?: string;
  /**地块泛光系数 */
  sideGlowStrength?: number;
  /** 悬停边界颜色 */
  activeBorderColor?: string;
  /** UV 平铺 X */
  uvScaleX?: number;
  /** UV 平铺 Y */
  uvScaleY?: number;
  /** UV 偏移 X */
  uvOffsetX?: number;
  /** UV 偏移 Y */
  uvOffsetY?: number;
  /** UV 旋转角度 (度) */
  uvRotation?: number;
  /** 是否开启边界流光效果 */
  borderFlow?: boolean;
  /** 文本样式 */
  textStyle?: TextStyle;
  /** 场景控制配置 */
  sceneControl?: {
    /** 相机距离（beta角度） */
    beta?: number;
    /** 地图厚度（3D抬升高度） */
    regionHeight?: number;
    /** 自动旋转 */
    autoRotate?: boolean;
    /** 旋转速度（当 autoRotate 为 true 时，单位：弧度/帧） */
    rotateSpeed?: number;
    /** 旋转方向：1 为顺时针，-1 为逆时针 */
    rotateDirection?: number;
    /** 地图初始旋转角度（度，-360~360，默认：0） */
    initialRotationAngle?: number;
    /** 地图Z轴旋转角度（度，-360~360，默认：0），用于调整地图的朝向，类似箭头指示的角度 */
    mapRotationAngle?: number;
    /** 辉光效果配置 */
    bloom?: {
      enable?: boolean;
      /** 辉光强度 (默认 1.5) */
      strength?: number;
      /** 辉光半径 (默认 0) */
      radius?: number;
      /** 辉光阈值 (默认 0) */
      threshold?: number;
      /** 侧面辉光强度增强系数 (用于 HDR 效果) */
      sideGlowStrength?: number;
    };
    /** 内阴影配置 */
    innerShadow?: {
      enable?: boolean;
      color?: string;
      radius?: number;
      expand?: number;
      resolution?: number;
      opacity?: number;
    };
  };
  /** 背景颜色 */
  backgroundColor?: string | number;
  /** 是否启用雾效 */
  fog?: boolean;
  /** 雾效颜色 */
  fogColor?: string | number;
  /** 相机配置 */
  camera?: {
    /** 相机距离 */
    distance?: number;
    /** 垂直倾斜角（度，-360~360，默认：22，0为水平，90为垂直向下） */
    verticalTiltAngle?: number;
    /** 水平旋转角（度，-360~360，默认：0，0为正前方） */
    horizontalRotationAngle?: number;
  };
  /** 光照配置 */
  light?: {
    ambientIntensity?: number;
    ambientColor?: string | number; // 环境光颜色（默认：太阳光色值 #fff8e1）
    directionalIntensity?: number;
    directionalColor?: string | number; // 方向光颜色（默认：太阳光色值 #fff8e1）
    directionalPosition?: [number, number, number];
  };
  /** 鼠标控制速度配置（外部范围：0-100，内部自动转换为实际值） */
  mouseControl?: {
    /** 滚轮缩放速度（0-100，默认：25，对应内部值0.05） */
    zoomSpeed?: number;
    /** 左键平移速度（0-100，默认：10，对应内部值0.001） */
    panSpeed?: number;
    /** 右键旋转速度（0-100，默认：25，对应内部值0.005） */
    rotateSpeed?: number;
  };
  /** 悬停抬升配置 */
  hoverLift?: {
    /** 悬停时抬升高度（相对于地图尺寸的倍数，默认：0.05，即地图尺寸的5%） */
    height?: number;
    /** 抬升动画时长（毫秒，默认：300） */
    duration?: number;
  };
  /** 默认抬升的区域 adcode，空字符串表示无 */
  defaultLiftAdcode?: string;
  onRegionClick?: (data: {
    /** 区域名称 */
    name: string;
    /** 区域代码 */
    adcode: string;
    /** GeoJSON feature 数据 */
    feature: any;
    /** 点击类型：'left' 左键点击，'right' 右键点击 */
    clickType: "left" | "right";
  }) => void;
  onChildClick?: (data: any) => void;
  /** 预设子组件配置 */
  presetChild?: any[];
}
export class geojsonMapInstance {
  geoUtils: GeoDataUtils;
  geoJson: geoJsonProps;
  scene: THREE.Scene | null = null;
  camera: THREE.PerspectiveCamera | null = null;
  renderer: THREE.WebGLRenderer | null = null;
  mapMeshes: THREE.Mesh[] = [];
  materialCache: Map<string, THREE.Material> = new Map();
  private borderFeatures: any[] | null = null; // 存储当前地图用于轮廓/边界发光的数据
  private outlineMesh: THREE.Group | any = null; // 存储地图轮廓发光线
  private outlineFlowMaterial: any = null; // 流光效果材质
  private flowTime: number = 0; // 动画时间
  private meshBorderMap: Map<THREE.Mesh, THREE.LineSegments> = new Map(); // mesh 到 border 的映射
  private meshOriginalMaterial: Map<THREE.Mesh, THREE.Material[]> = new Map(); // 存储原始材质
  private meshOriginalBorderMaterial: Map<THREE.Mesh, THREE.LineBasicMaterial> = new Map(); // 存储原始边界材质
  private meshTopGlowLineMap: Map<THREE.Mesh, THREE.Group> = new Map(); // mesh 到顶部泛光边界线组映射
  private meshOriginalTopGlowLineMaterials: Map<THREE.Mesh, THREE.Material[]> = new Map(); // 存储顶部泛光边界线原始材质
  private flowLineManager: FlowLineManager | null = null;
  private mapPathManager: MapPathManager | null = null;
  private mapFenceManager: MapFenceManager | null = null;
  private planeManager: PlaneManager | null = null;
  private mapBarManager: MapBarManager | null = null;
  private mapClusteringHeatManager: MapClusteringHeatManager | null = null;
  private mapColorMapManager: MapColorMapManager | null = null;
  private mapScatterManager: MapScatterManager | null = null;
  private mapGlIconManager: MapGlIconManager | null = null;
  private mapRegionOutlineManager: MapRegionOutlineManager | null = null;
  private css3dRenderer: CSS3DRenderer | null = null;
  private css2dRenderer: CSS2DRenderer | null = null;
  private css2dLabelMap: Map<THREE.Mesh, CSS2DObject> = new Map();
  private meshOriginalPosition: Map<THREE.Mesh, THREE.Vector3> = new Map(); // 存储原始位置
  private meshOriginalHeight: Map<THREE.Mesh, number> = new Map(); // 存储原始几何体高度（ExtrudeGeometry 的 depth）
  private meshOriginalGeometry: Map<THREE.Mesh, THREE.BufferGeometry> = new Map(); // 存储原始几何体
  private meshOriginalShapes: Map<THREE.Mesh, THREE.Shape[]> = new Map(); // 存储原始 shapes，用于重新创建几何体
  private meshOriginalGeometryParams: Map<THREE.Mesh, { centerX: number; centerY: number; scale: number }> = new Map(); // 存储创建几何体的参数
  private meshLiftAnimation: Map<THREE.Mesh, number> = new Map(); // 存储抬升动画的 requestAnimationFrame ID
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private hoveredMesh: THREE.Mesh | null = null; // 当前悬停的 mesh
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private currentProps: startProps = {
    adcode: "100000",
    fillType: "color"
  }; // 存储当前配置
  private mapSize: number = 0; // 地图尺寸，用于计算抬升高度
  private currentAdcode: string = ""; // 存储当前 adcode，用于判断是否需要重新获取 GeoJSON
  private onRegionClickCallback?: startProps["onRegionClick"]; // 区域点击回调函数
  private onChildClickCallback?: startProps["onChildClick"]; // 子组件点击回调函数
  private animationId: number | null = null;
  private autoRotateEnabled: boolean = false;
  private rotateSpeed: number = 0.01;
  private rotateDirection: number = 1; // 1: 顺时针, -1: 逆时针
  private mapGroup: THREE.Group | null = null;
  private controls: OrbitControls | null = null;
  private mapCenter: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  // 自定义鼠标控制
  private isDragging: boolean = false;
  private isRotating: boolean = false; // 右键旋转
  private isPanning: boolean = false; // 左键平移
  private isOverMap: boolean = false; // 鼠标是否在地图区域内
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private spherical: { radius: number; phi: number; theta: number } = { radius: 5, phi: Math.PI / 3, theta: 0 };
  private target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private domElement: HTMLElement | null = null;
  private mouseInteractionEnabled = true;
  private navigationEnabled = true;
  private editorNavigationMode = false;
  private uvReferenceBounds: MapBounds | null = null;
  private textureReferenceBounds: MapBounds | null = null;
  private textureReferenceKey = "";
  private textureReferenceSourceKey = "";
  private textureReferenceAdcode = "";
  private textureReferenceProvider: MapSourceConfig["provider"] | "" = "";
  private textureReferenceUsesWorldWrap = false;
  private textureReferenceIsGlobalWorld = false;
  private uvOffset: THREE.Vector2 = new THREE.Vector2(0, 0);
  private uvScale: THREE.Vector2 = new THREE.Vector2(1, 1);
  private currentProjectionParams: { centerX: number; centerY: number; scale: number } | null = null;
  private finalRegionHeight: number = 0; // 记录最终计算出的厚度
  private innerShadowUVTransform: { offset: THREE.Vector2; scale: THREE.Vector2 } = {
    offset: new THREE.Vector2(0, 0),
    scale: new THREE.Vector2(1, 1)
  };
  private focusedMesh: THREE.Mesh | null = null; // 当前聚焦的地块
  private clickTimer: any = null; //用于区分单击和双击
  private cameraAnimationId: number | null = null; // 相机动画ID
  private cameraAnimationToken = 0;
  private cameraAnimationResolve: (() => void) | null = null;
  private viewChangeListeners: Set<(view: SceneViewCamera) => void> = new Set();
  private handleOrbitControlsChange = () => {
    if (this.controls) {
      this.target.copy(this.controls.target);
    }
    this.syncSphericalFromCamera();
    this.emitViewChange();
  };

  constructor() {
    this.geoJson = {
      type: "FeatureCollection",
      features: []
    };
    this.geoUtils = new GeoDataUtils().init();
    // (window as any).app = this;
  }

  private vectorToSceneView(vector: THREE.Vector3): SceneViewVector {
    return {
      x: vector.x,
      y: vector.y,
      z: vector.z
    };
  }

  private buildCurrentView(): SceneViewCamera {
    const position = this.camera ? this.vectorToSceneView(this.camera.position) : { x: 0, y: 0, z: 0 };
    const target = this.controls ? this.vectorToSceneView(this.controls.target) : this.vectorToSceneView(this.target);

    return {
      position,
      target
    };
  }

  private syncSphericalFromCamera(): void {
    if (!this.camera) return;

    const currentTarget = this.controls ? this.controls.target : this.target;
    const offset = new THREE.Vector3().subVectors(this.camera.position, currentTarget);
    const radius = Math.max(offset.length(), 0.0001);

    this.target.copy(currentTarget);
    this.spherical.radius = radius;
    this.spherical.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));
    this.spherical.theta = Math.atan2(offset.x, offset.z);
  }

  private emitViewChange(): void {
    const currentView = this.buildCurrentView();
    this.viewChangeListeners.forEach((listener) => listener(currentView));
  }

  public getCurrentView(): SceneViewCamera {
    return this.buildCurrentView();
  }

  private applyView(view: SceneViewCamera): void {
    if (!this.camera) return;

    const nextPosition = new THREE.Vector3(view.position.x, view.position.y, view.position.z);
    const nextTarget = new THREE.Vector3(view.target.x, view.target.y, view.target.z);

    this.camera.position.copy(nextPosition);
    this.target.copy(nextTarget);

    if (this.controls) {
      this.controls.target.copy(nextTarget);
      this.controls.update();
    } else {
      this.camera.lookAt(nextTarget);
    }

    this.syncSphericalFromCamera();
    this.emitViewChange();
  }

  public stopViewAnimation(): void {
    this.cameraAnimationToken += 1;

    if (this.cameraAnimationId) {
      cancelAnimationFrame(this.cameraAnimationId);
      this.cameraAnimationId = null;
    }

    if (this.cameraAnimationResolve) {
      const resolve = this.cameraAnimationResolve;
      this.cameraAnimationResolve = null;
      resolve();
    }
  }

  public setView(view: SceneViewCamera): void {
    this.stopViewAnimation();
    this.applyView(view);
  }

  public async viewToAsync(
    view: SceneViewCamera,
    duration = 1000,
    easing: SceneViewEasing = "easeOutCubic"
  ): Promise<void> {
    if (!this.camera) return;

    if (duration <= 0) {
      this.setView(view);
      return;
    }

    const startPosition = this.camera.position.clone();
    const startTarget = this.controls ? this.controls.target.clone() : this.target.clone();
    const endPosition = new THREE.Vector3(view.position.x, view.position.y, view.position.z);
    const endTarget = new THREE.Vector3(view.target.x, view.target.y, view.target.z);
    const startedAt = performance.now();
    this.stopViewAnimation();

    const animationToken = ++this.cameraAnimationToken;

    await new Promise<void>((resolve) => {
      this.cameraAnimationResolve = resolve;

      const finish = () => {
        if (this.cameraAnimationToken !== animationToken) {
          return;
        }

        this.cameraAnimationId = null;
        this.cameraAnimationResolve = null;
        this.applyView(view);
        resolve();
      };

      const animate = (timestamp: number) => {
        if (this.cameraAnimationToken !== animationToken || !this.camera) {
          return;
        }

        const progress = Math.min((timestamp - startedAt) / duration, 1);
        const eased = easing === "linear" ? progress : 1 - Math.pow(1 - progress, 3);
        const currentTarget = new THREE.Vector3().lerpVectors(startTarget, endTarget, eased);

        this.camera.position.lerpVectors(startPosition, endPosition, eased);
        this.target.copy(currentTarget);

        if (this.controls) {
          this.controls.target.copy(currentTarget);
          this.controls.update();
        } else {
          this.camera.lookAt(currentTarget);
          this.syncSphericalFromCamera();
          this.emitViewChange();
        }

        if (progress < 1) {
          this.cameraAnimationId = requestAnimationFrame(animate);
        } else {
          finish();
        }
      };

      this.cameraAnimationId = requestAnimationFrame(animate);
    });
  }

  public viewTo(view: SceneViewCamera, duration = 1000, easing: SceneViewEasing = "easeOutCubic"): void {
    void this.viewToAsync(view, duration, easing);
  }

  public onViewChange(listener: (view: SceneViewCamera) => void): () => void {
    this.viewChangeListeners.add(listener);
    return () => {
      this.viewChangeListeners.delete(listener);
    };
  }

  public offViewChange(listener: (view: SceneViewCamera) => void): void {
    this.viewChangeListeners.delete(listener);
  }

  public getEditorRuntimeContext(): GlMapEditorRuntimeContext | null {
    if (!this.scene || !this.camera || !this.renderer) {
      return null;
    }

    return {
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      domElement: this.domElement,
      css2dDomElement: this.css2dRenderer?.domElement || null,
      mapGroup: this.mapGroup,
      controls: this.controls,
      mapSize: this.mapSize,
      baseHeight: this.getMapBaseHeight()
    };
  }

  public getMapBaseHeight(): number {
    return this.finalRegionHeight * 0.01;
  }

  public setMouseInteractionEnabled(enabled: boolean): void {
    this.mouseInteractionEnabled = enabled;
    if (!enabled) {
      this.isOverMap = false;
      this.onMeshLeave(this.hoveredMesh);
      this.hoveredMesh = null;
    }
  }

  public setNavigationEnabled(enabled: boolean): void {
    this.navigationEnabled = enabled;

    if (this.controls) {
      this.controls.enabled = enabled;
    }
  }

  public setEditorNavigationMode(enabled: boolean): void {
    this.editorNavigationMode = enabled;

    if (this.controls?.mouseButtons) {
      (this.controls.mouseButtons as any).LEFT = enabled ? -1 : THREE.MOUSE.PAN;
      this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
      this.controls.mouseButtons.MIDDLE = enabled ? THREE.MOUSE.PAN : THREE.MOUSE.DOLLY;
    }
  }

  public lngLatToMapLocalPosition(point: [number, number], zOffset = 0): THREE.Vector3 | null {
    if (!this.currentProjectionParams) {
      return null;
    }

    const projected = this.projectGeoPoint(point);
    if (!projected) {
      return null;
    }

    const [x, y] = projected;

    return new THREE.Vector3(
      (x - this.currentProjectionParams.centerX) * this.currentProjectionParams.scale,
      (y - this.currentProjectionParams.centerY) * this.currentProjectionParams.scale,
      this.getMapBaseHeight() + zOffset
    );
  }

  public mapLocalPositionToLngLat(position: THREE.Vector3): [number, number] | null {
    if (!this.currentProjectionParams) {
      return null;
    }

    const projX = position.x / this.currentProjectionParams.scale + this.currentProjectionParams.centerX;
    const projY = position.y / this.currentProjectionParams.scale + this.currentProjectionParams.centerY;
    const lngLat = this.shouldUseWrappedWorldProjection()
      ? this.unprojectWorldMercatorPoint(projX, projY)
      : Proj4("EPSG:3857", "EPSG:4326", [projX, projY]);
    const lng = Number(lngLat?.[0]);
    const lat = Number(lngLat?.[1]);

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return null;
    }

    return [lng, lat];
  }

  public pickMapLocalPositionFromClient(clientX: number, clientY: number): THREE.Vector3 | null {
    if (!this.renderer || !this.camera) {
      return null;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.mapMeshes, false);
    if (intersects.length > 0) {
      const point = intersects[0].point.clone();
      const localPoint = this.mapGroup ? this.mapGroup.worldToLocal(point) : point;
      localPoint.z = this.getMapBaseHeight();
      return localPoint;
    }

    const planeAnchor = this.mapGroup
      ? this.mapGroup.localToWorld(new THREE.Vector3(0, 0, this.getMapBaseHeight()))
      : new THREE.Vector3(0, 0, this.getMapBaseHeight());
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeAnchor.z);
    const hitPoint = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, hitPoint)) {
      return null;
    }

    const localPoint = this.mapGroup ? this.mapGroup.worldToLocal(hitPoint) : hitPoint;
    localPoint.z = this.getMapBaseHeight();
    return localPoint;
  }
  getGeoJson() {
    return this.geoJson;
  }
  getRegionByName(regionName: string) {
    const adcode = this.geoJson.features.find((item) => item.properties.name === regionName)?.properties.adcode;
    if (adcode) {
      /**
       * @type {Region}
       */
      const region = {
        name: regionName,
        adcode: adcode + ""
      };
      return region;
    }
    return null;
  }

  private getMapSourceKey(props: startProps) {
    const provider = props.mapSource?.provider || "china-adcode";
    const geoJsonUrl = props.mapSource?.geoJsonUrl || "";
    return `${provider}:${geoJsonUrl}:${props.adcode || ""}`;
  }

  private getPartialMapSourceKey(props: Partial<startProps> = this.currentProps) {
    const provider = props.mapSource?.provider || this.currentProps.mapSource?.provider || "china-adcode";
    const geoJsonUrl = props.mapSource?.geoJsonUrl || this.currentProps.mapSource?.geoJsonUrl || "";
    const adcode = props.adcode || this.currentProps.adcode || "";
    return `${provider}:${geoJsonUrl}:${adcode}`;
  }

  private cloneBounds(bounds: MapBounds | null): MapBounds | null {
    return bounds ? { ...bounds } : null;
  }

  private isWorldMapSource(mapSource: MapSourceConfig | undefined = this.currentProps.mapSource) {
    return isWorldGeoJsonSource(mapSource);
  }

  private isWorldCatalogSource(mapSource: MapSourceConfig | undefined = this.currentProps.mapSource) {
    const regionId = String(mapSource?.regionId || "").toLowerCase();
    const geoJsonUrl = String(mapSource?.geoJsonUrl || "");

    return (
      this.isWorldMapSource(mapSource) ||
      regionId.startsWith("country:") ||
      /(^|\/)geo-world\/.+\.json(?:[?#].*)?$/i.test(geoJsonUrl)
    );
  }

  private getTextureReferenceKey(props: Partial<startProps> = this.currentProps) {
    const fillType = props.fillType ?? this.currentProps.fillType;
    const picture = props.picture ?? this.currentProps.picture;
    const activePicture = props.activePicture ?? this.currentProps.activePicture;

    if (fillType !== "picture" || !picture) {
      return "";
    }

    return `${picture}__${activePicture || ""}`;
  }

  private shouldUseWrappedWorldProjection(mapSource: MapSourceConfig | undefined = this.currentProps.mapSource) {
    return (
      this.isWorldCatalogSource(mapSource) ||
      (this.textureReferenceUsesWorldWrap &&
        this.textureReferenceKey !== "" &&
        this.textureReferenceKey === this.getTextureReferenceKey())
    );
  }

  private isChinaAdcodeDescendant(ancestorAdcode: string, currentAdcode: string) {
    if (!ancestorAdcode || !currentAdcode) {
      return false;
    }

    if (ancestorAdcode === currentAdcode) {
      return true;
    }

    if (ancestorAdcode === "100000") {
      return /^\d+$/.test(currentAdcode);
    }

    const normalizedAncestor = ancestorAdcode.replace(/0+$/, "");
    return normalizedAncestor.length > 0 && currentAdcode.startsWith(normalizedAncestor);
  }

  private canReuseTextureReference(props: Partial<startProps>, nextTextureKey: string) {
    if (!nextTextureKey || !this.textureReferenceBounds || this.textureReferenceKey !== nextTextureKey) {
      return false;
    }

    if (this.textureReferenceIsGlobalWorld) {
      return true;
    }

    const nextSourceKey = this.getPartialMapSourceKey(props);
    if (nextSourceKey === this.textureReferenceSourceKey) {
      return true;
    }

    const nextProvider = props.mapSource?.provider || this.currentProps.mapSource?.provider || "";
    const nextAdcode = String(props.adcode ?? this.currentProps.adcode ?? "");
    if (this.textureReferenceProvider === "china-adcode" && nextProvider === "china-adcode") {
      return this.isChinaAdcodeDescendant(this.textureReferenceAdcode, nextAdcode);
    }

    return false;
  }

  private syncUVReferenceBounds(bounds: MapBounds, props: Partial<startProps> = this.currentProps): void {
    const nextTextureKey = this.getTextureReferenceKey(props);

    if (!nextTextureKey) {
      this.textureReferenceBounds = null;
      this.textureReferenceKey = "";
      this.textureReferenceSourceKey = "";
      this.textureReferenceAdcode = "";
      this.textureReferenceProvider = "";
      this.textureReferenceUsesWorldWrap = false;
      this.textureReferenceIsGlobalWorld = false;
      this.uvReferenceBounds = this.cloneBounds(bounds);
      return;
    }

    if (!this.canReuseTextureReference(props, nextTextureKey)) {
      const nextMapSource = props.mapSource || this.currentProps.mapSource;

      this.textureReferenceBounds = this.cloneBounds(bounds);
      this.textureReferenceKey = nextTextureKey;
      this.textureReferenceSourceKey = this.getPartialMapSourceKey(props);
      this.textureReferenceAdcode = String(props.adcode ?? this.currentProps.adcode ?? "");
      this.textureReferenceProvider = nextMapSource?.provider || "";
      this.textureReferenceUsesWorldWrap = this.isWorldCatalogSource(nextMapSource);
      this.textureReferenceIsGlobalWorld = this.isWorldMapSource(nextMapSource);
    }

    this.uvReferenceBounds = this.cloneBounds(this.textureReferenceBounds || bounds);
  }

  private syncCurrentProps(props: Partial<startProps>): void {
    this.currentProps = {
      ...this.currentProps,
      ...props
    };
  }

  private projectWorldMercatorPoint(lng: number, lat: number): [number, number] {
    const wrappedLng = wrapWorldLongitude(lng, DEFAULT_WORLD_WRAP_CENTER_LNG);
    const clampedLat = Math.max(-85.0511287798, Math.min(85.0511287798, lat));
    const x = (wrappedLng * 20037508.342789244) / 180;
    let y = Math.log(Math.tan(((90 + clampedLat) * Math.PI) / 360)) / (Math.PI / 180);
    y = (y * 20037508.342789244) / 180;
    return [x, y];
  }

  private unprojectWorldMercatorPoint(x: number, y: number): [number, number] {
    let lng = (x / 20037508.342789244) * 180;
    let lat = (y / 20037508.342789244) * 180;
    lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
    lng = ((lng + 180) % 360 + 360) % 360 - 180;
    return [lng, lat];
  }

  private async loadGeoJsonBySource(props: startProps) {
    const provider = props.mapSource?.provider || "china-adcode";

    if (provider === "geojson-file" && props.mapSource?.geoJsonUrl) {
      const geoJsonResponse = await loadStaticGeoJson(props.mapSource.geoJsonUrl);
      const normalizedGeoJson = this.isWorldCatalogSource(props.mapSource)
        ? rewrapWorldFeatureCollection(geoJsonResponse)
        : geoJsonResponse;
      this.transformGeoFeatures(normalizedGeoJson);
      // 对世界/国家静态 GeoJSON，直接复用 Feature 集合来绘制边界发光线
      this.borderFeatures = normalizedGeoJson.features || null;
      return;
    }

    await this.getGeoJsonFromAdCode(props.adcode);
    const borderData = (window as any).geoData_border?.[props.adcode];
    this.borderFeatures = borderData?.features || null;
  }

  async getGeoJsonFromAdCode(adcode: string) {
    const geoJsonResponse = await this.getGeoJsonFromAdcodeApi(adcode);
    this.transformGeoFeatures(geoJsonResponse);
    // 同时加载该区划的边界数据（不含下级），供边界发光线使用
    try {
      await this.geoUtils.loadBorderData(adcode);
    } catch (e) {
      console.warn("加载边界数据失败:", e);
    }
  }
  transformGeoFeatures(geoJsonResponse: any) {
    this.geoJson.features = geoJsonResponse.features;
  }
  async getGeoJsonFromAdcodeApi(adcode: string) {
    const response = await this.geoUtils.getGeoData(adcode);
    console.log(response, "response");
    if (!response) {
      ElMessage.error("获取行政区划数据失败");
      throw new Error("Network response was not ok");
    }
    return response.fullData;
  }
  /**
   * 从 feature.properties 中获取区域名称
   * 根据地图层级自动选择正确的名称字段
   */
  private getRegionName(feature: any): string {
    const props = feature.properties || {};
    return props.name || "";
  }

  private projectGeoPoint(point: any): [number, number] | null {
    if (!Array.isArray(point) || point.length < 2) {
      return null;
    }

    const lng = Number(point[0]);
    const lat = Number(point[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return null;
    }

    const projectedPoint = this.shouldUseWrappedWorldProjection()
      ? this.projectWorldMercatorPoint(lng, lat)
      : getPointByProj4([lng, lat]);
    const x = Number(projectedPoint?.[0]);
    const y = Number(projectedPoint?.[1]);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return [x, y];
  }

  private projectGeoPointToLocal(point: any, centerX: number, centerY: number, scale: number): THREE.Vector2 | null {
    const projectedPoint = this.projectGeoPoint(point);
    if (!projectedPoint) {
      return null;
    }

    const [x, y] = projectedPoint;
    return new THREE.Vector2((x - centerX) * scale, (y - centerY) * scale);
  }

  private clearOutlineMesh(): void {
    if (!this.outlineMesh) {
      return;
    }

    if (this.scene) {
      this.scene.remove(this.outlineMesh);
    }

    this.outlineMesh.traverse((obj: any) => {
      if (obj.geometry) {
        obj.geometry.dispose();
      }

      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((material: THREE.Material) => material.dispose());
      }
    });

    this.outlineMesh = null;
    this.outlineFlowMaterial = null;
  }

  /**
   * 从 GeoJSON 创建地图几何体
   * @param regionHeight 区域高度（3D 抬升高度）
   * @param initialRotationAngle 初始旋转角度（度，-360~360）
   * @param textStyle 文字样式配置
   * @returns THREE.Group 包含所有地图区域的组
   */
  async createMapGeometry(
    regionHeight: number = 10,
    initialRotationAngle: number = 0,
    textStyle?: TextStyle
  ): Promise<THREE.Group> {
    const mapGroup = new THREE.Group();
    mapGroup.name = "mapGroup";
    const bounds = this.calculateBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const scale = this.calculateScale(bounds);
    this.currentProjectionParams = { centerX, centerY, scale };

    // 初始化地理边界，用于自适应 UV 计算
    // this.globalGeographicBounds = bounds;
    this.syncUVReferenceBounds(bounds);

    this.mapCenter = {
      x: 0,
      y: (regionHeight / 2) * 0.01,
      z: 0
    };

    this.geoJson.features.forEach((feature: any) => {
      if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
        const result = this.createRegionMesh(feature, centerX, centerY, scale, regionHeight * 0.01);
        if (result.mesh && result.shapes) {
          mapGroup.add(result.mesh);
          this.mapMeshes.push(result.mesh);
          this.meshOriginalPosition.set(result.mesh, result.mesh.position.clone());
          if (result.mesh.userData.originalHeight !== undefined) {
            this.meshOriginalHeight.set(result.mesh, result.mesh.userData.originalHeight);
          }
          if (result.mesh.geometry) {
            this.meshOriginalGeometry.set(result.mesh, result.mesh.geometry.clone());
          }
          this.meshOriginalShapes.set(result.mesh, result.shapes);
          this.meshOriginalGeometryParams.set(result.mesh, { centerX, centerY, scale });
        }
      }
    });

    // 清理旧的外轮廓
    this.clearOutlineMesh();

    const initialRotationRad = (initialRotationAngle * Math.PI) / 180;
    mapGroup.rotation.y = Math.PI + initialRotationRad;
    // 尝试为当前地图创建边界发光线
    const outline = this.createOutline(centerX, centerY, scale, regionHeight * 0.01, this.currentProps.borderFlow);
    if (outline && this.scene) {
      this.scene.add(outline);
      this.outlineMesh = outline;
    }

    if (textStyle && textStyle.fontSize !== 0) {
      this.addTextLabels(mapGroup, textStyle, regionHeight * 0.01);
    }

    return mapGroup;
  }
  /**
   * 创建单个区域的网格和标签
   * @returns 包含 mesh 和 label 的对象
   */
  private createRegionMesh(
    feature: any,
    centerX: number,
    centerY: number,
    scale: number,
    height: number
    // textStyle?: TextStyle
  ): { mesh: THREE.Mesh | null; label: THREE.Sprite | null; shapes: THREE.Shape[]; line: THREE.Object3D | null } {
    try {
      const coordinates = feature.geometry.coordinates;
      const shapes: THREE.Shape[] = [];
      const polygons = feature.geometry.type === "Polygon" ? [coordinates] : coordinates;
      // console.log(polygons, "polygons");
      polygons.forEach((polygon: any) => {
        const shape = new THREE.Shape();
        const ring = polygon[0];
        if (ring && ring.length > 0) {
          const points = ring
            .map((point: number[]) => this.projectGeoPointToLocal(point, centerX, centerY, scale))
            .filter((point: THREE.Vector2 | null): point is THREE.Vector2 => Boolean(point));
          if (points.length >= 3) {
            shape.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
              shape.lineTo(points[i].x, points[i].y);
            }
            shape.lineTo(points[0].x, points[0].y);
            for (let i = 1; i < polygon.length; i++) {
              const hole = polygon[i];
              const holePoints = hole
                .map((point: number[]) => this.projectGeoPointToLocal(point, centerX, centerY, scale))
                .filter((point: THREE.Vector2 | null): point is THREE.Vector2 => Boolean(point));
              if (holePoints.length < 3) {
                continue;
              }
              const holeShape = new THREE.Path();
              holeShape.moveTo(holePoints[0].x, holePoints[0].y);
              for (let j = 1; j < holePoints.length; j++) {
                holeShape.lineTo(holePoints[j].x, holePoints[j].y);
              }
              shape.holes.push(holeShape);
            }
            shapes.push(shape);
          }
        }
      });
      if (shapes.length === 0) return { mesh: null, label: null, shapes: [], line: null };

      const extrudeSettings = {
        depth: height,
        bevelEnabled: false
      };
      const geometries = shapes.map((shape) => new THREE.ExtrudeGeometry(shape, extrudeSettings));
      const mergedGeometry = this.mergeGeometries(geometries, centerX, centerY, scale);

      const mesh = new THREE.Mesh(mergedGeometry);
      // 存储创建几何体时的原始参数，用于后续 UV 变换或几何重构
      this.meshOriginalGeometryParams.set(mesh, { centerX, centerY, scale });
      const regionName = this.getRegionName(feature);

      mesh.userData = {
        name: regionName,
        adcode: feature.properties?.adcode || feature.properties?.ADCODE || feature.properties?.id || feature.properties?.ID || "",
        feature: feature,
        originalHeight: height,
        isRegion: true
      };

      // 创建顶部泛光边界线
      const lineGroup = new THREE.Group();
      shapes.forEach((shape) => {
        // 处理主轮廓和孔洞
        const allPaths = [shape, ...shape.holes];
        allPaths.forEach((path) => {
          const points = path.getPoints();
          if (points.length === 0) return;

          const meshLine = new MeshLine();
          // 核心修复：MeshLine.setPoints() 在处理 Array<Vector2> 时，如果 Vector2 没有 z 属性会导致 NaN
          // 因此我们将其展开为平坦的数字数组 [x, y, 0, ...]
          const positions: number[] = [];
          for (let i = 0; i < points.length; i++) {
            positions.push(points[i].x, points[i].y, 0);
          }
          meshLine.setPoints(positions);
          const finalWidth = (this.currentProps.borderWidth || 1) * 0.0005;
          const lineMaterial = new MeshLineMaterial({
            color: new THREE.Color(0x5ba3f5), // 科技蓝
            lineWidth: finalWidth,
            transparent: true,
            opacity: 0.3,
            sizeAttenuation: 1,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending
          });
          (lineMaterial as any).toneMapped = false;

          const line = new THREE.Mesh(meshLine.geometry, lineMaterial);
          line.renderOrder = 1;
          lineGroup.add(line);
        });
      });
      lineGroup.position.z = height + 0.001;
      mesh.add(lineGroup);
      this.meshTopGlowLineMap.set(mesh, lineGroup);
      this.meshOriginalTopGlowLineMaterials.set(
        mesh,
        lineGroup.children.map((obj: THREE.Object3D) => (obj as any).material)
      );

      return { mesh, label: null, shapes, line: null };
    } catch (error) {
      console.error("创建区域网格失败:", error, feature);
      return { mesh: null, label: null, shapes: [], line: null };
    }
  }
  /**
   * 合并多个几何体并计算自适应 UV
   */
  private mergeGeometries(
    geometries: THREE.BufferGeometry[],
    centerX: number,
    centerY: number,
    scale: number
  ): THREE.BufferGeometry {
    let mergedGeometry: THREE.BufferGeometry;

    if (geometries.length === 1) {
      mergedGeometry = geometries[0];
    } else {
      const mergedGeometries = geometries.map((geo) => {
        const merged = new THREE.BufferGeometry();
        // 克隆几何体以避免修改原始引用
        merged.copy(geo);
        // CRITICAL: copy() 不会复制 groups，必须手动复制
        if (geo.groups && geo.groups.length > 0) {
          geo.groups.forEach((g: { start: number; count: number; materialIndex?: number }) => {
            merged.addGroup(g.start, g.count, g.materialIndex);
          });
        }
        return merged;
      });
      mergedGeometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
      const allIndices: number[] = [];
      const groups: { start: number; count: number; materialIndex?: number }[] = [];

      let vertexOffset = 0;
      let indexOffset = 0;

      mergedGeometries.forEach((geo) => {
        const pos = geo.attributes.position;
        const norm = geo.attributes.normal;
        const uv = geo.attributes.uv;
        const index = geo.index;

        // 复制 attributes
        if (pos) {
          for (let i = 0; i < pos.count; i++) {
            positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
            if (norm) normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
            if (uv) uvs.push(uv.getX(i), uv.getY(i));
          }
        }

        // 核心修复：处理非索引几何体的 groups
        const currentCount = index ? index.count : pos ? pos.count : 0;
        const currentStartOffset = index ? indexOffset : vertexOffset;

        if (index) {
          for (let i = 0; i < currentCount; i++) {
            allIndices.push(index.getX(i) + vertexOffset);
          }
        }

        // 处理当前几何体的 groups
        if (geo.groups && geo.groups.length > 0) {
          geo.groups.forEach((g: { start: number; count: number; materialIndex?: number }) => {
            groups.push({
              start: currentStartOffset + g.start,
              count: g.count,
              materialIndex: g.materialIndex
            });
          });
        } else {
          // 兜底：如果没有 groups，默认为全覆盖
          groups.push({
            start: currentStartOffset,
            count: currentCount,
            materialIndex: 0
          });
        }

        if (index) indexOffset += currentCount;
        if (pos) vertexOffset += pos.count;
      });

      mergedGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      if (normals.length > 0) mergedGeometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      if (uvs.length > 0) mergedGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      if (allIndices.length > 0) mergedGeometry.setIndex(allIndices);

      // 应用合并后的 groups
      groups.forEach((g: { start: number; count: number; materialIndex?: number }) => {
        mergedGeometry.addGroup(g.start, g.count, g.materialIndex);
      });
    }

    const posAttr = mergedGeometry.attributes.position;

    if (posAttr && this.uvReferenceBounds) {
      // ... existing implementation ...
      const { minX: refMinX, maxX: refMaxX, minY: refMinY, maxY: refMaxY } = this.uvReferenceBounds;
      const refWidth = refMaxX - refMinX || 1;
      const refHeight = refMaxY - refMinY || 1;

      const uvs = new Float32Array(posAttr.count * 2);

      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);

        const projX = x / scale + centerX;
        const projY = y / scale + centerY;

        let u = (projX - refMinX) / refWidth;
        let v = (projY - refMinY) / refHeight;

        u = u * this.uvScale.x + this.uvOffset.x;
        v = v * this.uvScale.y + this.uvOffset.y;

        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
      }
      mergedGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    } else if (posAttr) {
      // fallback
      const uvs = new Float32Array(posAttr.count * 2);
      for (let i = 0; i < posAttr.count; i++) {
        uvs[i * 2] = 0.5 + posAttr.getX(i);
        uvs[i * 2 + 1] = 0.5 + posAttr.getY(i);
      }
      mergedGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    }

    return mergedGeometry;
  }

  /**
   * 创建地图边界发光线
   */
  private createOutline(
    centerX: number,
    centerY: number,
    scale: number,
    height: number,
    isFlow: boolean = false
  ): THREE.Group | null {
    if (!this.borderFeatures?.length) {
      return null;
    }
    const features = this.borderFeatures || [];
    const outlineGroup = new THREE.Group();
    outlineGroup.name = "borderLine";
    const finalWidth = (this.currentProps.borderWidth || 1.6) * 0.001;
    let mat: any;
    if (isFlow) {
      mat = this.createFlowingLineMaterial(finalWidth * 2);
    } else {
      mat = new MeshLineMaterial({
        color: new THREE.Color(this.currentProps.borderColor || "#00ffff"),
        lineWidth: finalWidth,
        transparent: true,
        opacity: 1.0,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        sizeAttenuation: 1
      });
    }

    features.forEach((feature: any) => {
      const type = feature.geometry.type;
      const coordinates = feature.geometry.coordinates;
      const polygons = type === "Polygon" ? [coordinates] : coordinates;

      polygons.forEach((polygon: any) => {
        const ring = polygon[0];
        if (!ring || ring.length === 0) return;

        const positions: number[] = [];
        ring.forEach((point: number[]) => {
          const projectedPoint = this.projectGeoPoint(point);
          if (!projectedPoint) {
            return;
          }
          const [x, y] = projectedPoint;
          positions.push((x - centerX) * -scale, (y - centerY) * scale, -(height + 0.005));
        });

        if (positions.length < 6) {
          return;
        }

        const line = new MeshLine();
        line.setPoints(positions);

        const mesh = new THREE.Mesh(line.geometry, mat);
        mesh.renderOrder = 1;
        outlineGroup.add(mesh);
      });
    });

    if (outlineGroup.children.length === 0) {
      const materials = Array.isArray(mat) ? mat : [mat];
      materials.forEach((material: THREE.Material) => material.dispose());
      return null;
    }

    this.outlineFlowMaterial = mat;
    outlineGroup.layers.set(0);
    outlineGroup.renderOrder = 1;
    return outlineGroup;
  }
  private createFlowingLineMaterial(width: number = 0.002): any {
    // 1. 创建基础 MeshLineMaterial，利用虚虚线（Dash）属性实现流动感
    const mat = new MeshLineMaterial({
      color: new THREE.Color(this.currentProps.borderColor || "#00ffff"),
      lineWidth: width, // 动态线宽
      transparent: true,
      opacity: 0.9,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      sizeAttenuation: 1,
      blending: THREE.AdditiveBlending,
      dashArray: 0.08, // 虚线周期长度
      dashRatio: 0.4, // 虚线占空比，实现亮段与暗段
      dashOffset: 0,
      useMap: false
    });

    (mat as any)._isFlow = true; // 标记为流光材质

    return mat;
  }

  /**
   * 设置 UV 参考地理范围（用于将局部省份地图映射到全局中国地图贴图）
   */
  public setUVReferenceBounds(bounds: MapBounds | null): void {
    this.uvReferenceBounds = this.cloneBounds(bounds);
    this.textureReferenceBounds = this.cloneBounds(bounds);

    if (bounds) {
      this.textureReferenceKey = this.getTextureReferenceKey();
      this.textureReferenceSourceKey = this.getPartialMapSourceKey();
      this.textureReferenceAdcode = String(this.currentProps.adcode || "");
      this.textureReferenceProvider = this.currentProps.mapSource?.provider || "";
      this.textureReferenceUsesWorldWrap = this.isWorldCatalogSource(this.currentProps.mapSource);
      this.textureReferenceIsGlobalWorld = this.isWorldMapSource(this.currentProps.mapSource);
    } else {
      this.textureReferenceKey = "";
      this.textureReferenceSourceKey = "";
      this.textureReferenceAdcode = "";
      this.textureReferenceProvider = "";
      this.textureReferenceUsesWorldWrap = false;
      this.textureReferenceIsGlobalWorld = false;
    }

    this.updateAllUVs();
  }

  /**
   * 创建/更新飞线
   * @param data 飞线数据 [{from: [lng, lat], to: [lng, lat], ...}]
   * @param option 飞线配置
   */
  public createFlowLines(id: string, data: any[], option: any): void {
    if (!this.scene) return;

    if (!this.flowLineManager) {
      this.flowLineManager = new FlowLineManager(this.scene);
    }

    const bounds = this.calculateBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const maxSize = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const scale = maxSize > 0 ? 1 / maxSize : 1;
    const baseHeight = (this.currentProps.sceneControl?.regionHeight || 0) * 0.01;

    this.flowLineManager.update(id, data, option, {
      centerX,
      centerY,
      scale,
      baseHeight,
      mapSize: this.mapSize,
      mapGroup: this.mapGroup
    });
  }

  public createMapPath(id: string, data: any[], option: any): void {
    if (!this.scene) return;

    if (!this.mapPathManager) {
      this.mapPathManager = new MapPathManager(this.scene);
    }

    const bounds = this.calculateBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const maxSize = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const scale = maxSize > 0 ? 1 / maxSize : 1;
    const baseHeight = this.finalRegionHeight * 0.01;

    this.mapPathManager.update(id, data, option, {
      centerX,
      centerY,
      scale,
      baseHeight,
      mapSize: this.mapSize,
      mapGroup: this.mapGroup
    });
  }

  public createFence(id: string, data: any[], option: any): void {
    if (!this.scene) return;

    if (!this.mapFenceManager) {
      this.mapFenceManager = new MapFenceManager(this.scene);
    }

    const bounds = this.calculateBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const maxSize = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const scale = maxSize > 0 ? 1 / maxSize : 1;
    const baseHeight = this.finalRegionHeight * 0.01;

    this.mapFenceManager.update(id, data, option, {
      centerX,
      centerY,
      scale,
      baseHeight,
      mapSize: this.mapSize,
      mapGroup: this.mapGroup,
      geoJson: this.geoJson
    });
  }

  public createRegionOutline(id: string, data: any[], option: any): void {
    if (!this.scene) return;

    if (!this.mapRegionOutlineManager) {
      this.mapRegionOutlineManager = new MapRegionOutlineManager(this.scene);
    }

    const bounds = this.calculateBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const maxSize = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const scale = maxSize > 0 ? 1 / maxSize : 1;
    const baseHeight = this.finalRegionHeight * 0.01;

    this.mapRegionOutlineManager.update(id, data, option, {
      centerX,
      centerY,
      scale,
      baseHeight,
      mapSize: this.mapSize,
      mapGroup: this.mapGroup,
      geoJsonUrl: this.currentProps.mapSource?.geoJsonUrl,
      features: this.geoJson?.features || [],
      projectPoint: (point: [number, number]) => this.projectGeoPoint(point)
    });
  }

  /**
   * 创建/更新面片
   * @param id 组件唯一标识
   * @param data 面片点位数据 [{position: [lng, lat], ...}]
   * @param option 面片配置
   */
  public createPlane(id: string, visible: boolean, option: any): void {
    if (!this.scene) return;

    if (!this.planeManager) {
      this.planeManager = new PlaneManager(this.scene);
    }

    const bounds = this.calculateBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const maxSize = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const scale = maxSize > 0 ? 1 / maxSize : 1;
    const baseHeight = this.finalRegionHeight * 0.01;

    this.planeManager.update(id, visible, option, {
      centerX,
      centerY,
      scale,
      baseHeight,
      mapGroup: this.mapGroup
    });
  }

  /**
   * 创建/更新标牌图标
   * @param id 组件唯一标识
   * @param data 标牌数据 [{longitude: lng, latitude: lat, ...}]
   * @param option 标牌配置
   */
  public createMapGlIcon(id: string, data: any[], option: any): void {
    if (!this.scene) return;

    if (!this.mapGlIconManager) {
      this.mapGlIconManager = new MapGlIconManager(this.scene);
    }

    const bounds = this.calculateBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const maxSize = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const scale = maxSize > 0 ? 1 / maxSize : 1;
    const baseHeight = this.finalRegionHeight * 0.01;

    // 标牌配置可能嵌套在 options 中，也可能直接 in option 中
    const finalOption = option.options || option;

    this.mapGlIconManager.update(
      id,
      data,
      finalOption,
      {
        centerX,
        centerY,
        scale,
        baseHeight,
        mapSize: this.mapSize,
        mapGroup: this.mapGroup,
        projectPoint: (point: [number, number]) => this.projectGeoPoint(point)
      },
      (item: any) => {
        // 传递子组件点击事件
        if (this.onChildClickCallback) {
          this.onChildClickCallback(item);
        }
      }
    );
  }

  /**
   * 创建/更新柱状图
   * @param id 组件唯一标识
   * @param data 柱状图数据
   * @param option 柱状图配置
   */
  public createMapBar(id: string, data: any[], option: any): void {
    if (!this.scene) return;

    if (!this.mapBarManager) {
      this.mapBarManager = new MapBarManager(this.scene);
    }

    const bounds = this.calculateBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const maxSize = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const scale = maxSize > 0 ? 1 / maxSize : 1;
    const baseHeight = this.finalRegionHeight * 0.01;

    this.mapBarManager.update(id, data, option, {
      centerX,
      centerY,
      scale,
      baseHeight,
      mapSize: this.mapSize,
      mapGroup: this.mapGroup
    });
  }

  /**
   * 创建/更新散点
   * @param id 组件唯一标识
   * @param data 散点数据
   * @param option 散点配置
   */
  public createColorMap(id: string, data: any[], option: any): void {
    if (!this.mapGroup) return;

    if (!this.mapColorMapManager) {
      this.mapColorMapManager = new MapColorMapManager();
    }

    this.mapColorMapManager.update(id, data, option, {
      mapMeshes: this.mapMeshes,
      meshOriginalMaterial: this.meshOriginalMaterial
    });
  }

  private getHeatmapContext() {
    return {
      renderer: this.renderer,
      mapMeshes: this.mapMeshes,
      geoJson: this.geoJson,
      uvReferenceBounds: this.uvReferenceBounds,
      uvOffset: this.uvOffset,
      uvScale: this.uvScale
    };
  }

  public createHeatmap(id: string, data: any[], option: any): void {
    if (!this.mapGroup || !this.renderer) return;

    if (!this.mapClusteringHeatManager) {
      this.mapClusteringHeatManager = new MapClusteringHeatManager();
    }

    this.mapClusteringHeatManager.update(id, data, option, this.getHeatmapContext());
  }

  public async createMapScatter(id: string, data: any[], option: any): Promise<void> {
    if (!this.scene) return;

    if (!this.mapScatterManager) {
      this.mapScatterManager = new MapScatterManager(this.scene);
    }

    const bounds = this.calculateBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const maxSize = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const scale = maxSize > 0 ? 1 / maxSize : 1;
    const baseHeight = this.finalRegionHeight * 0.01;

    await this.mapScatterManager.update(id, data, option, {
      centerX,
      centerY,
      scale,
      baseHeight,
      mapSize: this.mapSize,
      mapGroup: this.mapGroup
    });
  }

  private updateAllUVs(): void {
    if (!this.uvReferenceBounds) return;
    const { minX: refMinX, maxX: refMaxX, minY: refMinY, maxY: refMaxY } = this.uvReferenceBounds;
    const refWidth = refMaxX - refMinX || 1;
    const refHeight = refMaxY - refMinY || 1;

    this.mapMeshes.forEach((mesh) => {
      const posAttr = mesh.geometry.attributes.position as any;
      if (!posAttr) return;

      const params = this.meshOriginalGeometryParams.get(mesh);
      if (!params) return;

      const { centerX, centerY, scale } = params;
      const uvs = new Float32Array(posAttr.count * 2);
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const projX = x / scale + centerX;
        const projY = y / scale + centerY;

        let u = (projX - refMinX) / refWidth;
        let v = (projY - refMinY) / refHeight;

        u = u * this.uvScale.x + this.uvOffset.x;
        v = v * this.uvScale.y + this.uvOffset.y;

        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
      }
      mesh.geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      if (mesh.geometry.attributes.uv) {
        mesh.geometry.attributes.uv.needsUpdate = true;
      }
    });
  }

  public updateUVTransform(offset?: { x?: number; y?: number }, scale?: { x?: number; y?: number }): void {
    if (offset) {
      if (offset.x !== undefined) this.uvOffset.x = offset.x;
      if (offset.y !== undefined) this.uvOffset.y = offset.y;
    }
    if (scale) {
      if (scale.x !== undefined) this.uvScale.x = scale.x;
      if (scale.y !== undefined) this.uvScale.y = scale.y;
    }
    this.updateAllUVs();
  }

  /**
   * 计算 GeoJSON 边界
   */
  private calculateBounds(): MapBounds {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    this.geoJson.features.forEach((feature: any) => {
      const coordinates = feature.geometry.coordinates;
      const polygons = feature.geometry.type === "Polygon" ? [coordinates] : coordinates;
      polygons.forEach((polygon: any) => {
        polygon.forEach((ring: any) => {
          ring.forEach((point: number[]) => {
            const projectedPoint = this.projectGeoPoint(point);
            if (!projectedPoint) {
              return;
            }
            const [x, y] = projectedPoint;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          });
        });
      });
    });

    if (![minX, maxX, minY, maxY].every((value) => Number.isFinite(value))) {
      const fallbackBounds = this.uvReferenceBounds || this.textureReferenceBounds || {
        minX: -1,
        maxX: 1,
        minY: -1,
        maxY: 1
      };
      console.warn("[echartGlmap] GeoJSON bounds contain invalid projected points, fallback bounds applied.");
      return { ...fallbackBounds };
    }

    return { minX, maxX, minY, maxY };
  }
  /**
   * 计算缩放比例
   */
  private calculateScale(bounds: { minX: number; maxX: number; minY: number; maxY: number }): number {
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const maxSize = Math.max(width, height);
    return maxSize > 0 ? 1 / maxSize : 1;
  }
  /**
   * 创建几何体（兼容旧方法名）
   */
  async createCube() {
    return this.createMapGeometry();
  }
  /**
   * 创建材质
   * @param option 材质配置选项
   * @returns THREE.Material
   */
  async createMaterial(
    option: {
      type?: "texture" | "color";
      textureUrl?: string;
      color?: string | number;
      roughness?: number;
      metalness?: number;
      emissive?: string | number;
      emissiveIntensity?: number;
      normalMap?: string;
      normalMapIntensity?: number;
      uvScaleX?: number;
      uvScaleY?: number;
      uvOffsetX?: number;
      uvOffsetY?: number;
      uvRotation?: number;
      innerShadowMap?: THREE.Texture | null;
      innerShadowColor?: string;
      innerShadowOpacity?: number;
    } = {}
  ): Promise<THREE.Material> {
    const {
      type = "color",
      textureUrl,
      color = "#ffffff",
      roughness = 1,
      metalness = 0,
      emissive,
      emissiveIntensity = 1,
      normalMap,
      normalMapIntensity = 1,
      uvScaleX = 1,
      uvScaleY = 1,
      uvOffsetX = 0,
      uvOffsetY = 0,
      uvRotation = 0,
      innerShadowMap = null,
      innerShadowColor = "#000000",
      innerShadowOpacity = 1.0
    } = option;
    // 检查缓存
    const shadowKey = innerShadowMap ? `_shd_${innerShadowMap.uuid}_${innerShadowColor}_${innerShadowOpacity}` : "";
    const cacheKey =
      type === "texture" && textureUrl
        ? `${type}_${textureUrl}_${normalMap || "none"}_${uvScaleX}_${uvScaleY}_${uvOffsetX}_${uvOffsetY}_${uvRotation}${shadowKey}`
        : `${type}_${color}_${normalMap || "none"}${shadowKey}`;
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey)!;
    }
    let material: THREE.Material;
    let shouldCache = true;

    const applyInnerShadow = (mat: THREE.Material) => {
      if (!innerShadowMap) return;

      // 强制开启 UV 定义，确保 Shader 中包含 vUv 变量
      (mat as any).defines = (mat as any).defines || {};
      (mat as any).defines.USE_UV = "";

      // 存储初始值到 userData，方便后续增量更新
      mat.userData.innerShadowMap = { value: innerShadowMap };
      mat.userData.innerShadowColor = { value: new THREE.Color(innerShadowColor) };
      mat.userData.innerShadowOpacity = { value: innerShadowOpacity };
      mat.userData.innerShadowUVOffset = { value: this.innerShadowUVTransform.offset };
      mat.userData.innerShadowUVScale = { value: this.innerShadowUVTransform.scale };

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.innerShadowMap = mat.userData.innerShadowMap;
        shader.uniforms.innerShadowColor = mat.userData.innerShadowColor;
        shader.uniforms.innerShadowOpacity = mat.userData.innerShadowOpacity;
        shader.uniforms.innerShadowUVOffset = mat.userData.innerShadowUVOffset;
        shader.uniforms.innerShadowUVScale = mat.userData.innerShadowUVScale;

        shader.fragmentShader = `
          uniform sampler2D innerShadowMap;
          uniform vec3 innerShadowColor;
          uniform float innerShadowOpacity;
          uniform vec2 innerShadowUVOffset;
          uniform vec2 innerShadowUVScale;
          ${shader.fragmentShader}
        `.replace(
          "#include <map_fragment>",
          `
          #include <map_fragment>
          // 将全局 vUv 映射到内阴影贴图的局部 0-1 空间
          vec2 shadowUv = vUv * innerShadowUVScale + innerShadowUVOffset;
          vec4 innerShadowTexel = texture2D( innerShadowMap, shadowUv );
          
          // 只有在 shadowUv 范围内的才应用阴影
          float edgeMask = step(0.0, shadowUv.x) * step(shadowUv.x, 1.0) * step(0.0, shadowUv.y) * step(shadowUv.y, 1.0);
          float glowAlpha = smoothstep(0.0, 1.0, innerShadowTexel.a) * innerShadowOpacity * edgeMask;
          
          // Screen Blending: 1 - (1 - base) * (1 - glow)
          // 实现明亮的边缘发光效果，而非暗色阴影遮盖
          vec3 glowContribution = innerShadowColor * glowAlpha;
          diffuseColor.rgb = 1.0 - (1.0 - diffuseColor.rgb) * (1.0 - glowContribution);
          `
        );
      };
    };
    const loadTextureUtils = async (
      url: string,
      options: {
        repeat?: [number, number];
        offset?: [number, number];
        rotation?: number;
        colorSpace?: string;
      } = {}
    ): Promise<THREE.Texture | null> => {
      // 检查是否为视频
      const isVideo = url.match(/\.(mp4|webm|ogv)(\?.*)?$/i);

      if (isVideo) {
        return new Promise((resolve) => {
          const video = document.createElement("video");
          video.src = url;
          video.loop = true;
          video.muted = true;
          video.autoplay = true;
          video.setAttribute("webkit-playsinline", "true");
          video.setAttribute("playsinline", "true");
          video.crossOrigin = "anonymous";

          video.oncanplay = () => {
            const tex = new THREE.VideoTexture(video);
            if (options.colorSpace) tex.colorSpace = options.colorSpace;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            if (options.repeat) tex.repeat.set(options.repeat[0], options.repeat[1]);
            if (options.offset) tex.offset.set(options.offset[0], options.offset[1]);
            if (options.rotation !== undefined) tex.rotation = THREE.MathUtils.degToRad(options.rotation);
            tex.center.set(0.5, 0.5);
            resolve(tex);
          };

          video.onerror = () => {
            console.error("视频加载失败:", url);
            resolve(null);
          };

          video.load();
          video.play().catch((err) => {
            console.warn("视频播放可能受限，尝试手动触发:", err);
          });
        });
      }

      const textureLoader = new THREE.TextureLoader();
      try {
        return await new Promise<THREE.Texture>((resolve, reject) => {
          textureLoader.load(
            url,
            (tex: THREE.Texture) => {
              if (options.colorSpace) tex.colorSpace = options.colorSpace;
              tex.wrapS = THREE.RepeatWrapping;
              tex.wrapT = THREE.RepeatWrapping;
              if (options.repeat) tex.repeat.set(options.repeat[0], options.repeat[1]);
              if (options.offset) tex.offset.set(options.offset[0], options.offset[1]);
              if (options.rotation !== undefined) tex.rotation = THREE.MathUtils.degToRad(options.rotation);
              tex.center.set(0.5, 0.5);
              tex.needsUpdate = true;
              resolve(tex);
            },
            undefined,
            (error: any) => reject(error)
          );
        });
      } catch (e) {
        console.error("纹理加载失败:", url, e);
        return null;
      }
    };

    // 预加载法线贴图（如果有）
    const loadedNormalMap = normalMap
      ? await loadTextureUtils(normalMap, {
          repeat: [1, 1],
          colorSpace: type === "texture" ? THREE.SRGBColorSpace : undefined
        })
      : null;

    if (type === "texture" && textureUrl) {
      console.log("加载纹理贴图:", textureUrl);
      const texture = await loadTextureUtils(textureUrl, {
        repeat: [uvScaleX, uvScaleY],
        offset: [uvOffsetX, uvOffsetY],
        rotation: uvRotation,
        colorSpace: THREE.SRGBColorSpace
      });

      if (texture) {
        material = new THREE.MeshStandardMaterial({
          map: texture,
          normalMap: loadedNormalMap,
          normalScale: new THREE.Vector2(normalMapIntensity, normalMapIntensity),
          roughness: 1,
          metalness: 0,
          emissiveIntensity: emissiveIntensity
        });
        console.log("材质创建成功，使用纹理:", textureUrl);
      } else {
        console.error("创建纹理材质失败，使用默认颜色材质:", textureUrl);
        material = new THREE.MeshStandardMaterial({
          color: color,
          roughness: roughness,
          metalness: metalness,
          emissive: emissive || 0x000000,
          emissiveIntensity: emissiveIntensity
        });
      }
    } else {
      material = new THREE.MeshStandardMaterial({
        color: color,
        normalMap: loadedNormalMap,
        normalScale: new THREE.Vector2(normalMapIntensity, normalMapIntensity),
        roughness: roughness,
        metalness: metalness,
        emissive: emissive || 0x000000,
        emissiveIntensity: emissiveIntensity
      });
    }

    applyInnerShadow(material);
    const canCacheMaterial = !(
      type === "texture" &&
      textureUrl &&
      material instanceof THREE.MeshStandardMaterial &&
      !material.map
    );
    if (canCacheMaterial) {
      this.materialCache.set(cacheKey, material);
    }
    return material;
  }

  /**
   * 创建侧面 Shader 材质（支持底部泛光、自定义贴图、自发光）
   */
  private createSideShaderMaterial(
    config: {
      textureUrl?: string;
      glowColor?: string | number;
      glowHeight?: number;
      glowStrength?: number;
      opacity?: number;
      sideGlowStrength?: number;
    } = {}
  ): THREE.ShaderMaterial {
    const {
      textureUrl,
      glowColor = "#5ba3f5",
      glowHeight = 1.8,
      glowStrength = 1.2,
      opacity = 0.5,
      sideGlowStrength = 1.0
    } = config;

    // 如果有贴图，预加载
    // const texture: THREE.Texture | null = null;
    // const useTexture = false;

    // 注意：这里是同步创建材质，纹理是异步的。
    // 实际上 ShaderMaterial 的 uniforms 可以后续更新 texture
    const uniforms = {
      time: { value: 0 },
      glowColor: { value: new THREE.Color(glowColor) },
      glowHeight: { value: glowHeight }, // 泛光高度衰减因子
      glowStrength: { value: glowStrength }, // 泛光强度
      opacity: { value: opacity },
      sideTexture: { value: null as THREE.Texture | null },
      useTexture: { value: 0 }, // 0: false, 1: true
      textureRepeat: { value: new THREE.Vector2(1, 1) },
      uSideGlowStrength: { value: sideGlowStrength } // 侧面全局辉光增强系数
    };

    if (textureUrl) {
      new THREE.TextureLoader().load(textureUrl, (tex: THREE.Texture) => {
        // (tex as any).colorSpace = (THREE as any).SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        uniforms.sideTexture.value = tex;
        uniforms.useTexture.value = 1;
        tex.needsUpdate = true;
      });
    }

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float time;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        #include <common>
        #include <tonemapping_pars_fragment>

        varying vec2 vUv;
        varying vec3 vPosition;
        
        uniform vec3 glowColor;
        uniform float glowHeight;
        uniform float glowStrength;
        uniform float opacity;
        
        uniform float uMaxHeight;
        uniform float uMinHeight;
        
        uniform sampler2D sideTexture;
        uniform float useTexture;
        uniform vec2 textureRepeat;
        uniform float uSideGlowStrength;
        
        void main() {
          // 1. 计算归一化高度
          float hRange = max(0.001, uMaxHeight - uMinHeight);
          float normalizedH = clamp((vPosition.z - uMinHeight) / hRange, 0.0, 1.0);

          // 2. 基础颜色或纹理采样
          vec3 baseColor = glowColor;
          float texAlpha = 1.0;
          
          if (useTexture > 0.5) {
            vec4 texColor = texture2D(sideTexture, vUv * textureRepeat);
            texColor = sRGBTransferEOTF( texColor );
            baseColor = texColor.rgb;
            texAlpha = texColor.a;
          }
          
          // 3. 底部泛光计算
          float decay = 3.0 / (glowHeight + 0.1); 
          float glow = exp(-normalizedH * decay) * glowStrength;
          
          // 4. 顶部边缘高亮
          float topEdge = smoothstep(0.96, 1.0, normalizedH) * 0.8;
          
          // 4. 混合
          vec3 finalColor = baseColor + glow * glowColor + topEdge * vec3(1.0);
          
          // 应用全局辉光增强 (HDR)
          finalColor *= uSideGlowStrength;

          // 透明度逻辑：
          // 如果用了贴图，透明度受贴图 alpha 影响
          // 如果没用贴图，底部透明度由 glow 决定? 
          // 现在的需求是：底部有一层渐变泛光。
          // 让我们保持整体透明度，叠加泛光强度
          
          float alpha = opacity;
          if (useTexture > 0.5) {
             alpha *= texAlpha;
          } else {
             // 无贴图模式：底部透明，受 Glow 影响变亮
             alpha *= (0.18 + 0.82 * glow);
          }
          
          // 确保泛光部分足够亮且不透明
          alpha = max(alpha, opacity * glow); 

          gl_FragColor = vec4(finalColor, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: true,
      blending: THREE.NormalBlending
    });

    // 初始化 uniform
    material.uniforms.uMaxHeight = { value: 10.0 };
    material.uniforms.uMinHeight = { value: 0.0 };

    return material;
  }
  /**
   * 创建相机
   * @param option 相机配置选项
   * @returns THREE.PerspectiveCamera
   */
  async createCamera(
    option: {
      fov?: number;
      aspect?: number;
      near?: number;
      far?: number;
      position?: [number, number, number];
      lookAt?: [number, number, number];
    } = {}
  ): Promise<THREE.PerspectiveCamera> {
    const {
      fov = 45,
      aspect = window.innerWidth / window.innerHeight,
      near = 0.1,
      far = 10000,
      position = [0, 0, 5],
      lookAt = [0, 0, 0]
    } = option;

    if (this.camera) {
      this.camera.fov = fov;
      this.camera.aspect = aspect;
      this.camera.near = near;
      this.camera.far = far;
      this.camera.position.set(position[0], position[1], position[2]);
      this.camera.lookAt(new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2]));
      this.camera.updateProjectionMatrix();
      return this.camera;
    }

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2]));
    this.camera = camera;
    return camera;
  }
  /**
   * 创建光照
   * @param option 光照配置选项
   * @returns THREE.Light[]
   */
  async createLight(
    option: {
      ambientIntensity?: number;
      ambientColor?: string | number;
      directionalIntensity?: number;
      directionalColor?: string | number;
      directionalPosition?: [number, number, number];
    } = {}
  ): Promise<THREE.Light[]> {
    const defaultSunlightColor = 0xfff8e1;
    const {
      ambientIntensity = 0.6,
      ambientColor = defaultSunlightColor,
      directionalIntensity = 1.2,
      directionalColor = defaultSunlightColor
      // directionalPosition = [0, 30, -100]
    } = option;
    const lights: THREE.Light[] = [];
    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    const directionalLight = new THREE.DirectionalLight(directionalColor, directionalIntensity);
    // directionalLight.position.set(directionalPosition[0], directionalPosition[1], directionalPosition[2]);
    directionalLight.position.set(0, 0, -50);
    // directionalLight.position;
    directionalLight.castShadow = true;
    directionalLight.rotation.y = THREE.MathUtils.degToRad(-45);
    // const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight, 50);
    // if (this.scene) {
    //   this.scene.add(dirLightHelper);
    // }
    lights.push(ambientLight);

    lights.push(directionalLight);
    return lights;
  }
  /**
   * 创建场景
   * @param option 场景配置选项
   * @returns THREE.Scene
   */
  async createScene(
    option: {
      backgroundColor?: string | number;
      fog?: boolean;
      fogColor?: string | number;
      fogNear?: number;
      fogFar?: number;
    } = {}
  ): Promise<THREE.Scene> {
    const { backgroundColor = 0x000000, fog = false, fogColor = 0x000000, fogNear = 1, fogFar = 1000 } = option;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    if (fog) {
      scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    }
    this.scene = scene;
    return scene;
  }
  /**
   * 清理当前地图相关的所有 3D 对象（地块、标签、边界线等）
   * 但保留场景、渲染器、相机和控制器的基础环境
   */
  private clearMapObjects() {
    if (this.mapGroup) {
      // 不再移除整个 mapGroup，而是只移除其中的地块 Mesh
      // if (this.scene) this.scene.remove(this.mapGroup);

      this.mapMeshes.forEach((mesh) => {
        mesh.traverse((obj: THREE.Object3D) => {
          if (obj === mesh) return;
          const anyObj = obj as any;
          if (anyObj.geometry) anyObj.geometry.dispose();
          if (anyObj.material) {
            if (Array.isArray(anyObj.material)) {
              anyObj.material.forEach((mat: THREE.Material) => mat.dispose());
            } else {
              anyObj.material.dispose();
            }
          }
        });
        if (mesh.geometry) mesh.geometry.dispose();
        // mesh.material 不在这里直接 dispose，因为它可能包含来自 caching 的材质
        mesh.material = [];
        mesh.removeFromParent(); // 从 mapGroup 中移除
      });
      this.mapMeshes = [];
      // this.mapGroup = null; // 保留 mapGroup 引用
    }

    // 清理贴地外轮廓
    this.clearOutlineMesh();

    // 清理标签和各种映射
    this.css2dLabelMap.forEach((obj) => obj.removeFromParent());
    this.css2dLabelMap.clear();
    this.meshBorderMap.clear();
    this.meshOriginalMaterial.clear();
    this.meshOriginalBorderMaterial.clear();
    this.meshTopGlowLineMap.clear();
    this.meshOriginalTopGlowLineMaterials.clear();
    this.meshOriginalPosition.clear();
    this.meshOriginalHeight.clear();
    this.meshOriginalGeometry.clear();
    this.meshOriginalShapes.clear();
    this.meshOriginalGeometryParams.clear();
    this.hoveredMesh = null;
    this.focusedMesh = null;
  }

  /**
   * 清理之前的渲染资源
   */
  private cleanupPreviousRender(Dom: HTMLElement) {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      Dom.innerHTML = "";
    }
    this.dispose();
  }

  /**
   * 计算地图尺寸和区域高度
   */
  private calculateMapSizeAndHeight(regionHeight?: number): { mapSize: number; finalRegionHeight: number } {
    const bounds = this.calculateBounds();
    const mapWidth = (bounds.maxX - bounds.minX) * this.calculateScale(bounds);
    const mapHeight = (bounds.maxY - bounds.minY) * this.calculateScale(bounds);
    const mapSize = Math.max(mapWidth, mapHeight);

    let finalRegionHeight: number;
    if (regionHeight !== undefined) {
      finalRegionHeight = regionHeight < 1 ? regionHeight * mapSize : regionHeight;
    } else {
      finalRegionHeight = mapSize * 0.01;
    }

    return { mapSize, finalRegionHeight };
  }

  /**
   * 创建和配置地图组
   */
  private async setupMapGroup(
    finalRegionHeight: number,
    initialRotationAngle: number,
    mapRotationAngle: number,
    textStyle?: TextStyle
  ): Promise<THREE.Group> {
    const mapGroup = await this.createMapGeometry(finalRegionHeight, initialRotationAngle, textStyle);
    this.mapGroup = mapGroup;

    if (mapRotationAngle !== 0) {
      const mapRotationRad = (mapRotationAngle * Math.PI) / 180;
      mapGroup.rotation.z += mapRotationRad;
    }

    return mapGroup;
  }

  /**
   * 配置相机位置和角度
   */
  private async setupCamera(
    Dom: HTMLElement,
    mapSize: number,
    camera: startProps["camera"],
    beta?: number
  ): Promise<void> {
    const cameraDistance = camera?.distance !== undefined ? camera.distance : beta ? Math.abs(beta) : mapSize * 3;
    const verticalTiltAngle = camera?.verticalTiltAngle !== undefined ? camera.verticalTiltAngle : 22;
    const horizontalRotationAngle = camera?.horizontalRotationAngle !== undefined ? camera.horizontalRotationAngle : 0;

    const phi = (90 - verticalTiltAngle) * (Math.PI / 180);
    const theta = (horizontalRotationAngle - 90) * (Math.PI / 180);

    const cameraPosition: [number, number, number] = [
      cameraDistance * Math.sin(phi) * Math.cos(theta),
      cameraDistance * Math.cos(phi),
      cameraDistance * Math.sin(phi) * Math.sin(theta)
    ];

    await this.createCamera({
      fov: 45,
      aspect: Dom.clientWidth / Dom.clientHeight,
      position: cameraPosition,
      lookAt: [this.mapCenter.x, this.mapCenter.y, this.mapCenter.z]
    });
  }

  /**
   * 配置光照系统
   * 方向光位置自动适应地图尺寸，从地图正上前方稍微偏一点照过来
   */
  private async setupLighting(light: startProps["light"], finalRegionHeight: number, mapSize: number): Promise<void> {
    if (!this.scene) return;

    const lightOffsetX = mapSize * 0.3;
    const lightOffsetY = mapSize * 0.8;
    const lightOffsetZ = mapSize * 0.3;

    const directionalPosition: [number, number, number] = [
      this.mapCenter.x + lightOffsetX,
      this.mapCenter.y + lightOffsetY,
      this.mapCenter.z + lightOffsetZ
    ];

    const defaultSunlightColor = 0xfff8e1;
    const lights = await this.createLight({
      ambientIntensity: light?.ambientIntensity !== undefined ? light.ambientIntensity : 1.2,
      ambientColor: light?.ambientColor !== undefined ? light.ambientColor : defaultSunlightColor,
      directionalIntensity: light?.directionalIntensity !== undefined ? light.directionalIntensity : 2.0,
      directionalColor: light?.directionalColor !== undefined ? light.directionalColor : defaultSunlightColor,
      directionalPosition: directionalPosition
    });
    lights.forEach((light) => this.scene!.add(light));
  }

  /**
   * 生成内阴影贴图
   */
  private updateInnerShadowTexture(config: any) {
    if (!config?.enable || !this.geoJson) {
      this.innerShadowTexture = null;
      return;
    }

    const { radius = 0.5, resolution = 1024 } = config;

    // 获取所有参与阴影轮廓计算的 Feature
    const outlineFeatures =
      this.borderFeatures && this.borderFeatures.length > 0 ? this.borderFeatures : this.geoJson.features;

    // 1. 计算当前的局部边界 (Local Bounds)
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    outlineFeatures.forEach((feature: any) => {
      const type = feature.geometry.type;
      const coordinates = feature.geometry.coordinates;
      const polygons = type === "Polygon" ? [coordinates] : coordinates;
      polygons.forEach((polygon: any) => {
        polygon.forEach((ring: any) => {
          ring.forEach((point: number[]) => {
            const projectedPoint = this.projectGeoPoint(point);
            if (!projectedPoint) {
              return;
            }
            const [lx, ly] = projectedPoint;
            minX = Math.min(minX, lx);
            maxX = Math.max(maxX, lx);
            minY = Math.min(minY, ly);
            maxY = Math.max(maxY, ly);
          });
        });
      });
    });

    const localW = maxX - minX || 1;
    const localH = maxY - minY || 1;

    if (![minX, maxX, minY, maxY].every((value) => Number.isFinite(value))) {
      this.innerShadowTexture = null;
      return;
    }

    // 2. 获取当前的 UV 参考边界 (Reference Bounds，即地块 UV 实际采用的基准)
    const refBounds = this.uvReferenceBounds || this.calculateBounds();
    const refW = refBounds.maxX - refBounds.minX || 1;
    const refH = refBounds.maxY - refBounds.minY || 1;

    // 3. 计算从 参考 UV 映射到 阴影贴图局部 UV 的变换参数
    // shadowUv = (vUv * refSize + refMin - localMin) / localSize
    //          = vUv * (refSize/localSize) + (refMin - localMin)/localSize
    this.innerShadowUVTransform.scale.set(refW / localW, refH / localH);
    this.innerShadowUVTransform.offset.set((refBounds.minX - minX) / localW, (refBounds.minY - minY) / localH);

    const canvas = document.createElement("canvas");
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 在 Canvas 绘制时，使用局部边界，确保阴影贴图能够铺满整个画布，保持最高质量
    const mapPoint = (lngLat: [number, number]) => {
      const projectedPoint = this.projectGeoPoint(lngLat);
      if (!projectedPoint) {
        return null;
      }
      const [x, y] = projectedPoint;
      const u = (x - minX) / localW;
      const v = (y - minY) / localH;
      return [u * resolution, resolution - v * resolution];
    };

    ctx.clearRect(0, 0, resolution, resolution);

    const traceAllFeatures = (context: CanvasRenderingContext2D) => {
      context.beginPath();
      outlineFeatures.forEach((feature: any) => {
        const coordinates = feature.geometry.coordinates;
        const polygons = feature.geometry.type === "Polygon" ? [coordinates] : coordinates;
        polygons.forEach((polygon: any) => {
          polygon.forEach((ring: any) => {
            if (ring.length < 3) return;
            const start = mapPoint(ring[0]);
            if (!start) return;
            context.moveTo(start[0], start[1]);
            ring.slice(1).forEach((pt: any) => {
              const p = mapPoint(pt);
              if (!p) return;
              context.lineTo(p[0], p[1]);
            });
            context.closePath();
          });
        });
      });
    };

    // radius 控制发光区的深度与柔和度
    // 使用 Math.pow 提供非线性控制：小数值时变化更缓，整体最大范围设为 0.1
    const blurBase = Math.pow(radius, 1.2) * resolution * 0.1;

    // Step 1: clip 到整个区域的合并轮廓
    // Canvas 的 nonzero winding rule 会让省份内部共享边相互抵消，仅留最外层有效边界
    ctx.save();
    traceAllFeatures(ctx);
    ctx.clip();

    ctx.strokeStyle = "white";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Layer 1: 深远柔和发光基底 — 大模糊半径 + 粗线宽，营造向中心缓慢衰减的光晕
    ctx.lineWidth = blurBase * 0.6;
    ctx.filter = `blur(${blurBase * 1.5}px)`;
    traceAllFeatures(ctx);
    for (let i = 0; i < 3; i++) {
      ctx.stroke();
    }

    // Layer 2: 边缘增亮层 — 中等模糊 + 细线宽，平滑地强化边界亮度
    ctx.lineWidth = blurBase * 0.2;
    ctx.filter = `blur(${blurBase * 0.8}px)`;
    traceAllFeatures(ctx);
    for (let i = 0; i < 3; i++) {
      ctx.stroke();
    }

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    this.innerShadowTexture = texture;
  }

  private innerShadowTexture: THREE.Texture | null = null;

  /**
   * 应用材质到地图网格
   */
  private async applyMaterials(
    mapGroup: THREE.Group,
    config: {
      fillType: string;
      areaColor: string;
      picture?: string;
      normalMap?: string;
      normalMapIntensity?: number;
      uvScaleX?: number;
      uvScaleY?: number;
      uvOffsetX?: number;
      uvOffsetY?: number;
      uvRotation?: number;
      borderWidth: number;
      borderColor: string;
      innerShadow?: any;
    }
  ): Promise<void> {
    const {
      fillType,
      areaColor,
      picture,
      normalMap,
      normalMapIntensity,
      uvScaleX,
      uvScaleY,
      uvOffsetX,
      uvOffsetY,
      uvRotation,
      borderWidth,
      borderColor,
      innerShadow
    } = config;
    const isPicture = fillType === "picture";
    const baseColor = areaColor || "#171a24";
    const emissiveColor = isPicture ? "#000000" : areaColor;
    const emissiveIntensity = isPicture ? 0 : 0.3;

    // 生成内阴影贴图
    this.updateInnerShadowTexture(innerShadow);

    const material = await this.createMaterial({
      type: isPicture ? "texture" : "color",
      textureUrl: isPicture ? picture : undefined,
      color: baseColor,
      roughness: 1,
      metalness: 0,
      emissive: emissiveColor,
      emissiveIntensity: emissiveIntensity,
      normalMap,
      normalMapIntensity,
      uvScaleX,
      uvScaleY,
      uvOffsetX,
      uvOffsetY,
      uvRotation,
      innerShadowMap: this.innerShadowTexture,
      innerShadowColor: innerShadow?.color || "#000000",
      innerShadowOpacity: innerShadow?.opacity !== undefined ? innerShadow.opacity : 1.0
    });

    // 准备侧面材质 (Border Material)
    // const bloomConfig = this.currentProps.sceneControl?.bloom || {};
    const sideMaterialTemplate = this.createSideShaderMaterial({
      sideGlowStrength: this.currentProps.sideGlowStrength,
      glowColor: this.currentProps.sideGlowColor
    });

    // 预先计算高度范围（只需计算一次，因为所有块高度/基准一致）
    let isHeightSet = false;

    mapGroup.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && child.userData.isRegion) {
        // 统一设置一次 Shared Uniforms
        if (!isHeightSet && child.geometry) {
          child.geometry.computeBoundingBox();
          if (child.geometry.boundingBox) {
            sideMaterialTemplate.uniforms.uMaxHeight.value = child.geometry.boundingBox.max.z;
            sideMaterialTemplate.uniforms.uMinHeight.value = child.geometry.boundingBox.min.z;
            isHeightSet = true;
          }
        }

        const sideMaterial = sideMaterialTemplate;

        // 使用共享材质：[顶面材质, 侧面材质]
        // 默认情况下所有地块共享同一个材质实例，只有在悬停/高亮时才克隆
        const meshMaterials = [material, sideMaterial];

        // 现在应该都有 groups 了
        if (child.geometry.groups && child.geometry.groups.length > 0) {
          child.material = meshMaterials;
        } else {
          child.material = meshMaterials[0];
        }

        // 保存原始材质引用 (这里保存的是共享材质的引用)
        this.meshOriginalMaterial.set(child, meshMaterials);

        child.castShadow = true;
        child.receiveShadow = true;
        child.renderOrder = 0;

        // 如果需要更新 Shader 中的高度信息，可以在这里计算 boundingBox 并传给 uniform
        // 现在的 Shader 比较简单，直接用 position 计算
      }
    });

    if (this.outlineFlowMaterial) {
      if (this.outlineFlowMaterial.color?.set) {
        this.outlineFlowMaterial.color.set(borderColor);
      }
      if (typeof this.outlineFlowMaterial.lineWidth !== "undefined") {
        this.outlineFlowMaterial.lineWidth = borderWidth * 0.001;
      }
    }
  }

  /**
   * 使用 CSS3D 生成省份文字，并平铺躺在顶面
   */
  /**
   * 使用 CSS2D 生成省份文字
   */
  private createCss2dLabel(text: string, position: THREE.Vector3, textStyle: TextStyle, mesh: THREE.Mesh): CSS2DObject {
    const fontSize = textStyle.fontSize || 16;
    const color = textStyle.color || "rgba(255,255,255,0.95)";
    const fontFamily = textStyle.fontFamily || "Arial, sans-serif";
    const fontWeight = textStyle.fontWeight || "normal";
    const fontStyle = textStyle.fontStyle || "normal";

    const container = document.createElement("div");
    container.style.cssText = `
      position: absolute;
      pointer-events: none;
      user-select: none;
    `;

    const textEl = document.createElement("div");
    textEl.className = "css2d-label-text"; // Add class for selection
    textEl.textContent = text;
    textEl.style.cssText = `
      pointer-events: none;
      color: ${color};
      font-family: ${fontFamily};
      font-weight: ${fontWeight};
      font-style: ${fontStyle};
      font-size: ${Math.round(fontSize)}px;
      line-height: ${Math.round(fontSize + 4)}px;
      padding: 0;
      border-radius: 4px;
      background: transparent;
      white-space: nowrap;
      text-shadow: 0 0 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.5);
      text-rendering: geometricPrecision;
      -webkit-font-smoothing: antialiased;
      transform: translate(-50%, -50%);
      transform-origin: center center;
    `;
    container.appendChild(textEl);

    const labelObj = new CSS2DObject(container);
    labelObj.position.copy(position);
    labelObj.layers.set(0);

    mesh.add(labelObj);
    this.css2dLabelMap.set(mesh, labelObj);
    return labelObj;
  }

  /**
   * 更新所有标签的大小（当相机距离改变时实现视差缩放）
   */
  private updateTextLabelsScale(): void {
    if (!this.camera || !this.mapSize || this.css2dLabelMap.size === 0) return;

    const camPos = new THREE.Vector3();
    this.camera.getWorldPosition(camPos);

    // 参考距离：通常相机初始距离在 mapSize * 3 左右
    const refDistance = this.mapSize * 3;

    this.css2dLabelMap.forEach((labelObj) => {
      const worldPos = new THREE.Vector3();
      labelObj.getWorldPosition(worldPos);
      const distance = camPos.distanceTo(worldPos);

      // 计算缩放：距离越远，缩放越小
      let scale = refDistance / Math.max(distance, 0.01);

      // 限制缩放范围
      scale = Math.max(0.15, Math.min(2.0, scale));

      const textEl = labelObj.element.querySelector(".css2d-label-text") as HTMLElement;
      if (textEl) {
        textEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }
    });
  }

  /**
   * 为地图区域添加文字标签
   */
  private addTextLabels(mapGroup: THREE.Group, textStyle: TextStyle, _regionHeight: number): void {
    if (!textStyle || textStyle.fontSize === 0) {
      return;
    }

    // 清理旧 CSS2D 标签
    this.css2dLabelMap.forEach((obj) => obj.removeFromParent());
    this.css2dLabelMap.clear();

    mapGroup.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        const regionName = child.userData.name;
        if (regionName) {
          const feature = child.userData.feature;
          const projParams = this.meshOriginalGeometryParams.get(child);
          let center: THREE.Vector3;

          // 优先通过 feature.properties 中的中心点 (center/cp/centroid) 经纬度投影计算位置
          const coords = feature?.properties?.cp || feature?.properties?.center || feature?.properties?.centroid;

          if (coords && projParams) {
            const { centerX, centerY, scale } = projParams;
            const projectedPoint = this.projectGeoPoint(coords);
            if (projectedPoint) {
              const [x, y] = projectedPoint;
              center = new THREE.Vector3((x - centerX) * scale, (y - centerY) * scale, 0);

              // Z 轴依然根据几何体高度动态计算，确保标签浮于面上
              child.geometry.computeBoundingBox();
              const boundingBox = child.geometry.boundingBox;
              if (boundingBox) {
                center.z = boundingBox.max.z + Math.max(0.001, (this.mapSize || 1) * 0.0004);
              }
            } else {
              child.geometry.computeBoundingBox();
              const boundingBox = child.geometry.boundingBox;
              if (!boundingBox) return;
              center = new THREE.Vector3();
              center.addVectors(boundingBox.min, boundingBox.max);
              center.multiplyScalar(0.5);
              center.z = boundingBox.max.z + Math.max(0.001, (this.mapSize || 1) * 0.0004);
            }
          } else {
            // 降级策略：如果 feature 中没有中心点属性，则回退到包围盒中心
            child.geometry.computeBoundingBox();
            const boundingBox = child.geometry.boundingBox;
            if (!boundingBox) return;
            center = new THREE.Vector3();
            center.addVectors(boundingBox.min, boundingBox.max);
            center.multiplyScalar(0.5);
            center.z = boundingBox.max.z + Math.max(0.001, (this.mapSize || 1) * 0.0004);
          }

          this.createCss2dLabel(regionName, center, textStyle, child);
        }
      }
    });

    this.updateTextLabelsScale();
  }

  /**
   * 设置鼠标控制器
   */
  private setupControls(Dom: HTMLElement, mapSize: number, mouseControl: startProps["mouseControl"]): void {
    if (!this.camera || !this.renderer) return;

    try {
      const OrbitControlsClass: any = OrbitControls;

      if (OrbitControlsClass) {
        this.domElement = Dom;
        this.setupOrbitControls(OrbitControlsClass, mapSize, mouseControl);
      } else {
        console.warn("OrbitControls 未找到，将使用自定义鼠标控制。");
        this.initCustomControls(Dom, mapSize, mouseControl);
      }
    } catch (error) {
      console.warn("OrbitControls 初始化失败，将使用基础相机控制:", error);
    }
  }

  /**
   * 配置 OrbitControls
   */
  private setupOrbitControls(OrbitControlsClass: any, mapSize: number, mouseControl: startProps["mouseControl"]): void {
    if (!this.camera || !this.renderer) return;

    this.controls = new OrbitControlsClass(this.camera, this.renderer.domElement);
    if (!this.controls) {
      return;
    }
    this.controls.target.set(this.mapCenter.x, this.mapCenter.y, this.mapCenter.z);
    this.target.copy(this.controls.target);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.enableRotate = true;

    const internalZoomSpeed =
      mouseControl?.zoomSpeed !== undefined ? (mouseControl.zoomSpeed / 100) * 0.19 + 0.01 : 0.05;
    const internalPanSpeed =
      mouseControl?.panSpeed !== undefined ? (mouseControl.panSpeed / 100) * 0.0099 + 0.0001 : 0.001;
    const internalRotateSpeed =
      mouseControl?.rotateSpeed !== undefined ? (mouseControl.rotateSpeed / 100) * 0.019 + 0.001 : 0.005;

    this.controls.rotateSpeed = internalRotateSpeed * 40;
    this.controls.zoomSpeed = internalZoomSpeed * 20;
    this.controls.panSpeed = internalPanSpeed * 1000;
    this.controls.minDistance = mapSize * 0.1;
    this.controls.maxDistance = mapSize * 10;
    this.controls.removeEventListener("change", this.handleOrbitControlsChange);
    this.controls.addEventListener("change", this.handleOrbitControlsChange);

    this.setEditorNavigationMode(this.editorNavigationMode);
    this.controls.enabled = this.navigationEnabled;

    const domElement = this.renderer.domElement;
    const onMouseDown = () => {
      if (!this.controls) return;
      if (!this.navigationEnabled) {
        this.controls.enabled = false;
        return;
      }
      if (this.editorNavigationMode) {
        this.controls.enabled = true;
        return;
      }
      this.controls.enabled = !this.isOverMap;
    };

    const onMouseUp = () => {
      if (this.controls) {
        this.controls.enabled = this.navigationEnabled;
      }
    };

    domElement.addEventListener("mousedown", onMouseDown);
    domElement.addEventListener("mouseup", onMouseUp);

    (domElement as any)._orbitControlsHandlers = {
      mousedown: onMouseDown,
      mouseup: onMouseUp
    };
  }

  /**
   * 设置鼠标交互（悬停和点击）
   */
  private setupMouseInteraction(Dom: HTMLElement): void {
    if (!this.renderer || !this.camera || !this.scene) return;

    const onMouseMove = (event: MouseEvent) => {
      if (!this.mouseInteractionEnabled) {
        Dom.style.cursor = "default";
        return;
      }
      if (this.isDragging || !this.renderer) return;
      if (event.target instanceof Element && event.target.closest('[data-map-gl-icon="1"]')) return;

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera!);
      const intersects = this.raycaster.intersectObjects(this.mapMeshes, false);

      if (intersects.length > 0) {
        const intersectedMesh = intersects[0].object as THREE.Mesh;
        Dom.style.cursor = "pointer";
        this.isOverMap = true;

        if (this.hoveredMesh !== intersectedMesh) {
          this.onMeshLeave(this.hoveredMesh);
          this.hoveredMesh = intersectedMesh;
          this.onMeshHover(intersectedMesh);
        }
      } else {
        Dom.style.cursor = "default";
        this.isOverMap = false;

        if (this.hoveredMesh) {
          this.onMeshLeave(this.hoveredMesh);
          this.hoveredMesh = null;
        }
      }
    };

    const onMouseEnter = () => {};

    const onMouseLeave = () => {
      Dom.style.cursor = "default";
      this.isOverMap = false;
      if (this.hoveredMesh) {
        this.onMeshLeave(this.hoveredMesh);
        this.hoveredMesh = null;
      }
    };

    const onClick = (event: MouseEvent) => {
      if (!this.mouseInteractionEnabled) return;
      if (this.isDragging || !this.renderer) return;
      if (event.target instanceof Element && event.target.closest('[data-map-gl-icon="1"]')) return;

      // 清除之前的定时器
      if (this.clickTimer) {
        clearTimeout(this.clickTimer);
        this.clickTimer = null;
      }

      this.clickTimer = setTimeout(() => {
        const rect = this.renderer!.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera!);
        const intersects = this.raycaster.intersectObjects(this.mapMeshes, false);

        if (intersects.length > 0) {
          const intersectedMesh = intersects[0].object as THREE.Mesh;
          // 单击聚焦地块
          this.focusMesh(intersectedMesh);
          console.log("Single Click - Focus Mesh");
        } else {
          // 单击空白处，取消聚焦
          this.unfocusMesh();
          console.log("Single Click - Empty Space - Unfocus");
        }
        this.clickTimer = null;
      }, 250); // 250ms 延迟以等待潜在的双击
    };

    const onDblClick = (event: MouseEvent) => {
      if (!this.mouseInteractionEnabled) return;
      if (this.isDragging || !this.renderer) return;
      if (event.target instanceof Element && event.target.closest('[data-map-gl-icon="1"]')) return;

      // 清除单击定时器，避免触发单击事件
      if (this.clickTimer) {
        clearTimeout(this.clickTimer);
        this.clickTimer = null;
      }

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera!);
      const intersects = this.raycaster.intersectObjects(this.mapMeshes, false);

      if (intersects.length > 0) {
        const intersectedMesh = intersects[0].object as THREE.Mesh;
        // 双击执行原本的onClick逻辑（下钻）
        this.onMeshClick(intersectedMesh, "left");
        console.log("Double Click - Drill Down");
      }
    };

    const onContextMenu = (event: MouseEvent) => {
      if (!this.mouseInteractionEnabled) return;
      if (this.isDragging || !this.renderer) return;
      if (event.target instanceof Element && event.target.closest('[data-map-gl-icon="1"]')) return;

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera!);
      const intersects = this.raycaster.intersectObjects(this.mapMeshes, false);

      if (intersects.length > 0) {
        event.preventDefault();
        const intersectedMesh = intersects[0].object as THREE.Mesh;
        this.onMeshClick(intersectedMesh, "right");
      }
    };

    Dom.addEventListener("mousemove", onMouseMove);
    Dom.addEventListener("mouseenter", onMouseEnter);
    Dom.addEventListener("mouseleave", onMouseLeave);
    Dom.addEventListener("click", onClick);
    Dom.addEventListener("dblclick", onDblClick);
    Dom.addEventListener("contextmenu", onContextMenu);

    (Dom as any)._mouseInteractionHandlers = {
      mousemove: onMouseMove,
      mouseenter: onMouseEnter,
      mouseleave: onMouseLeave,
      click: onClick,
      dblclick: onDblClick,
      contextmenu: onContextMenu
    };
  }

  /**
   * 处理 mesh 悬停
   */
  private onMeshHover(mesh: THREE.Mesh, liftOptions?: { height?: number; duration?: number }): void {
    if (!mesh) return;
    // 如果该地块已经被单击聚焦，则忽略普通的悬停效果，保持聚焦状态
    if (this.focusedMesh === mesh) return;

    const { fillType, areaColor, activeAreaColor, sideGlowColor, hoverLift } = this.currentProps;
    const resolvedLift = liftOptions ? { ...hoverLift, ...liftOptions } : hoverLift;
    const isPicture = fillType === "picture";
    const activeColor = new THREE.Color(activeAreaColor || "#ffffff");
    const baseColor = new THREE.Color(isPicture ? "#ffffff" : areaColor || "#ffffff");
    const baseBorderColor = new THREE.Color(sideGlowColor || "#5ba3f5");

    // 获取原始共享材质
    const originalMats = this.meshOriginalMaterial.get(mesh);
    if (!originalMats || originalMats.length === 0) return;

    // 克隆材质以应用高亮效果，避免影响其他共享材质的地块
    const topMat = cloneMapMaterial(originalMats[0]);
    let sideMat: THREE.Material | null = null;

    // 应用顶面高亮
    if (topMat instanceof THREE.MeshStandardMaterial) {
      topMat.color.copy(baseColor).multiply(activeColor);
    } else if (topMat instanceof THREE.ShaderMaterial) {
      // 如果顶面也是 Shader，修改对应的 Color Uniform
      if (topMat.uniforms.uColor) topMat.uniforms.uColor.value.copy(baseColor).multiply(activeColor);
      if (topMat.uniforms.glowStrength) topMat.uniforms.glowStrength.value = 1.25;
    }

    // 如果有侧面材质，也克隆并应用高亮
    if (originalMats.length > 1) {
      sideMat = originalMats[1].clone();
      if (sideMat instanceof THREE.ShaderMaterial) {
        if (sideMat.uniforms.glowColor) sideMat.uniforms.glowColor.value.copy(baseBorderColor).multiply(activeColor);
        if (sideMat.uniforms.glowStrength) sideMat.uniforms.glowStrength.value = 1.35;
        if (sideMat.uniforms.uSideGlowStrength) sideMat.uniforms.uSideGlowStrength.value = 1.8;
      }
    }

    // 应用克隆后的材质到 Mesh
    if (sideMat && mesh.geometry.groups && mesh.geometry.groups.length > 0) {
      mesh.material = [topMat, sideMat];
    } else {
      mesh.material = topMat;
    }

    const { activeBorderColor } = this.currentProps;

    const lineGroup = this.meshTopGlowLineMap.get(mesh);
    if (lineGroup) {
      let topZ = 0;
      if (mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        if (mesh.geometry.boundingBox) {
          topZ = mesh.geometry.boundingBox.max.z;
        }
      }
      const safeOffset = Math.max(0.001, (this.mapSize || 1) * 0.0001);
      lineGroup.position.z = topZ + safeOffset;
      lineGroup.children.forEach((obj: THREE.Object3D) => {
        const oldMat = (obj as any).material as any;
        const hoverBorderColorVal = new THREE.Color(activeBorderColor || "#ffffff");

        // 创建临时高亮材质，避免污染原始材质
        if (oldMat.isMeshLineMaterial) {
          const newMat = new MeshLineMaterial({
            color: hoverBorderColorVal,
            lineWidth: oldMat.lineWidth,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: oldMat.sizeAttenuation,
            resolution: oldMat.resolution.clone(),
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending
          });
          (newMat as any).toneMapped = false;
          (obj as any).material = newMat;
        } else {
          const newMat = oldMat.clone();
          newMat.color.copy(hoverBorderColorVal);
          newMat.opacity = 0.9;
          (obj as any).material = newMat;
        }
        (obj as any).renderOrder = 1;
      });
    }

    if (resolvedLift && resolvedLift.height !== undefined && resolvedLift.height > 0) {
      this.liftMesh(mesh, resolvedLift.height, resolvedLift.duration ?? 500);
    }
  }

  /**
   * 处理 mesh 离开
   */
  private onMeshLeave(mesh: THREE.Mesh | null): void {
    if (!mesh) return;
    // 如果该地块处于聚焦状态，不执行离开恢复逻辑
    if (this.focusedMesh === mesh) return;
    // const isPicture = fillType === "picture";
    // const sideGlow = sceneControl?.bloom?.sideGlowStrength || 1.0;

    // 恢复共享材质
    const originalMats = this.meshOriginalMaterial.get(mesh);
    if (originalMats) {
      // 销毁当前的临时高亮材质（如果是克隆出来的）
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m: THREE.Material) => m.dispose());
      } else if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }

      // 还原为共享材质引用
      if (originalMats.length > 1 && mesh.geometry.groups && mesh.geometry.groups.length > 0) {
        mesh.material = originalMats;
      } else {
        mesh.material = originalMats[0];
      }
    }

    const borderLine = this.meshBorderMap.get(mesh);
    const originalBorderMaterial = this.meshOriginalBorderMaterial.get(mesh);
    if (borderLine && originalBorderMaterial) {
      borderLine.material = originalBorderMaterial;
    }

    const lineGroup = this.meshTopGlowLineMap.get(mesh);
    if (lineGroup) {
      const originalLineMaterials = this.meshOriginalTopGlowLineMaterials.get(mesh);
      if (originalLineMaterials && originalLineMaterials.length === lineGroup.children.length) {
        lineGroup.children.forEach((obj: THREE.Object3D, i: number) => {
          const currentMat = (obj as any).material as THREE.Material;
          const orig = originalLineMaterials[i];
          if (currentMat && currentMat !== orig) {
            currentMat.dispose();
          }
          (obj as any).material = orig;
        });
      }
      lineGroup.visible = true;
    }

    this.restoreMeshPosition(mesh);
  }

  /**
   * 处理 mesh 点击
   */
  private onMeshClick(mesh: THREE.Mesh, clickType: "left" | "right"): void {
    if (!mesh) return;

    const regionName = mesh.userData.name;
    const adcode = mesh.userData.adcode;
    const feature = mesh.userData.feature;

    console.log("点击区域:", regionName, "adcode:", adcode, "点击类型:", clickType);

    if (this.onRegionClickCallback) {
      this.onRegionClickCallback({
        name: regionName,
        adcode: adcode,
        feature: feature,
        clickType: clickType
      });
    }
  }

  /**
   * 重新创建几何体（使用新的厚度）
   */
  private recreateGeometry(mesh: THREE.Mesh, newHeight: number): void {
    const shapes = this.meshOriginalShapes.get(mesh);
    const params = this.meshOriginalGeometryParams.get(mesh);
    if (!shapes || !params) return;

    const extrudeSettings = {
      depth: newHeight,
      bevelEnabled: false
    };
    const geometries = shapes.map((shape) => new THREE.ExtrudeGeometry(shape, extrudeSettings));
    const newGeometry = this.mergeGeometries(geometries, params.centerX, params.centerY, params.scale);

    const oldGeometry = mesh.geometry;
    mesh.geometry = newGeometry;
    oldGeometry.dispose();

    mesh.geometry.computeBoundingBox();
    if (mesh.geometry.boundingBox) {
      const minH = mesh.geometry.boundingBox.min.z;
      const maxH = mesh.geometry.boundingBox.max.z;
      if (Array.isArray(mesh.material)) {
        const sideMat = mesh.material[1] as any;
        if (sideMat && sideMat.uniforms) {
          if (sideMat.uniforms.uMinHeight) sideMat.uniforms.uMinHeight.value = minH;
          if (sideMat.uniforms.uMaxHeight) sideMat.uniforms.uMaxHeight.value = maxH;
        }
      }
      const lineGroup = this.meshTopGlowLineMap.get(mesh);
      if (lineGroup) {
        const safeOffset = Math.max(0.001, (this.mapSize || 1) * 0.0005);
        lineGroup.position.z = maxH + safeOffset;
      }
    }

    const borderLine = this.meshBorderMap.get(mesh);
    if (borderLine && mesh.geometry) {
      const oldBorderGeometry = borderLine.geometry;
      const newBorderGeometry = new THREE.EdgesGeometry(mesh.geometry);
      borderLine.geometry = newBorderGeometry;
      oldBorderGeometry.dispose();
    }
  }

  private liftMesh(mesh: THREE.Mesh, liftHeight: number, duration: number): void {
    this.restoreMeshPosition(mesh);

    const originalPosition = this.meshOriginalPosition.get(mesh);
    const originalHeight = this.meshOriginalHeight.get(mesh);
    if (!originalPosition || originalHeight === undefined) return;

    const actualLiftHeight = this.mapSize * liftHeight;
    mesh.renderOrder = 20;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((mat) => {
      if (mat instanceof THREE.Material) {
        mat.depthTest = true;
        mat.depthWrite = true;
        mat.transparent = true; // 允许透明（如果有阴影贴图涉及透明）
        mat.opacity = 1;
      }
    });

    const borderLine = this.meshBorderMap.get(mesh);
    if (borderLine) {
      borderLine.renderOrder = 21;
    }

    const targetHeight = originalHeight + actualLiftHeight;
    const startHeight = originalHeight;
    const startTime = performance.now();

    const applyLiftHeight = (currentHeight: number) => {
      this.recreateGeometry(mesh, currentHeight);

      const heightDelta = (currentHeight - originalHeight) / 2;
      mesh.position.set(originalPosition.x, originalPosition.y, originalPosition.z + heightDelta);

      if (this.mapBarManager && mesh.userData.adcode) {
        this.mapBarManager.liftBars(mesh.userData.adcode, currentHeight - originalHeight);
      }

      if (this.mapScatterManager && mesh.userData.adcode) {
        this.mapScatterManager.liftScatters(mesh.userData.adcode, currentHeight - originalHeight);
      }
    };

    if (duration <= 0) {
      applyLiftHeight(targetHeight);
      this.meshLiftAnimation.delete(mesh);
      return;
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentHeight = startHeight + (targetHeight - startHeight) * easeProgress;

      applyLiftHeight(currentHeight);

      if (progress < 1) {
        const animationId = requestAnimationFrame(animate);
        this.meshLiftAnimation.set(mesh, animationId);
      } else {
        this.meshLiftAnimation.delete(mesh);
      }
    };

    const animationId = requestAnimationFrame(animate);
    this.meshLiftAnimation.set(mesh, animationId);
  }

  /**
   * 恢复地块位置（立即恢复）
   */
  private restoreMeshPosition(mesh: THREE.Mesh): void {
    const animationId = this.meshLiftAnimation.get(mesh);
    if (animationId !== undefined) {
      cancelAnimationFrame(animationId);
      this.meshLiftAnimation.delete(mesh);
    }

    if (this.mapBarManager && mesh.userData.adcode) {
      this.mapBarManager.restoreBars(mesh.userData.adcode);
    }

    if (this.mapScatterManager && mesh.userData.adcode) {
      this.mapScatterManager.restoreScatters(mesh.userData.adcode);
    }

    mesh.renderOrder = 0;

    const borderLine = this.meshBorderMap.get(mesh);
    if (borderLine) {
      borderLine.renderOrder = 0;
    }

    const originalPosition = this.meshOriginalPosition.get(mesh);
    if (originalPosition) {
      mesh.position.copy(originalPosition);
    }

    const originalHeight = this.meshOriginalHeight.get(mesh);
    if (originalHeight !== undefined) {
      this.recreateGeometry(mesh, originalHeight);
    }
  }

  private getMeshByAdcode(adcode?: string): THREE.Mesh | null {
    const targetAdcode = String(adcode || "");
    if (!targetAdcode) {
      return null;
    }

    return this.mapMeshes.find((mesh) => String(mesh.userData?.adcode || "") === targetAdcode) || null;
  }

  public liftRegionByAdcode(adcode: string, liftOptions?: { height?: number; duration?: number }): void {
    const targetAdcode = String(adcode || "");
    if (!targetAdcode) {
      this.unfocusMesh();
      return;
    }

    const targetMesh = this.getMeshByAdcode(targetAdcode);
    if (!targetMesh) {
      return;
    }

    if (this.focusedMesh === targetMesh) {
      this.unfocusMesh();
    }

    this.focusMesh(targetMesh, liftOptions);
  }

  private applyConfiguredDefaultLift(forceReapply = false, allowClear = false): void {
    const targetAdcode = String(this.currentProps.defaultLiftAdcode || "");

    if (!targetAdcode) {
      if (allowClear) {
        this.unfocusMesh();
      }
      return;
    }

    const targetMesh = this.getMeshByAdcode(targetAdcode);
    if (!targetMesh) {
      if (allowClear) {
        this.unfocusMesh();
      }
      return;
    }

    if (this.focusedMesh === targetMesh) {
      if (forceReapply) {
        this.focusedMesh = null;
        this.focusMesh(targetMesh);
      }
      return;
    }

    this.focusMesh(targetMesh);
  }

  /**
   * 聚焦 Mesh：应用悬停效果并移动相机
   */
  private focusMesh(mesh: THREE.Mesh, liftOptions?: { height?: number; duration?: number }) {
    if (this.focusedMesh === mesh) return;
    this.unfocusMesh();

    this.onMeshHover(mesh, liftOptions);

    this.focusedMesh = mesh;

    // 移动相机聚焦
    // this.animateCameraTo(mesh);
  }

  /**
   * 取消聚焦
   */
  private unfocusMesh() {
    if (this.focusedMesh) {
      const mesh = this.focusedMesh;
      this.focusedMesh = null;
      // 恢复状态
      this.onMeshLeave(mesh);
    }
  }

  /**
   * 移动相机 LookAt 到目标 Mesh 中心
   */
  private animateCameraTo(mesh: THREE.Mesh) {
    if (!this.controls || !this.camera) return;

    const box = new THREE.Box3().setFromObject(mesh);
    const targetCenter = box.getCenter(new THREE.Vector3());

    const startTarget = this.controls.target.clone();
    const startCameraPos = this.camera.position.clone();

    // 计算位移向量，使相机跟随 target 平移，保持姿态不变
    const offset = new THREE.Vector3().subVectors(targetCenter, startTarget);
    const endCameraPos = startCameraPos.clone().add(offset);

    const startTime = performance.now();
    const duration = 800; // ms

    if (this.cameraAnimationId) {
      cancelAnimationFrame(this.cameraAnimationId);
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      this.controls!.target.lerpVectors(startTarget, targetCenter, easeProgress);
      this.camera!.position.lerpVectors(startCameraPos, endCameraPos, easeProgress);
      this.controls!.update();

      if (progress < 1) {
        this.cameraAnimationId = requestAnimationFrame(animate);
      } else {
        this.cameraAnimationId = null;
      }
    };

    this.cameraAnimationId = requestAnimationFrame(animate);
  }

  /**
   * 更新绘制
   * @param Dom DOM 元素容器
   * @param props 配置属性
   */
  async updateDraw(Dom: HTMLElement, props: startProps) {
    const {
      adcode,
      fillType = "color",
      areaColor = "#ffffff",
      picture,
      normalMap,
      normalMapIntensity,
      borderWidth = 0,
      borderColor = "#ffffff",
      sideGlowColor,
      sideGlowStrength,
      textStyle,
      sceneControl = {},
      backgroundColor = 0x000000,
      fog = false,
      fogColor = 0x000000,
      camera = {},
      light = {},
      mouseControl = {},
      uvScaleX = 1,
      uvScaleY = 1,
      uvOffsetX = 0,
      uvOffsetY = 0,
      uvRotation = 0
    } = props;

    const mapSourceKey = this.getMapSourceKey(props);

    // 1. 获取 GeoJSON 数据（若 adcode 变更则加载）
    if (mapSourceKey !== this.currentAdcode) {
      await this.loadGeoJsonBySource(props);
      this.currentAdcode = mapSourceKey;
    }

    // 2. 环境初始化或增量更新
    this.syncCurrentProps({
      mapSource: props.mapSource,
      fillType,
      areaColor,
      activeAreaColor: props.activeAreaColor,
      picture,
      activePicture: props.activePicture,
      normalMap,
      normalMapIntensity,
      borderWidth,
      borderColor,
      activeBorderColor: props.activeBorderColor,
      hoverLift: props.hoverLift,
      defaultLiftAdcode: props.defaultLiftAdcode,
      sideGlowColor,
      sideGlowStrength,
      adcode,
      sceneControl,
      uvScaleX,
      uvScaleY,
      uvOffsetX,
      uvOffsetY,
      uvRotation,
      textStyle,
      camera,
      light,
      mouseControl,
      onRegionClick: props.onRegionClick,
      onChildClick: props.onChildClick,
      presetChild: props.presetChild
    });

    const isNewContext = !this.scene || !this.renderer || this.domElement !== Dom || !this.camera;
    if (isNewContext) {
      this.cleanupPreviousRender(Dom);
      await this.createScene({
        backgroundColor,
        fog,
        fogColor
      });
      this.setupRenderer(Dom);
    } else {
      // 增量更新场景设置（背景、雾效）
      await this.updateScene(props);
    }

    // 3. 计算地图尺寸和厚度
    const { mapSize, finalRegionHeight } = this.calculateMapSizeAndHeight(sceneControl.regionHeight);
    this.mapSize = mapSize;
    this.finalRegionHeight = finalRegionHeight;

    // 4. 更新场景控制参数
    const {
      beta,
      autoRotate = false,
      rotateSpeed = 0.01,
      rotateDirection = 1,
      initialRotationAngle = 0,
      mapRotationAngle = 0
    } = sceneControl;

    this.autoRotateEnabled = autoRotate;
    this.rotateSpeed = rotateSpeed;
    this.rotateDirection = rotateDirection;

    // 5. 清理旧的地块几何体
    this.clearMapObjects();

    // 6. 更新当前配置属性
    // 7. 创建新的地图几何体组
    const mapGroup = await this.setupMapGroup(finalRegionHeight, initialRotationAngle, mapRotationAngle, textStyle);
    if (this.scene) {
      this.scene.add(mapGroup);
    }

    // 8. 配置相机、光照和控制器
    if (isNewContext) {
      await this.setupCamera(Dom, mapSize, camera, beta);
      await this.setupLighting(light, finalRegionHeight, mapSize);
      this.setupControls(Dom, mapSize, mouseControl);
      this.setupMouseInteraction(Dom);
      this.startRenderLoop();
      this.setupResizeHandler(Dom);
    } else {
      // 增量更新相机、光照和控制器
      await this.updateCamera(Dom, camera, beta);
      await this.updateLighting(light, finalRegionHeight);
      await this.updateControls(Dom, mouseControl);
    }

    this.onRegionClickCallback = props.onRegionClick;
    this.onChildClickCallback = props.onChildClick;

    // 9. 应用材质
    await this.applyMaterials(mapGroup, {
      fillType,
      areaColor,
      picture,
      normalMap,
      normalMapIntensity,
      borderWidth,
      borderColor,
      uvScaleX,
      uvScaleY,
      uvOffsetX,
      uvOffsetY,
      uvRotation,
      innerShadow: sceneControl.innerShadow
    });

    this.applyConfiguredDefaultLift(true, true);

    this.updateTextLabelsScale();

    // 10. 处理预设子组件
    if (props.presetChild) {
      this.handlePresetChildren(props.presetChild);
    }

    // 11. 初始化后处理
    const bloomConfig = this.currentProps.sceneControl?.bloom || {
      enable: true,
      strength: 0.9,
      radius: 0.25,
      threshold: 0.65,
      sideGlowStrength: 1.6
    };

    if (bloomConfig.enable !== false) {
      this.initPostProcessing(
        Dom.clientWidth || Dom.offsetWidth || 800,
        Dom.clientHeight || Dom.offsetHeight || 600,
        bloomConfig
      );
    } else {
      this.composer = null;
      this.bloomPass = null;
    }
  }

  /**
   * 处理预设子组件 (全量调度中心)
   * @param presetChild 子组件配置列表
   */
  public handlePresetChildren(presetChild: any[]) {
    // 遍历所有预设子组件进行初始化
    presetChild.forEach((child, index) => {
      this.updateChildByType(child.type, child, child.id || child.title || `child_${index}`);
    });
  }

  /**
   * 增量更新单个子组件
   * @param type 组件类型
   * @param config 组件配置
   * @param id 组件唯一标识 (用于区分多个同类型组件)
   */
  public updateChildByType(type: string, config: any, id?: string) {
    const isShow = config.show !== false;
    const data = isShow ? config.data || [] : [];
    const option = config.option || {};
    const finalId = id || config.id || config.title || type;

    switch (type) {
      case "flowLine":
        this.createFlowLines(finalId, data, option);
        break;
      case "mapPath":
        this.createMapPath(finalId, data, option);
        break;
      case "fence":
        this.createFence(finalId, data, option);
        break;
      case "regionOutline":
        this.createRegionOutline(finalId, data, option);
        break;

      case "mapEffectScatter":
        // 预留散点图更新入口
        if ((this as any).createMapScatters) {
          (this as any).createMapScatters(data, option);
        }
        break;
      case "mapGlScatter":
        this.createMapScatter(finalId, data, option);
        break;
      case "colormap":
        this.createColorMap(finalId, data, option);
        break;
      case "heatmap":
        this.createHeatmap(finalId, data, option);
        break;

      case "plane":
        this.createPlane(finalId, isShow, option);
        break;

      case "mapBar":
        this.createMapBar(finalId, data, option);
        break;

      case "mapGlIcon":
        this.createMapGlIcon(finalId, data, option);
        break;

      case "mapScatter":
        this.createMapScatter(finalId, data, option);
        break;

      default:
        console.warn(`未知的子组件类型: ${type}`);
        break;
    }
  }

  /**
   * 初始化后处理效果 (Bloom)
   */
  private initPostProcessing(
    width: number,
    height: number,
    bloomConfig: { strength?: number; radius?: number; threshold?: number; sideGlowStrength?: number } = {}
  ) {
    if (!this.renderer || !this.scene || !this.camera) return;

    // 清理旧的 composer
    if (this.composer) {
      this.composer = null;
    }

    const renderScene = new RenderPass(this.scene, this.camera);

    const { strength = 0.9, radius = 0.25, threshold = 0.65 } = bloomConfig;
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), strength, radius, threshold);
    this.bloomPass = bloomPass;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    // 确保最后一个 pass 将结果输出到屏幕，而不是留在缓冲区
    if (this.composer.passes.length > 0) {
      this.composer.passes[this.composer.passes.length - 1].renderToScreen = true;
    }
  }

  private setupRenderer(Dom: HTMLElement) {
    this.domElement = Dom;
    if (this.renderer) {
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
      this.renderer = null;
    }

    const width = Dom.clientWidth || Dom.offsetWidth || 800;
    const height = Dom.clientHeight || Dom.offsetHeight || 600;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      logarithmicDepthBuffer: false
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearAlpha(0); // 透明
    Dom.appendChild(this.renderer.domElement);

    if (getComputedStyle(Dom).position === "static") {
      Dom.style.position = "relative";
    }

    if (this.css3dRenderer) {
      if (this.css3dRenderer.domElement && this.css3dRenderer.domElement.parentNode) {
        this.css3dRenderer.domElement.parentNode.removeChild(this.css3dRenderer.domElement);
      }
      this.css3dRenderer = null;
    }
    this.css3dRenderer = new CSS3DRenderer();
    this.css3dRenderer.setSize(width, height);
    this.css3dRenderer.domElement.style.position = "absolute";
    this.css3dRenderer.domElement.style.top = "0";
    this.css3dRenderer.domElement.style.left = "0";
    this.css3dRenderer.domElement.style.pointerEvents = "none";
    this.css3dRenderer.domElement.style.width = "100%";
    this.css3dRenderer.domElement.style.height = "100%";
    this.css3dRenderer.domElement.style.zIndex = "10"; // Icons on top
    Dom.appendChild(this.css3dRenderer.domElement);

    if (this.css2dRenderer) {
      if (this.css2dRenderer.domElement && this.css2dRenderer.domElement.parentNode) {
        this.css2dRenderer.domElement.parentNode.removeChild(this.css2dRenderer.domElement);
      }
      this.css2dRenderer = null;
    }
    this.css2dRenderer = new CSS2DRenderer();
    this.css2dRenderer.setSize(width, height);
    this.css2dRenderer.domElement.style.position = "absolute";
    this.css2dRenderer.domElement.style.top = "0";
    this.css2dRenderer.domElement.style.left = "0";
    this.css2dRenderer.domElement.style.pointerEvents = "none";
    this.css2dRenderer.domElement.style.width = "100%";
    this.css2dRenderer.domElement.style.height = "100%";
    this.css2dRenderer.domElement.style.zIndex = "0"; // Text behind icons
    Dom.appendChild(this.css2dRenderer.domElement);
  }

  private setupResizeHandler(Dom: HTMLElement) {
    if ((Dom as any)._resizeObserver) {
      (Dom as any)._resizeObserver.disconnect();
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!this.renderer || !this.camera) return;

      const width = Dom.clientWidth || Dom.offsetWidth;
      const height = Dom.clientHeight || Dom.offsetHeight;
      if (width === 0 || height === 0) return;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
      if (this.css3dRenderer) {
        this.css3dRenderer.setSize(width, height);
      }
      if (this.css2dRenderer) {
        this.css2dRenderer.setSize(width, height);
      }

      if (this.bloomPass) {
        this.bloomPass.resolution.set(width, height);
      }
      if (this.composer) {
        this.composer.setSize(width, height);
      }

      // 更新所有 MeshLine 材质的分辨率
      this.scene?.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh && obj.material && (obj.material as any).isMeshLineMaterial) {
          (obj.material as any).resolution.set(width, height);
        }
      });
    });

    resizeObserver.observe(Dom);
    (Dom as any)._resizeObserver = resizeObserver;
  }

  private startRenderLoop() {
    if (this.animationId) return; // 避免重复启动渲染循环

    const animate = () => {
      if (!this.renderer || !this.scene || !this.camera) {
        this.animationId = null;
        return;
      }

      this.animationId = requestAnimationFrame(animate);

      if (this.controls?.enabled && this.controls.enableDamping) {
        this.controls.update();
      }

      if (this.autoRotateEnabled && this.mapGroup && !this.isDragging && (!this.controls || !this.controls.enabled)) {
        this.mapGroup.rotation.y += this.rotateSpeed * this.rotateDirection;
      }

      // --- 呼吸流光动画逻辑 ---
      this.flowTime += 0.015;
      if (this.outlineFlowMaterial && this.outlineFlowMaterial._isFlow) {
        const mat = this.outlineFlowMaterial;
        // 1. 实现流动：更新虚线偏移
        mat.dashOffset -= 0.001;
        // 2. 实现呼吸：极细微的亮度/透明度震变（0.85 ~ 0.95）
        const breath = Math.sin(this.flowTime * 1.5) * 0.05 + 0.9;
        mat.opacity = breath;
      }

      // --- 飞线动画逻辑 ---
      if (this.flowLineManager) {
        this.flowLineManager.animate();
      }

      if (this.mapPathManager) {
        this.mapPathManager.animate();
      }

      if (this.mapFenceManager) {
        this.mapFenceManager.animate();
      }

      if (this.mapRegionOutlineManager) {
        this.mapRegionOutlineManager.animate();
      }

      if (this.planeManager) {
        this.planeManager.animate();
      }

      if (this.mapGlIconManager) {
        this.mapGlIconManager.animate(this.camera);
      }

      if (this.mapBarManager) {
        this.mapBarManager.animate();
      }

      if (this.mapScatterManager) {
        this.mapScatterManager.animate();
      }

      this.updateTextLabelsScale();

      const bloomEnabled = this.currentProps.sceneControl?.bloom?.enable !== false;
      if (bloomEnabled && this.composer) {
        this.camera.layers.set(0);
        this.composer.render();
        if (this.css3dRenderer && this.scene && this.camera) this.css3dRenderer.render(this.scene, this.camera);
        if (this.css2dRenderer && this.scene && this.camera) this.css2dRenderer.render(this.scene, this.camera);
      } else {
        this.camera.layers.set(0);
        this.renderer.render(this.scene, this.camera);
        if (this.css3dRenderer && this.scene && this.camera) this.css3dRenderer.render(this.scene, this.camera);
        if (this.css2dRenderer && this.scene && this.camera) this.css2dRenderer.render(this.scene, this.camera);
      }
    };
    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * 初始化自定义鼠标控制（当 OrbitControls 不可用时）
   */
  private initCustomControls(
    domElement: HTMLElement,
    mapSize: number,
    mouseControl: { zoomSpeed?: number; panSpeed?: number; rotateSpeed?: number } = {}
  ) {
    if (!this.camera) return;

    this.domElement = domElement;
    this.target.set(this.mapCenter.x, this.mapCenter.y, this.mapCenter.z);

    const zoomSpeed = mouseControl.zoomSpeed !== undefined ? (mouseControl.zoomSpeed / 100) * 0.19 + 0.01 : 0.05;
    const panSpeed = mouseControl.panSpeed !== undefined ? (mouseControl.panSpeed / 100) * 0.0099 + 0.0001 : 0.001;
    const rotateSpeed =
      mouseControl.rotateSpeed !== undefined ? (mouseControl.rotateSpeed / 100) * 0.019 + 0.001 : 0.005;

    const cameraPos = this.camera.position;
    const offset = new THREE.Vector3().subVectors(cameraPos, this.target);
    this.spherical.radius = Math.max(offset.length(), mapSize * 0.8);
    this.spherical.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / this.spherical.radius)));
    this.spherical.theta = Math.atan2(offset.x, offset.z);

    const onMouseDown = (event: MouseEvent) => {
      if (!this.navigationEnabled) {
        return;
      }

      if (this.editorNavigationMode && event.button === 0) {
        return;
      }

      if (this.isOverMap && !this.editorNavigationMode) {
        return;
      }

      event.preventDefault();
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;

      if (event.button === 0) {
        this.isPanning = true;
        this.isDragging = true;
      } else if (event.button === 2) {
        this.isRotating = true;
        this.isDragging = true;
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!this.navigationEnabled) return;
      if (!this.isDragging || !this.camera) return;

      const deltaX = event.clientX - this.lastMouseX;
      const deltaY = event.clientY - this.lastMouseY;

      if (this.isRotating) {
        this.spherical.theta -= deltaX * rotateSpeed;
        this.spherical.phi += deltaY * rotateSpeed;

        const minRadius = mapSize * 0.1;
        const maxRadius = mapSize * 10;
        this.spherical.radius = Math.max(minRadius, Math.min(maxRadius, this.spherical.radius));

        this.updateCameraPosition();
      } else if (this.isPanning) {
        const panVector = new THREE.Vector3();

        const right = new THREE.Vector3();
        right.setFromMatrixColumn(this.camera.matrixWorld, 0);
        right.normalize();

        const up = new THREE.Vector3();
        up.setFromMatrixColumn(this.camera.matrixWorld, 1);
        up.normalize();

        panVector.addScaledVector(right, -deltaX * panSpeed);
        panVector.addScaledVector(up, deltaY * panSpeed);

        this.target.add(panVector);
        this.updateCameraPosition();
      }

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    };

    const onMouseUp = () => {
      this.isDragging = false;
      this.isRotating = false;
      this.isPanning = false;
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const onWheel = (event: WheelEvent) => {
      if (!this.navigationEnabled) return;
      event.preventDefault();
      if (!this.camera) return;

      const delta = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
      this.spherical.radius *= delta;

      const minRadius = mapSize * 0.1;
      const maxRadius = mapSize * 10;
      this.spherical.radius = Math.max(minRadius, Math.min(maxRadius, this.spherical.radius));

      this.updateCameraPosition();
    };

    domElement.addEventListener("mousedown", onMouseDown);
    domElement.addEventListener("mousemove", onMouseMove);
    domElement.addEventListener("mouseup", onMouseUp);
    domElement.addEventListener("mouseleave", onMouseUp);
    domElement.addEventListener("contextmenu", onContextMenu);
    domElement.addEventListener("wheel", onWheel, { passive: false });

    (domElement as any)._customControlsHandlers = {
      mousedown: onMouseDown,
      mousemove: onMouseMove,
      mouseup: onMouseUp,
      mouseleave: onMouseUp,
      contextmenu: onContextMenu,
      wheel: onWheel
    };
  }

  /**
   * 更新相机位置（基于球面坐标）
   */
  private updateCameraPosition() {
    if (!this.camera) return;

    const x = this.target.x + this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);
    const y = this.target.y + this.spherical.radius * Math.cos(this.spherical.phi);
    const z = this.target.z + this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
    this.emitViewChange();
  }

  /**
   * 增量更新：更新材质和颜色
   */
  async updateMaterials(props: startProps): Promise<void> {
    if (!this.mapGroup || !this.scene) return;

    const previousDefaultLiftAdcode = String(this.currentProps.defaultLiftAdcode || "");

    const {
      fillType = "color",
      areaColor = "#171a24",
      picture,
      normalMap,
      normalMapIntensity,
      uvScaleX = 1,
      uvScaleY = 1,
      uvOffsetX = 0,
      uvOffsetY = 0,
      uvRotation = 0,
      borderWidth = 0,
      borderColor = "#ffffff",
      activeAreaColor,
      activePicture,
      activeBorderColor,
      defaultLiftAdcode,
      sideGlowColor,
      sideGlowStrength
    } = props;

    this.syncCurrentProps({
      mapSource: props.mapSource,
      fillType,
      areaColor,
      activeAreaColor,
      sideGlowColor,
      sideGlowStrength,
      picture,
      activePicture,
      defaultLiftAdcode,
      normalMap,
      normalMapIntensity,
      uvScaleX,
      uvScaleY,
      uvOffsetX,
      uvOffsetY,
      uvRotation,
      borderWidth,
      borderColor,
      activeBorderColor
    });

    this.syncUVReferenceBounds(this.calculateBounds(), this.currentProps);
    this.updateAllUVs();

    await this.applyMaterials(this.mapGroup, {
      fillType,
      areaColor,
      picture,
      normalMap,
      normalMapIntensity,
      uvScaleX,
      uvScaleY,
      uvOffsetX,
      uvOffsetY,
      uvRotation,
      borderWidth,
      borderColor,
      innerShadow: props.sceneControl?.innerShadow
    });

    this.mapColorMapManager?.reapply(
      {
        mapMeshes: this.mapMeshes,
        meshOriginalMaterial: this.meshOriginalMaterial
      },
      true
    );

    this.mapClusteringHeatManager?.reapply(this.getHeatmapContext());

    const nextDefaultLiftAdcode = String(this.currentProps.defaultLiftAdcode || "");
    this.applyConfiguredDefaultLift(
      Boolean(nextDefaultLiftAdcode),
      previousDefaultLiftAdcode !== nextDefaultLiftAdcode
    );
  }

  /**
   * 增量更新：更新文字标签
   */
  async updateTextLabels(textStyle?: TextStyle): Promise<void> {
    if (!this.mapGroup) return;

    if (!textStyle || !textStyle.fontSize || textStyle.fontSize <= 0) {
      this.css2dLabelMap.forEach((obj) => {
        obj.visible = false;
      });
      return;
    }

    this.css2dLabelMap.forEach((obj) => obj.removeFromParent());
    this.css2dLabelMap.clear();

    this.addTextLabels(this.mapGroup, textStyle, 0);
  }

  /**
   * 增量更新：更新网格（厚度、adcode变化）
   */
  async updateGeometry(Dom: HTMLElement, props: startProps): Promise<void> {
    if (!this.scene) return;

    const { adcode, sceneControl = {}, textStyle } = props;
    const { regionHeight, initialRotationAngle = 0, mapRotationAngle = 0 } = sceneControl;
    const mapSourceKey = this.getMapSourceKey(props);

    this.syncCurrentProps({
      mapSource: props.mapSource,
      adcode,
      fillType: props.fillType,
      areaColor: props.areaColor,
      activeAreaColor: props.activeAreaColor,
      picture: props.picture,
      activePicture: props.activePicture,
      normalMap: props.normalMap,
      normalMapIntensity: props.normalMapIntensity,
      borderWidth: props.borderWidth,
      borderColor: props.borderColor,
      activeBorderColor: props.activeBorderColor,
      hoverLift: props.hoverLift,
      defaultLiftAdcode: props.defaultLiftAdcode,
      sideGlowColor: props.sideGlowColor,
      sideGlowStrength: props.sideGlowStrength,
      sceneControl,
      uvScaleX: props.uvScaleX,
      uvScaleY: props.uvScaleY,
      uvOffsetX: props.uvOffsetX,
      uvOffsetY: props.uvOffsetY,
      uvRotation: props.uvRotation,
      textStyle
    });

    if (mapSourceKey !== this.currentAdcode) {
      await this.loadGeoJsonBySource(props);
      this.currentAdcode = mapSourceKey;
    }

    const { mapSize, finalRegionHeight } = this.calculateMapSizeAndHeight(regionHeight);
    this.mapSize = mapSize;

    if (this.mapGroup) {
      this.scene.remove(this.mapGroup);
      this.mapMeshes.forEach((mesh) => {
        mesh.traverse((obj: THREE.Object3D) => {
          if (obj === mesh) return;
          const anyObj = obj as any;
          if (anyObj.geometry) anyObj.geometry.dispose();
          if (anyObj.material) {
            if (Array.isArray(anyObj.material)) {
              anyObj.material.forEach((mat: THREE.Material) => mat.dispose());
            } else {
              anyObj.material.dispose();
            }
          }
        });
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat: THREE.Material) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      this.mapMeshes = [];
    }

    this.css2dLabelMap.forEach((obj) => obj.removeFromParent());
    this.css2dLabelMap.clear();
    this.meshBorderMap.clear();
    this.meshOriginalMaterial.clear();
    this.meshOriginalBorderMaterial.clear();
    this.meshTopGlowLineMap.clear();
    this.meshOriginalTopGlowLineMaterials.clear();
    this.meshOriginalPosition.clear();
    this.meshOriginalHeight.clear();
    this.meshOriginalGeometry.clear();
    this.meshOriginalShapes.clear();
    this.meshOriginalGeometryParams.clear();
    this.materialCache.clear();

    const mapGroup = await this.setupMapGroup(finalRegionHeight, initialRotationAngle, mapRotationAngle, textStyle);
    if (this.scene) {
      this.scene.add(mapGroup);
    }

    const {
      fillType = "color",
      areaColor = "#171a24",
      picture,
      normalMap,
      normalMapIntensity,
      uvScaleX = 1,
      uvScaleY = 1,
      uvOffsetX = 0,
      uvOffsetY = 0,
      uvRotation = 0,
      borderWidth = 0,
      borderColor = "#ffffff"
    } = props;
    await this.applyMaterials(mapGroup, {
      fillType,
      areaColor,
      picture,
      normalMap,
      normalMapIntensity,
      uvScaleX,
      uvScaleY,
      uvOffsetX,
      uvOffsetY,
      uvRotation,
      borderWidth,
      borderColor
    });

    this.applyConfiguredDefaultLift(true, true);
  }

  /**
   * 增量更新：更新相机
   */
  async updateCamera(Dom: HTMLElement, camera?: startProps["camera"], beta?: number): Promise<void> {
    if (!this.camera || !this.scene) return;

    const mapSize = this.mapSize || 1;
    const oldCamera = this.camera;
    await this.setupCamera(Dom, mapSize, camera, beta);

    // 如果相机实例发生变化，同步更新控制器和后处理
    if (oldCamera !== this.camera && this.camera) {
      if (this.controls) {
        this.controls.object = this.camera;
      }
      if (this.composer) {
        this.composer.passes.forEach((pass: any) => {
          if (pass instanceof RenderPass) {
            pass.camera = this.camera!;
          }
        });
      }
    }

    this.updateTextLabelsScale();
  }

  /**
   * 增量更新：更新光照
   */
  async updateLighting(light?: startProps["light"], regionHeight?: number): Promise<void> {
    if (!this.scene) return;

    const lightsToRemove: THREE.Light[] = [];
    this.scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Light) {
        lightsToRemove.push(child);
      }
    });
    lightsToRemove.forEach((light) => {
      this.scene!.remove(light);
      if (light instanceof THREE.DirectionalLight || light instanceof THREE.PointLight) {
        light.dispose();
      }
    });

    const finalRegionHeight = regionHeight !== undefined ? regionHeight : this.mapSize * 0.01;
    await this.setupLighting(light, finalRegionHeight, this.mapSize);
  }

  /**
   * 增量更新：更新控制器
   */
  async updateControls(Dom: HTMLElement, mouseControl?: startProps["mouseControl"]): Promise<void> {
    if (!this.camera || !this.renderer) return;

    const mapSize = this.mapSize || 1;

    if (this.controls) {
      // 确保控制器使用的是当前相机
      if (this.controls.object !== this.camera) {
        this.controls.object = this.camera;
      }
      const internalZoomSpeed =
        mouseControl?.zoomSpeed !== undefined ? (mouseControl.zoomSpeed / 100) * 0.19 + 0.01 : 0.05;
      const internalPanSpeed =
        mouseControl?.panSpeed !== undefined ? (mouseControl.panSpeed / 100) * 0.0099 + 0.0001 : 0.001;
      const internalRotateSpeed =
        mouseControl?.rotateSpeed !== undefined ? (mouseControl.rotateSpeed / 100) * 0.019 + 0.001 : 0.005;

      this.controls.rotateSpeed = internalRotateSpeed * 40;
      this.controls.zoomSpeed = internalZoomSpeed * 20;
      this.controls.panSpeed = internalPanSpeed * 1000;
    } else {
      this.initCustomControls(Dom, mapSize, mouseControl);
    }
  }

  /**
   * 增量更新：更新场景（背景色、雾效）
   */
  async updateScene(props: startProps): Promise<void> {
    if (!this.scene) return;

    const { backgroundColor = 0x000000, fog = false, fogColor = 0x000000, sceneControl = {} } = props;

    this.scene.background = new THREE.Color(backgroundColor);
    if (fog) {
      this.scene.fog = new THREE.Fog(fogColor, 1, 1000);
    } else {
      this.scene.fog = null;
    }

    // 增量更新后处理参数
    const bloomConfig = sceneControl.bloom;
    if (this.bloomPass && bloomConfig) {
      if (bloomConfig.strength !== undefined) this.bloomPass.strength = bloomConfig.strength;
      if (bloomConfig.radius !== undefined) this.bloomPass.radius = bloomConfig.radius;
      if (bloomConfig.threshold !== undefined) this.bloomPass.threshold = bloomConfig.threshold;
    } else if (bloomConfig?.enable && !this.composer && this.renderer) {
      // 如果原本没开启但现在开启了，则初始化
      const width = this.domElement?.clientWidth || 800;
      const height = this.domElement?.clientHeight || 600;
      this.initPostProcessing(width, height, bloomConfig);
    }
  }

  /**
   * 增量更新：更新场景控制（旋转相关）
   */
  async updateSceneControl(sceneControl?: startProps["sceneControl"]): Promise<void> {
    if (!sceneControl) return;

    const { autoRotate = false, rotateSpeed = 0.01, rotateDirection = 1, bloom, innerShadow } = sceneControl;

    this.autoRotateEnabled = autoRotate;
    this.rotateSpeed = rotateSpeed;
    this.rotateDirection = rotateDirection;

    // 更新存储的配置
    if (!this.currentProps.sceneControl) {
      this.currentProps.sceneControl = {};
    }
    Object.assign(this.currentProps.sceneControl, sceneControl);

    // 增量更新内阴影
    if (innerShadow) {
      this.updateInnerShadowTexture(innerShadow);

      this.mapMeshes.forEach((mesh) => {
        // 在 geojsonMapInstance 中，顶面材质通常是第 0 个或唯一的材质
        const topMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (topMat && topMat.userData.innerShadowMap) {
          topMat.userData.innerShadowMap.value = this.innerShadowTexture;
          topMat.userData.innerShadowColor.value.set(innerShadow.color || "#000000");
          topMat.userData.innerShadowOpacity.value = innerShadow.opacity !== undefined ? innerShadow.opacity : 1.0;
          topMat.needsUpdate = true;
        }
      });
    }

    // 更新 Bloom 配置
    if (bloom) {
      if (bloom.enable && !this.composer) {
        // 启用 Bloom
        if (this.renderer) {
          const { width, height } = this.renderer.domElement.getBoundingClientRect();
          this.initPostProcessing(width, height, bloom);
        }
      } else if (bloom.enable === false && this.composer) {
        // 禁用 Bloom
        this.composer = null;
        this.bloomPass = null;
      } else if (this.bloomPass) {
        // 更新参数
        if (bloom.strength !== undefined) this.bloomPass.strength = bloom.strength;
        if (bloom.radius !== undefined) this.bloomPass.radius = bloom.radius;
        if (bloom.threshold !== undefined) this.bloomPass.threshold = bloom.threshold;
      }

      // 更新侧面辉光强度
      if (bloom.sideGlowStrength !== undefined) {
        this.mapMeshes.forEach((mesh) => {
          if (Array.isArray(mesh.material)) {
            const sideMat = mesh.material[1] as THREE.ShaderMaterial;
            if (sideMat && sideMat.uniforms && sideMat.uniforms.uSideGlowStrength) {
              sideMat.uniforms.uSideGlowStrength.value = bloom.sideGlowStrength;
            }
          }
        });
      }
    }
  }

  /**
   * 设置地图盒子 DOM 挂载
   * @param element - 组件根 DOM 元素数组
   * @param componentId - 组件 ID
   * @param boxOffsetX - X 轴偏移
   * @param boxOffsetY - Y 轴偏移
   */
  setMapBoxBom(element: any, componentId: string, boxOffsetX: number, boxOffsetY: number): void {
    if (!this.mapGroup || !this.scene || !element || !this.mapGlIconManager) return;

    this.mapGlIconManager.mountDom(componentId, {
      element,
      boxOffsetX,
      boxOffsetY
    });
  }

  /**
   * 切换地图标牌子组件选中状态
   */
  setMapGlIconActive(options: MapGlIconActiveOptions): boolean {
    if (!this.mapGlIconManager) return false;
    return this.mapGlIconManager.setIconActiveByField(options);
  }

  /**
   * 清理资源
   */
  dispose() {
    this.css2dLabelMap.forEach((obj) => obj.removeFromParent());
    this.css2dLabelMap.clear();
    this.meshBorderMap.clear();
    this.meshOriginalMaterial.clear();
    this.meshOriginalBorderMaterial.clear();
    this.meshTopGlowLineMap.clear();
    this.meshOriginalTopGlowLineMaterials.clear();
    this.meshOriginalPosition.clear();
    this.meshOriginalHeight.clear();
    this.meshOriginalGeometry.clear();
    this.meshOriginalShapes.clear();
    this.meshOriginalGeometryParams.clear();
    this.meshLiftAnimation.forEach((animationId) => {
      cancelAnimationFrame(animationId);
    });
    this.meshLiftAnimation.clear();
    this.hoveredMesh = null;

    if (this.domElement && (this.domElement as any)._mouseInteractionHandlers) {
      const handlers = (this.domElement as any)._mouseInteractionHandlers;
      this.domElement.removeEventListener("mousemove", handlers.mousemove);
      this.domElement.removeEventListener("mouseenter", handlers.mouseenter);
      this.domElement.removeEventListener("mouseleave", handlers.mouseleave);
      this.domElement.removeEventListener("click", handlers.click);
      this.domElement.removeEventListener("dblclick", handlers.dblclick);
      this.domElement.removeEventListener("contextmenu", handlers.contextmenu);
      delete (this.domElement as any)._mouseInteractionHandlers;
    }

    if (this.renderer && (this.renderer.domElement as any)._orbitControlsHandlers) {
      const handlers = (this.renderer.domElement as any)._orbitControlsHandlers;
      this.renderer.domElement.removeEventListener("mousedown", handlers.mousedown);
      this.renderer.domElement.removeEventListener("mouseup", handlers.mouseup);
      delete (this.renderer.domElement as any)._orbitControlsHandlers;
    }

    if (this.controls) {
      this.controls.removeEventListener("change", this.handleOrbitControlsChange);
      this.controls.dispose();
      this.controls = null;
    }

    if (this.domElement && (this.domElement as any)._customControlsHandlers) {
      const handlers = (this.domElement as any)._customControlsHandlers;
      this.domElement.removeEventListener("mousedown", handlers.mousedown);
      this.domElement.removeEventListener("mousemove", handlers.mousemove);
      this.domElement.removeEventListener("mouseup", handlers.mouseup);
      this.domElement.removeEventListener("mouseleave", handlers.mouseleave);
      this.domElement.removeEventListener("contextmenu", handlers.contextmenu);
      this.domElement.removeEventListener("wheel", handlers.wheel);
      delete (this.domElement as any)._customControlsHandlers;
      this.domElement = null;
    }

    if (this.domElement && (this.domElement as any)._resizeObserver) {
      (this.domElement as any)._resizeObserver.disconnect();
      delete (this.domElement as any)._resizeObserver;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    const disposeMaterial = (material: THREE.Material | THREE.Material[]) => {
      if (!material) return;
      const mats = Array.isArray(material) ? material : [material];
      mats.forEach((m: any) => {
        if (m.map) {
          if (m.map instanceof THREE.VideoTexture && m.map.image instanceof HTMLVideoElement) {
            const video = m.map.image;
            video.pause();
            video.src = "";
            video.load();
          }
          m.map.dispose();
        }
        m.dispose();
      });
    };

    if (this.mapClusteringHeatManager) {
      this.mapClusteringHeatManager.dispose(this.getHeatmapContext());
      this.mapClusteringHeatManager = null;
    }

    this.mapMeshes.forEach((mesh) => {
      mesh.traverse((obj: THREE.Object3D) => {
        if (obj === mesh) return;
        const anyObj = obj as any;
        if (anyObj.geometry) anyObj.geometry.dispose();
        if (anyObj.material) {
          disposeMaterial(anyObj.material);
        }
      });
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        disposeMaterial(mesh.material);
      }
    });
    this.mapMeshes = [];
    if (this.flowLineManager) {
      this.flowLineManager.dispose();
      this.flowLineManager = null;
    }
    if (this.mapPathManager) {
      this.mapPathManager.dispose();
      this.mapPathManager = null;
    }
    if (this.mapFenceManager) {
      this.mapFenceManager.dispose();
      this.mapFenceManager = null;
    }
    if (this.mapRegionOutlineManager) {
      this.mapRegionOutlineManager.dispose();
      this.mapRegionOutlineManager = null;
    }
    if (this.planeManager) {
      this.planeManager.dispose();
      this.planeManager = null;
    }
    if (this.mapGlIconManager) {
      this.mapGlIconManager.dispose();
      this.mapGlIconManager = null;
    }
    if (this.mapBarManager) {
      this.mapBarManager.dispose();
      this.mapBarManager = null;
    }
    if (this.mapColorMapManager) {
      this.mapColorMapManager.dispose();
      this.mapColorMapManager = null;
    }
    if (this.mapScatterManager) {
      this.mapScatterManager.dispose();
      this.mapScatterManager = null;
    }
    this.materialCache.forEach((material) => {
      disposeMaterial(material);
    });
    this.materialCache.clear();
    if (window.location.href.includes("build")) {
      this.uvReferenceBounds = null;
      this.textureReferenceBounds = null;
      this.textureReferenceKey = "";
      this.textureReferenceSourceKey = "";
      this.textureReferenceAdcode = "";
      this.textureReferenceProvider = "";
      this.textureReferenceUsesWorldWrap = false;
      this.textureReferenceIsGlobalWorld = false;
      this.uvOffset.set(0, 0);
      this.uvScale.set(1, 1);
    }
    this.currentProjectionParams = null;
    this.scene = null;
    this.camera = null;
    this.mapGroup = null;
    if (this.css2dRenderer) {
      if (this.css2dRenderer.domElement && this.css2dRenderer.domElement.parentNode) {
        this.css2dRenderer.domElement.parentNode.removeChild(this.css2dRenderer.domElement);
      }
      this.css2dRenderer = null; // No dispose method on CSS2DRenderer in standard three.js (unlike WebGLRenderer) but good to nullify
    }
  }
}
