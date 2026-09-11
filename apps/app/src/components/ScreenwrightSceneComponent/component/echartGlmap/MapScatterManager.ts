import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { setMinioUrl } from "@/utils/config";

import { getPointByProj4 } from "../echartcommonMap/utils";

export interface ScatterData {
  lng?: number;
  lat?: number;
  city?: string;
  adcode?: number | string;
  value?: number;
  [key: string]: any;
}

export interface ScatterOption {
  /** Model URL */
  model?: string;
  /** Position offset [x, y, z] */
  offset?: [number, number, number];
  /** Rotation around each axis in degrees [x, y, z] */
  rotation?: [number, number, number];
  /** Scale [x, y, z] */
  scale?: [number, number, number];
  /** Opacity 0-100 */
  opacity?: number;
}

export class MapScatterManager {
  private scene: THREE.Scene;
  private scatterMap: Map<string, THREE.Group> = new Map();
  private modelCache: Map<string, { scene: THREE.Group; animations: THREE.AnimationClip[] }> = new Map();
  private mixerMap: Map<string, THREE.AnimationMixer[]> = new Map();
  private requestTokenMap: Map<string, symbol> = new Map();
  private loader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private clock: THREE.Clock = new THREE.Clock();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();

    // Configure Draco loader
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(`${setMinioUrl("version-test/assets/public/draco/")}`); // Based on public/draco/ structure
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  /**
   * Load model from URL (with caching)
   */
  private async loadModel(url: string): Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] } | null> {
    if (this.modelCache.has(url)) {
      const cached = this.modelCache.get(url)!;
      return { scene: cached.scene.clone() as THREE.Group, animations: cached.animations };
    }

    try {
      const fullUrl = setMinioUrl(url);
      const gltf = await this.loader.loadAsync(fullUrl);
      const model = gltf.scene;
      const animations = gltf.animations;
      this.modelCache.set(url, { scene: model, animations });
      return { scene: model.clone() as THREE.Group, animations };
    } catch (error) {
      console.error("Failed to load model:", url, error);
      return null;
    }
  }

  /**
   * Update scatter points
   */
  public async update(
    id: string,
    data: ScatterData[],
    option: ScatterOption,
    mapParams: {
      centerX: number;
      centerY: number;
      scale: number;
      baseHeight: number;
      mapGroup: THREE.Group | null;
      mapSize: number;
    }
  ): Promise<void> {
    this.remove(id);

    if (!data || data.length === 0) return;

    const requestToken = Symbol(id);
    this.requestTokenMap.set(id, requestToken);

    const {
      model = "",
      offset = [0, 0, 0],
      rotation = [0, 0, 0],
      scale: modelScale = [1, 1, 1],
      opacity = 100
    } = option;

    // Load model once
    let modelTemplate: { scene: THREE.Group; animations: THREE.AnimationClip[] } | null = null;
    if (model) {
      modelTemplate = await this.loadModel(model);
    }

    if (this.requestTokenMap.get(id) !== requestToken) {
      return;
    }

    // Only render if model is available
    if (!modelTemplate) {
      this.requestTokenMap.delete(id);
      return;
    }

    const scatterGroup = new THREE.Group();
    scatterGroup.name = `scatterGroup_${id}`;
    this.scatterMap.set(id, scatterGroup);

    if (mapParams.mapGroup) {
      mapParams.mapGroup.add(scatterGroup);
    } else {
      this.scene.add(scatterGroup);
    }

    const { centerX, centerY, scale, baseHeight, mapSize } = mapParams;
    const unitScale = mapSize * 0.003;

    for (const item of data) {
      if (item.lng === undefined || item.lat === undefined) continue;

      const p = getPointByProj4([item.lng, item.lat]);
      const x = (p[0] - centerX) * scale;
      const y = (p[1] - centerY) * scale;

      // Clone model
      const obj = modelTemplate.scene.clone();

      // Play default animation
      if (modelTemplate.animations && modelTemplate.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(obj);
        const action = mixer.clipAction(modelTemplate.animations[0]);
        action.play();

        if (!this.mixerMap.has(id)) {
          this.mixerMap.set(id, []);
        }
        this.mixerMap.get(id)!.push(mixer);
      }

      // Apply scale
      const scaleMultiplier = unitScale;
      obj.scale.set(modelScale[0] * scaleMultiplier, modelScale[1] * scaleMultiplier, modelScale[2] * scaleMultiplier);

      // Apply rotation (convert degrees to radians)
      // Base rotation 90 deg on X to be perpendicular to ground
      obj.rotation.set(
        THREE.MathUtils.degToRad(rotation[0] + 90),
        THREE.MathUtils.degToRad(rotation[1]),
        THREE.MathUtils.degToRad(rotation[2])
      );

      // Apply position with offset
      const posZ = baseHeight + offset[2] * unitScale;
      obj.position.set(x + offset[0] * unitScale, y + offset[1] * unitScale, posZ);

      // Store metadata
      obj.userData = {
        city: item.city,
        adcode: item.adcode,
        value: item.value,
        baseZ: posZ
      };

      // Apply opacity to all meshes
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          // child.receiveShadow = true;
          // child.castShadow = true;
          child.renderOrder = 10;
          if (opacity < 100) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              mat.transparent = true;
              mat.opacity = opacity / 100;
            });
          }
        }
      });

      scatterGroup.add(obj);
    }
  }

  private matchesRegionCode(targetCode: string, hoveredCode: string) {
    if (!targetCode || !hoveredCode) {
      return false;
    }

    const isChinaRegion = /^\d{6}$/.test(targetCode) && /^\d{6}$/.test(hoveredCode);
    if (isChinaRegion) {
      if (hoveredCode.endsWith("0000")) {
        return targetCode.slice(0, 2) === hoveredCode.slice(0, 2);
      }
      if (hoveredCode.endsWith("00")) {
        return targetCode.slice(0, 4) === hoveredCode.slice(0, 4);
      }
    }

    return targetCode === hoveredCode;
  }

  /**
   * Lift scatter points by adcode
   */
  public liftScatters(adcode: string, offset: number): void {
    this.scatterMap.forEach((group) => {
      group.children.forEach((obj) => {
        const objAdcode = String(obj.userData?.adcode || "");
        if (this.matchesRegionCode(objAdcode, String(adcode || ""))) {
          const baseZ = obj.userData.baseZ || 0;
          obj.position.z = baseZ + offset;
        }
      });
    });
  }

  /**
   * Restore scatter points by adcode
   */
  public restoreScatters(adcode: string): void {
    this.scatterMap.forEach((group) => {
      group.children.forEach((obj) => {
        const objAdcode = String(obj.userData?.adcode || "");
        if (this.matchesRegionCode(objAdcode, String(adcode || ""))) {
          const baseZ = obj.userData.baseZ || 0;
          obj.position.z = baseZ;
        }
      });
    });
  }

  /**
   * Remove scatter group by id
   */
  public remove(id: string): void {
    this.requestTokenMap.delete(id);

    const group = this.scatterMap.get(id);
    if (group) {
      if (group.parent) {
        group.parent.remove(group);
      }
      group.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((m: any) => m.dispose());
        }
      });
      this.scatterMap.delete(id);
    }

    // Remove mixers
    if (this.mixerMap.has(id)) {
      this.mixerMap.delete(id);
    }
  }

  /**
   * Animate scatter points
   */
  public animate(): void {
    const delta = this.clock.getDelta();
    this.mixerMap.forEach((mixers) => {
      mixers.forEach((mixer) => mixer.update(delta));
    });
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    this.scatterMap.forEach((_, id) => {
      this.remove(id);
    });
    this.scatterMap.clear();
    this.modelCache.clear();
    this.mixerMap.clear();
    this.requestTokenMap.clear();
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
  }
}
