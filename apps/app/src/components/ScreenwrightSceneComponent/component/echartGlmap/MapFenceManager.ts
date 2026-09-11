import * as THREE from "three";

import { setMinioUrl } from "@/utils/config";

import {
  buildWallGeometry,
  createGradientTexture,
  getBlendingMode,
  getColorString,
  getNormalizedOpacity,
  getNumericValue,
  projectLngLatToWorld,
  resolveFenceLngLatLists
} from "./MapChildRenderUtils";

export interface FenceData {
  name?: string;
  adcode?: string | number;
  points?: any[];
  coords?: any[];
  coordinates?: any[];
  closed?: boolean;
  [key: string]: any;
}

export interface FenceOption {
  height?: number;
  offsetZ?: number;
  fillType?: "gradient" | "picture";
  fillColor?: any;
  fillOpacity?: number;
  textureUrl?: string;
  tintColor?: any;
  tintOpacity?: number;
  blendingMode?: "NormalBlending" | "AdditiveBlending" | "SubtractiveBlending" | "MultiplyBlending";
  lineShow?: boolean;
  lineColor?: any;
  lineOpacity?: number;
  lineWidth?: number;
  animationDuration?: number;
  animationInterval?: number;
}

interface FenceAnimateState {
  material: THREE.ShaderMaterial;
  lineWidth: number;
  duration: number;
  interval: number;
  pauseTimer: number;
  paused: boolean;
  enabled: boolean;
}

const fenceVertexShader = `
#include <common>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>

varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <fog_vertex>
}
`;

const fenceFragmentShader = `
#include <common>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>

varying vec2 vUv;

uniform sampler2D uBaseMap;
uniform float uOpacity;
uniform float uScanY;
uniform float uScanWidth;
uniform vec3 uScanColor;
uniform float uScanOpacity;
uniform vec3 uTintColor;

void main() {
  vec2 uv = vec2(vUv.x, clamp(vUv.y, 0.0, 1.0));
  vec4 baseColor = texture2D(uBaseMap, uv);
  baseColor.rgb *= uTintColor;
  baseColor.a *= clamp(uOpacity, 0.0, 1.0);

  float lineTransitionWidth = 0.01;
  float scanAlpha = min(
    smoothstep(uScanY, uScanY + lineTransitionWidth, vUv.y),
    1.0 - smoothstep(uScanY + uScanWidth, uScanY + uScanWidth + lineTransitionWidth, vUv.y)
  ) * clamp(uScanOpacity, 0.0, 1.0);

  vec3 color = mix(baseColor.rgb, uScanColor, scanAlpha);
  float alpha = max(baseColor.a, scanAlpha);

  if (alpha <= 0.001) {
    discard;
  }

  gl_FragColor = vec4(color, alpha);

  #include <logdepthbuf_fragment>
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

export class MapFenceManager {
  private scene: THREE.Scene;
  private fenceMap: Map<string, THREE.Group> = new Map();
  private animateMap: Map<string, FenceAnimateState[]> = new Map();
  private clock: THREE.Clock = new THREE.Clock();
  private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public update(
    id: string,
    data: FenceData[],
    option: FenceOption,
    mapParams: {
      centerX: number;
      centerY: number;
      scale: number;
      baseHeight: number;
      mapSize: number;
      mapGroup: THREE.Group | null;
      geoJson?: any;
    }
  ): void {
    this.remove(id);

    if (!Array.isArray(data) || data.length === 0) {
      return;
    }

    const group = new THREE.Group();
    group.name = `fenceGroup_${id}`;
    group.renderOrder = 303;
    this.fenceMap.set(id, group);

    if (mapParams.mapGroup) {
      mapParams.mapGroup.add(group);
    } else {
      this.scene.add(group);
    }

    const animateStates: FenceAnimateState[] = [];
    this.animateMap.set(id, animateStates);

    const height = Math.max(0.001, getNumericValue(option.height, 60) * (mapParams.mapSize || 1) * 0.002);
    const offsetZ = getNumericValue(option.offsetZ, 0) * (mapParams.mapSize || 1) * 0.0006;
    const fillType = option.fillType === "picture" ? "picture" : "gradient";
    const fillOpacity = getNormalizedOpacity(option.fillOpacity, 100);
    const tintOpacity = getNormalizedOpacity(option.tintOpacity, 100);
    const tintColor = new THREE.Color(getColorString(option.tintColor, "#ffffff"));
    const lineShow = option.lineShow !== false;
    const lineOpacity = lineShow ? getNormalizedOpacity(option.lineOpacity, 100) : 0;
    const lineWidth = THREE.MathUtils.clamp(getNumericValue(option.lineWidth, 0.08), 0.001, 1);
    const animationDuration = Math.max(0.2, getNumericValue(option.animationDuration, 2.2));
    const animationInterval = Math.max(0, getNumericValue(option.animationInterval, 0.8));
    const scanColor = new THREE.Color(getColorString(option.lineColor, "#ffffff"));
    const blending = getBlendingMode(option.blendingMode || "AdditiveBlending");

    data.forEach((item, index) => {
      const lineLists = resolveFenceLngLatLists(item, mapParams.geoJson);
      if (!lineLists.length) {
        return;
      }

      lineLists.forEach((linePoints, lineIndex) => {
        if (linePoints.length < 2) {
          return;
        }

        const worldPoints = linePoints.map((point) =>
          projectLngLatToWorld(point, mapParams, offsetZ + index * 0.00001 + lineIndex * 0.000001)
        );
        const geometry = buildWallGeometry(worldPoints, height, item.closed !== false);
        if (!geometry) {
          return;
        }

        const baseTexture = this.createBaseTexture(fillType, option);
        baseTexture.wrapS = THREE.RepeatWrapping;
        baseTexture.wrapT = THREE.ClampToEdgeWrapping;
        baseTexture.needsUpdate = true;

        const material = new THREE.ShaderMaterial({
          uniforms: {
            uBaseMap: { value: baseTexture },
            uOpacity: { value: fillType === "picture" ? fillOpacity * tintOpacity : fillOpacity },
            uScanY: { value: -lineWidth },
            uScanWidth: { value: lineWidth },
            uScanColor: { value: scanColor },
            uScanOpacity: { value: lineOpacity },
            uTintColor: { value: fillType === "picture" ? tintColor : new THREE.Color("#ffffff") }
          },
          vertexShader: fenceVertexShader,
          fragmentShader: fenceFragmentShader,
          transparent: true,
          depthWrite: false,
          depthTest: true,
          side: THREE.DoubleSide,
          blending,
          toneMapped: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `fence_${id}_${index}_${lineIndex}`;
        mesh.renderOrder = 303;
        mesh.userData = {
          ...item,
          baseZ: mapParams.baseHeight + offsetZ
        };
        group.add(mesh);

        animateStates.push({
          material,
          lineWidth,
          duration: animationDuration,
          interval: animationInterval,
          pauseTimer: 0,
          paused: false,
          enabled: lineShow && lineOpacity > 0
        });
      });
    });
  }

  public animate(): void {
    const delta = this.clock.getDelta();

    this.animateMap.forEach((states) => {
      states.forEach((state) => {
        if (!state.enabled) {
          return;
        }

        if (state.paused) {
          state.pauseTimer -= delta;
          if (state.pauseTimer <= 0) {
            state.pauseTimer = 0;
            state.paused = false;
            state.material.uniforms.uScanY.value = -state.lineWidth;
          }
          return;
        }

        state.material.uniforms.uScanY.value += delta / state.duration;
        if (state.material.uniforms.uScanY.value > 1) {
          state.paused = true;
          state.pauseTimer = state.interval;
        }
      });
    });
  }

  public remove(id: string): void {
    const group = this.fenceMap.get(id);
    if (group) {
      if (group.parent) {
        group.parent.remove(group);
      }
      group.traverse((obj: any) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((material: any) => {
            const baseMap = material.uniforms?.uBaseMap?.value;
            disposeTexture(baseMap);
            material.dispose();
          });
        }
      });
      this.fenceMap.delete(id);
    }

    this.animateMap.delete(id);
  }

  public dispose(): void {
    Array.from(this.fenceMap.keys()).forEach((id) => this.remove(id));
    this.fenceMap.clear();
    this.animateMap.clear();
  }

  private createBaseTexture(fillType: "gradient" | "picture", option: FenceOption): THREE.Texture {
    if (fillType === "picture" && option.textureUrl) {
      const url = setMinioUrl(option.textureUrl);
      const isVideo = /\.(mp4|webm|ogv)(\?.*)?$/i.test(url);

      if (isVideo) {
        const video = document.createElement("video");
        video.src = url;
        video.loop = true;
        video.muted = true;
        video.autoplay = true;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.crossOrigin = "anonymous";
        video.play().catch(() => undefined);

        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      }

      const texture = this.textureLoader.load(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }

    return createGradientTexture(option.fillColor, ["rgba(16,56,83,0.05)", "rgba(38,196,255,0.95)"]);
  }
}

function disposeTexture(texture: THREE.Texture | undefined): void {
  if (!texture) {
    return;
  }

  if (texture instanceof THREE.VideoTexture && texture.image instanceof HTMLVideoElement) {
    texture.image.pause();
    texture.image.src = "";
    texture.image.load();
  }

  texture.dispose();
}
