import * as THREE from "three";

import {
  buildRibbonGeometry,
  getBlendingMode,
  getColorString,
  getGradientStops,
  getNormalizedOpacity,
  getNumericValue,
  normalizePolylinePoints,
  projectLngLatToWorld
} from "./MapChildRenderUtils";

export interface MapPathData {
  name?: string;
  points?: any[];
  coords?: any[];
  coordinates?: any[];
  path?: any[];
  from?: [number, number];
  to?: [number, number];
  [key: string]: any;
}

export interface MapPathOption {
  lineWidth?: number;
  offsetZ?: number;
  animationDuration?: number;
  delay?: number;
  trailLength?: number;
  loop?: boolean;
  lineShow?: boolean;
  lineColor?: any;
  lineOpacity?: number;
  effectColor?: any;
  effectOpacity?: number;
  blendingMode?: "NormalBlending" | "AdditiveBlending" | "SubtractiveBlending" | "MultiplyBlending";
}

interface MapPathAnimateState {
  material: THREE.ShaderMaterial;
  startTime: number;
  duration: number;
  delay: number;
  trailLength: number;
  loop: boolean;
}

const pathVertexShader = `
#include <common>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>

varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 transformed = position;
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
  #include <fog_vertex>
}
`;

const pathFragmentShader = `
#include <common>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>

varying vec2 vUv;

uniform float uTime;
uniform float uTrailLength;
uniform vec3 uBaseColor;
uniform float uBaseOpacity;
uniform vec3 uEffectStartColor;
uniform vec3 uEffectEndColor;
uniform float uEffectOpacity;

void main() {
  float baseAlpha = clamp(uBaseOpacity, 0.0, 1.0);
  vec3 color = uBaseColor;
  float alpha = baseAlpha;

  float localTrailLength = max(uTrailLength, 0.0001);
  float t = (vUv.x - uTime) / localTrailLength;

  if (t >= 0.0 && t <= 1.0) {
    float segmentAlpha = smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(0.85, 1.0, t));
    vec3 effectColor = mix(uEffectStartColor, uEffectEndColor, clamp(t, 0.0, 1.0));
    float effectAlpha = segmentAlpha * clamp(uEffectOpacity, 0.0, 1.0);
    color = mix(color, effectColor, effectAlpha);
    alpha = max(alpha, effectAlpha);
  }

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

export class MapPathManager {
  private scene: THREE.Scene;
  private groupsMap: Map<string, THREE.Group> = new Map();
  private animateMap: Map<string, MapPathAnimateState[]> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public update(
    id: string,
    data: MapPathData[],
    option: MapPathOption,
    mapParams: {
      centerX: number;
      centerY: number;
      scale: number;
      baseHeight: number;
      mapSize: number;
      mapGroup: THREE.Group | null;
    }
  ): void {
    this.remove(id);

    if (!Array.isArray(data) || data.length === 0) {
      return;
    }

    const group = new THREE.Group();
    group.name = `mapPathGroup_${id}`;
    group.renderOrder = 304;
    this.groupsMap.set(id, group);

    if (mapParams.mapGroup) {
      mapParams.mapGroup.add(group);
    } else {
      this.scene.add(group);
    }

    const animateStates: MapPathAnimateState[] = [];
    this.animateMap.set(id, animateStates);

    const lineWidth = getNumericValue(option.lineWidth, 4);
    const widthWorld = Math.max((mapParams.mapSize || 1) * 0.0008, lineWidth * (mapParams.mapSize || 1) * 0.00065);
    const offsetZ = getNumericValue(option.offsetZ, 2) * (mapParams.mapSize || 1) * 0.0006;
    const trailLength = THREE.MathUtils.clamp(getNumericValue(option.trailLength, 0.28), 0.02, 1);
    const duration = Math.max(0.2, getNumericValue(option.animationDuration, 3.5)) * 1000;
    const delay = Math.max(0, getNumericValue(option.delay, 0)) * 1000;
    const loop = option.loop !== false;
    const lineOpacity = option.lineShow === false ? 0 : getNormalizedOpacity(option.lineOpacity, 100);
    const effectOpacity = getNormalizedOpacity(option.effectOpacity, 100);
    const lineStops = getGradientStops(option.lineColor, ["#0f2a42", "#0f2a42"]);
    const effectStops = getGradientStops(option.effectColor, ["#22d3ee", "#ffffff"]);
    const baseColor = new THREE.Color(getColorString(lineStops));
    const effectStartColor = new THREE.Color(lineStopsToStartColor(effectStops));
    const effectEndColor = new THREE.Color(lineStopsToEndColor(effectStops));
    const blending = getBlendingMode(option.blendingMode || "AdditiveBlending");
    const startTime = performance.now();

    data.forEach((item, index) => {
      const lngLatPoints = normalizePolylinePoints(item);
      if (lngLatPoints.length < 2) {
        return;
      }

      const worldPoints = lngLatPoints.map((point) => projectLngLatToWorld(point, mapParams, offsetZ + index * 0.00001));
      const geometry = buildRibbonGeometry(worldPoints, widthWorld);
      if (!geometry) {
        return;
      }

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: loop ? -trailLength : 0 },
          uTrailLength: { value: trailLength },
          uBaseColor: { value: baseColor },
          uBaseOpacity: { value: lineOpacity },
          uEffectStartColor: { value: effectStartColor },
          uEffectEndColor: { value: effectEndColor },
          uEffectOpacity: { value: effectOpacity }
        },
        vertexShader: pathVertexShader,
        fragmentShader: pathFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending,
        side: THREE.DoubleSide,
        toneMapped: false
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `mapPath_${id}_${index}`;
      mesh.renderOrder = 304;
      mesh.userData = {
        ...item,
        baseZ: mapParams.baseHeight + offsetZ
      };
      group.add(mesh);

      animateStates.push({
        material,
        startTime,
        duration,
        delay,
        trailLength,
        loop
      });
    });
  }

  public animate(): void {
    const now = performance.now();

    this.animateMap.forEach((states) => {
      states.forEach((state) => {
        const elapsed = now - (state.startTime + state.delay);
        if (elapsed < 0) {
          state.material.uniforms.uTime.value = state.loop ? -state.trailLength : 0;
          return;
        }

        if (!state.loop && elapsed >= state.duration) {
          state.material.uniforms.uTime.value = 1 - state.trailLength;
          return;
        }

        const progress = state.loop ? (elapsed % state.duration) / state.duration : Math.min(elapsed / state.duration, 1);
        state.material.uniforms.uTime.value = progress * (1 + state.trailLength) - state.trailLength;
      });
    });
  }

  public remove(id: string): void {
    const group = this.groupsMap.get(id);
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
          materials.forEach((material: THREE.Material) => material.dispose());
        }
      });
      this.groupsMap.delete(id);
    }

    this.animateMap.delete(id);
  }

  public dispose(): void {
    Array.from(this.groupsMap.keys()).forEach((id) => this.remove(id));
    this.groupsMap.clear();
    this.animateMap.clear();
  }
}

function lineStopsToStartColor(stops: { color: string }[]): string {
  return stops[0]?.color || "#22d3ee";
}

function lineStopsToEndColor(stops: { color: string }[]): string {
  return stops[stops.length - 1]?.color || "#ffffff";
}
