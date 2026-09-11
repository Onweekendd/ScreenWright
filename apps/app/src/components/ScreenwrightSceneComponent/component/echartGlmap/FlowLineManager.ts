import * as THREE from "three";

import { getPointByProj4 } from "../echartcommonMap/utils";

export interface FlowLineData {
  from: [number, number];
  to: [number, number];
  [key: string]: any;
}

export interface FlowLineOption {
  effectType?: "period" | "constantSpeed";
  period?: number;
  constantSpeed?: number;
  delay?: number;
  effectColor?: any;
  effectOpacity?: number;
  trailLength?: number;
  loop?: boolean;
  lineShow?: boolean;
  lineColor?: any;
  lineOpacity?: number;
  lineWidth?: number;
  height?: number;
  blendingMode?: "NormalBlending" | "AdditiveBlending" | "SubtractiveBlending" | "MultiplyBlending";
}

const lineFragmentShader = ` 
#include <common>
#include <fog_pars_fragment>
#include <alphatest_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

varying vec2 vUv;
uniform float uTime;
uniform vec3 basicColor;
uniform float basicOpacity;
uniform vec3 startColor;
uniform float startOpacity;
uniform vec3 endColor;
uniform float endOpacity;
uniform float uTrailLength;

void main() {
	#include <clipping_planes_fragment>

    // 使用 uTrailLength 替代 length 避免关键字冲突
    float t = (vUv.x - uTime) / uTrailLength;
    
    if (t > 1.0 || t < 0.0) {
        gl_FragColor = vec4(basicColor, basicOpacity);
    } else {
        float a = mix(startOpacity, endOpacity, t);
        vec3 colorSegment = mix(startColor, endColor, t);
        gl_FragColor = vec4(mix(basicColor, colorSegment, a), clamp(basicOpacity + a, 0.0, 1.0));
    }

	#include <logdepthbuf_fragment>
	#include <alphatest_fragment>
	#include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

const lineVertexShader = `
#include <common>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vUv;
void main() {
    vUv = uv;
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}
`;

export class FlowLineManager {
  private scene: THREE.Scene;
  private groupsMap: Map<string, THREE.Group> = new Map();
  private animateMap: Map<string, any[]> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private getHexColor(color: any) {
    if (typeof color === "string") return color;
    if (color && color.colors && color.colors.length > 0) {
      return color.colors[0].color;
    }
    return "#ffffff";
  }

  public update(
    id: string,
    data: FlowLineData[],
    option: FlowLineOption,
    mapParams: {
      centerX: number;
      centerY: number;
      scale: number;
      baseHeight: number;
      mapGroup: THREE.Group | null;
      mapSize?: number;
    }
  ) {
    this.remove(id);

    if (!data || data.length === 0) return;

    const flowLinesGroup = new THREE.Group();
    flowLinesGroup.name = `flowLinesGroup_${id}`;
    flowLinesGroup.renderOrder = 300;
    this.groupsMap.set(id, flowLinesGroup);

    const animateObjects: any[] = [];
    this.animateMap.set(id, animateObjects);

    if (mapParams.mapGroup) {
      mapParams.mapGroup.add(flowLinesGroup);
    } else {
      this.scene.add(flowLinesGroup);
    }

    const {
      period = 4,
      trailLength = 0.3,
      lineShow = true,
      lineColor = "#00ffff",
      lineOpacity = 30,
      lineWidth = 2,
      effectColor = "#ffff00",
      effectOpacity = 100,
      height: flyHeight = 90,
      blendingMode = "AdditiveBlending",
      delay = 0
    } = option;

    const { centerX, centerY, scale, baseHeight } = mapParams;

    const parseColor = (c: any) => new THREE.Color(this.getHexColor(c));
    const bColor = parseColor(lineColor);
    const eColor = parseColor(effectColor);
    const blending = THREE[blendingMode] || THREE.AdditiveBlending;

    const startTime = performance.now();

    data.forEach((item) => {
      const [fromLng, fromLat] = item.from;
      const [toLng, toLat] = item.to;
      const fromP = getPointByProj4([fromLng, fromLat]);
      const toP = getPointByProj4([toLng, toLat]);

      const start = new THREE.Vector3((fromP[0] - centerX) * scale, (fromP[1] - centerY) * scale, baseHeight);
      const end = new THREE.Vector3((toP[0] - centerX) * scale, (toP[1] - centerY) * scale, baseHeight);

      const distance = start.distanceTo(end);
      const h = (distance * 0.5 * (flyHeight || 1)) / 100;
      const middle = start.clone().add(end).multiplyScalar(0.5);
      middle.z = baseHeight + h;

      const curve = new THREE.QuadraticBezierCurve3(start, middle, end);

      const tubeRadius = (lineWidth || 2) * 0.0005;
      const geometry = new THREE.TubeGeometry(curve, 64, tubeRadius, 8, false);

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: -trailLength },
          basicColor: { value: bColor },
          basicOpacity: { value: lineShow ? lineOpacity / 100 : 0 },
          startColor: { value: eColor },
          startOpacity: { value: 0 },
          endColor: { value: eColor },
          endOpacity: { value: effectOpacity / 100 },
          uTrailLength: { value: trailLength }
        },
        vertexShader: lineVertexShader,
        fragmentShader: lineFragmentShader,
        transparent: true,
        blending: blending,
        depthWrite: false,
        depthTest: true
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.isFlowLine = true;
      mesh.renderOrder = 301;
      flowLinesGroup.add(mesh);

      animateObjects.push({
        material,
        period: (period || 4) * 1000,
        delay: delay,
        startTime: startTime,
        trailLength: trailLength || 0.3
      });
    });
  }

  public animate() {
    const now = performance.now();
    this.animateMap.forEach((animateObjects) => {
      animateObjects.forEach((obj) => {
        const elapsed = now - (obj.startTime + (obj.delay || 0));
        if (elapsed < 0) return;

        const progress = (elapsed % obj.period) / obj.period;
        // 从 -uTrailLength 运动到 1.0
        obj.material.uniforms.uTime.value = progress * (1 + obj.trailLength) - obj.trailLength;
      });
    });
  }

  public remove(id: string) {
    const group = this.groupsMap.get(id);
    if (group) {
      if (group.parent) {
        group.parent.remove(group);
      }
      group.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m: THREE.Material) => m.dispose());
          else obj.material.dispose();
        }
      });
      this.groupsMap.delete(id);
    }
    this.animateMap.delete(id);
  }

  public dispose() {
    this.groupsMap.forEach((_, id) => {
      this.remove(id);
    });
    this.groupsMap.clear();
    this.animateMap.clear();
  }
}
