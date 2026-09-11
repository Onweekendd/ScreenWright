import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

import { setMinioUrl } from "@/utils/config";

import { getPointByProj4 } from "../echartcommonMap/utils";

export interface BarData {
  longitude?: number;
  latitude?: number;
  [key: string]: any;
}

export interface BarSeries {
  name: string;
  field?: string;
  color?: any;
  label?: any;
}

export interface BarOption {
  transparent?: boolean;
  blending?: "NormalBlending" | "AdditiveBlending" | "SubtractiveBlending" | "MultiplyBlending";
  barType?: "box" | "cylinder";
  barWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  seriesGap?: number;
  seriesList?: BarSeries[];
  opacity?: number;
  animation?: boolean;
  animationDuration?: number;
  label?: {
    show?: boolean;
    offset?: [number, number];
    carousel?: {
      show?: boolean;
      interval?: number;
    };
    [key: string]: any;
  };
}

const vertexShader = `
  varying vec2 vUv;
  varying float vHeight;
  void main() {
    vUv = uv;
    vHeight = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColorBottom;
  uniform vec3 uColorTop;
  uniform float uOpacity;
  uniform float uMaxHeight;
  varying float vHeight;
  void main() {
    float h = clamp(vHeight / uMaxHeight, 0.0, 1.0);
    vec3 color = mix(uColorBottom, uColorTop, h);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

export class MapBarManager {
  private scene: THREE.Scene;
  private barsMap: Map<string, THREE.Group> = new Map();
  private animations: Map<
    string,
    { mesh: THREE.Mesh; targetScale: number; currentScale: number; speed: number; labelObj?: CSS2DObject }[]
  > = new Map();
  private carouselStates: Map<
    string,
    {
      items: CSS2DObject[];
      currentIndex: number;
      timer: any;
      interval: number;
    }
  > = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private hexToRgba(hex: string, opacity: number) {
    if (!hex) return `rgba(255,255,255,${opacity / 100})`;
    if (hex.indexOf("rgba") > -1) return hex;
    const c = new THREE.Color(hex);
    return `rgba(${c.r * 255}, ${c.g * 255}, ${c.b * 255}, ${opacity / 100})`;
  }

  private getTextCss(style: any) {
    if (!style) return {};
    return {
      fontFamily: style.fontFamily,
      fontSize: (style.fontSize || 12) + "px",
      color: style.color || "#fff",
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      letterSpacing: (style.letterSpacing || 0) + "px",
      lineHeight: style.lineHeight ? style.lineHeight + "px" : undefined
    };
  }

  private getBackgroundCss(bg: any) {
    if (!bg) return {};
    const css: any = {};

    let type = "color";
    let color = "transparent";
    let url = "";
    let opacity = 100;

    if (typeof bg === "string") {
      color = bg;
    } else {
      url = bg.url || bg.image || "";
      type = bg.type === "picture" || (!bg.type && url) ? "picture" : "color";
      color = bg.color || "transparent";
      opacity = bg.opacity !== undefined ? bg.opacity : 100;
    }

    if (type === "picture" && url) {
      css.backgroundImage = `url(${setMinioUrl(url)})`;
      css.backgroundSize = "100% 100%";
      css.backgroundPosition = "center";
      css.backgroundRepeat = "no-repeat";
      // if (color && color !== "transparent") {
      //   css.backgroundColor = this.hexToRgba(color, opacity);
      // }
    } else {
      if (color) css.backgroundColor = this.hexToRgba(color, opacity);
      if (typeof bg === "object") {
        if (bg.borderColor) css.border = `${bg.borderWidth || 0}px solid ${bg.borderColor}`;
        if (bg.borderRadius) css.borderRadius = `${bg.borderRadius}px`;
        if (bg.padding) {
          if (Array.isArray(bg.padding)) {
            css.padding = `${bg.padding[0]}px ${bg.padding[1]}px ${bg.padding[2]}px ${bg.padding[3]}px`;
          }
        }
        if (bg.shadow && bg.shadow.color) {
          css.boxShadow = `${bg.shadow.x}px ${bg.shadow.y}px ${bg.shadow.blur}px ${bg.shadow.color}`;
        }
      }
    }
    return css;
  }

  private createLabel(labelConfig: any, value: any, rank: number) {
    if (!labelConfig || !labelConfig.show) return null;

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.pointerEvents = "none";
    container.style.width = "0px";
    container.style.height = "0px";

    const contentDiv = document.createElement("div");
    contentDiv.style.position = "absolute";
    const [ox, oy] = labelConfig.offset || [0, 0];
    contentDiv.style.transform = `translate(${ox}px, ${oy}px)`;
    container.appendChild(contentDiv);

    // Sequence
    if (labelConfig.sequence && labelConfig.sequence.show) {
      const seq = labelConfig.sequence;
      const div = document.createElement("div");
      div.innerText = String(rank);
      Object.assign(div.style, this.getTextCss(seq.textStyle));
      Object.assign(div.style, this.getBackgroundCss(seq.background));
      div.style.position = "absolute";
      if (seq.background?.width) div.style.width = `${seq.background.width}px`;
      if (seq.background?.height) div.style.height = `${seq.background.height}px`;
      div.style.display = "flex";
      div.style.justifyContent = "center";
      div.style.alignItems = "center";
      const [sx, sy] = seq.offset || [0, 0];
      div.style.transform = `translate(${sx}px, ${sy}px)`;
      contentDiv.appendChild(div);
    }

    // Value
    if (labelConfig.value && labelConfig.value.show) {
      const valCfg = labelConfig.value;
      const div = document.createElement("div");
      const span = document.createElement("span");
      span.innerText = String(value);
      Object.assign(span.style, this.getTextCss(valCfg.textStyle));
      div.appendChild(span);

      if (valCfg.suffix && valCfg.suffix.content) {
        const sufSpan = document.createElement("span");
        sufSpan.innerText = valCfg.suffix.content;
        Object.assign(sufSpan.style, this.getTextCss(valCfg.suffix.textStyle));
        const [sufX, sufY] = valCfg.suffix.offset || [0, 0];
        sufSpan.style.display = "inline-block";
        sufSpan.style.transform = `translate(${sufX}px, ${sufY}px)`;
        div.appendChild(sufSpan);
      }

      Object.assign(div.style, this.getBackgroundCss(valCfg.background));
      div.style.padding = "4px 8px";
      div.style.position = "absolute";
      div.style.whiteSpace = "nowrap";
      div.style.display = "flex";
      div.style.alignItems = "center";
      const [vx, vy] = valCfg.offset || [0, 0];
      div.style.transform = `translate(${vx}px, ${vy}px)`;
      contentDiv.appendChild(div);
    }

    const cssObj = new CSS2DObject(container);
    container.style.opacity = "0";
    container.style.transition = "opacity 0.6s ease-out";
    return cssObj;
  }

  // 解析颜色配置，支持渐变色对象或单色字符串
  private getGradientColors(colorConfig: any): { bottom: string; top: string } {
    if (typeof colorConfig === "string") {
      // 如果是单色字符串，底部稍微变暗
      return { bottom: colorConfig, top: colorConfig };
    }

    // 处理直接传入数组的情况 (e.g. [{color:..., per:0}, {color:..., per:100}])
    if (Array.isArray(colorConfig) && colorConfig.length > 0) {
      if (colorConfig.length === 1) {
        return { bottom: colorConfig[0].color, top: colorConfig[0].color };
      }
      // 取第一个和最后一个作为渐变的两端
      return { bottom: colorConfig[0].color, top: colorConfig[colorConfig.length - 1].color };
    }

    if (colorConfig && colorConfig.colors && colorConfig.colors.length >= 2) {
      // 假设 colors[0] 是起始色（底部），colors[1] 是结束色（顶部）
      // 也可以根据实际业务逻辑调整，比如反过来
      return { bottom: colorConfig.colors[0].color, top: colorConfig.colors[1].color };
    }
    if (colorConfig && colorConfig.colors && colorConfig.colors.length === 1) {
      return { bottom: colorConfig.colors[0].color, top: colorConfig.colors[0].color };
    }
    // 默认白色
    return { bottom: "#ffffff", top: "#ffffff" };
  }

  public update(
    id: string,
    data: BarData[],
    option: BarOption,
    mapParams: {
      centerX: number;
      centerY: number;
      scale: number;
      baseHeight: number;
      mapGroup: THREE.Group | null;
      mapSize: number;
    }
  ) {
    this.remove(id);

    if (!data || data.length === 0) return;

    const barGroup = new THREE.Group();
    barGroup.name = `barGroup_${id}`;
    this.barsMap.set(id, barGroup);

    if (mapParams.mapGroup) {
      mapParams.mapGroup.add(barGroup);
    } else {
      this.scene.add(barGroup);
    }

    const {
      transparent = true,
      blending = "NormalBlending",
      barType = "box",
      barWidth = 2,
      minHeight = 4,
      maxHeight = 40,
      seriesGap = 0.8,
      seriesList = [],
      opacity = 100,
      animation = true,
      animationDuration = 1000
    } = option;

    const { centerX, centerY, scale, baseHeight, mapSize } = mapParams;
    // 增加缩放系数，使默认大小更明显
    const unitScale = mapSize * 0.005;

    const blendMode = (THREE as any)[blending] || THREE.NormalBlending;

    // 每一帧动画递增的基础进度 (假设 60fps)
    const step = 1 / (animationDuration / 16.7);

    const barAnimations: {
      mesh: THREE.Mesh;
      targetScale: number;
      currentScale: number;
      speed: number;
      labelObj?: CSS2DObject;
    }[] = [];

    const carouselItems: CSS2DObject[] = [];

    // 预计算每个系列的值范围，以便归一化高度
    const fieldMaxValues: { [key: string]: number } = {};
    const fieldRanks: { [key: string]: Map<number, number> } = {};

    seriesList.forEach((series) => {
      if (series.field) {
        let max = 0;
        const values: { val: number; index: number }[] = [];
        data.forEach((item, index) => {
          const val = Number(item[series.field!]) || 0;
          if (val > max) max = val;
          values.push({ val, index });
        });
        fieldMaxValues[series.field] = max || 1;

        // Rank
        values.sort((a, b) => b.val - a.val);
        const rankMap = new Map<number, number>();
        values.forEach((v, i) => rankMap.set(v.index, i + 1));
        fieldRanks[series.field] = rankMap;
      }
    });

    data.forEach((item, itemIndex) => {
      if (item.longitude === undefined || item.latitude === undefined) return;

      const p = getPointByProj4([item.longitude, item.latitude]);
      const x = (p[0] - centerX) * scale;
      const y = (p[1] - centerY) * scale;

      const totalSeries = seriesList.length;
      const totalWidth = totalSeries * barWidth + (totalSeries - 1) * seriesGap;
      const startOffset = -totalWidth / 2 + barWidth / 2;

      seriesList.forEach((series, sIndex) => {
        if (!series.field) return;

        const val = Number(item[series.field]) || 0;
        const maxVal = fieldMaxValues[series.field];
        const normalizedVal = val / maxVal;
        const h = minHeight + (maxHeight - minHeight) * normalizedVal;

        const { bottom, top } = this.getGradientColors(series.color);
        const colorBottom = new THREE.Color(bottom);
        const colorTop = new THREE.Color(top);

        // 如果是单色字符串，手动将底部变暗一点，模拟简易光照效果
        if (typeof series.color === "string") {
          colorBottom.multiplyScalar(0.6);
        }

        const actualWidth = barWidth * unitScale;
        const actualHeight = h * unitScale;

        let geometry: THREE.BufferGeometry;
        if (barType === "cylinder") {
          // 在 local 坐标系中，高度为 Y
          geometry = new THREE.CylinderGeometry(actualWidth / 2, actualWidth / 2, actualHeight, 32);
        } else {
          geometry = new THREE.BoxGeometry(actualWidth, actualHeight, actualWidth);
        }

        // 将几何体底部对齐到原点，方便以此为支点缩放
        geometry.translate(0, actualHeight / 2, 0);

        const material = new THREE.ShaderMaterial({
          uniforms: {
            uColorBottom: { value: colorBottom },
            uColorTop: { value: colorTop },
            uOpacity: { value: opacity / 100 },
            uMaxHeight: { value: actualHeight }
          },
          vertexShader,
          fragmentShader,
          transparent: transparent,
          blending: blendMode,
          depthWrite: !transparent
        });

        const mesh = new THREE.Mesh(geometry, material);

        mesh.renderOrder = 10;

        // 计算系列偏移
        const offset = (startOffset + sIndex * (barWidth + seriesGap)) * unitScale;

        // 设置初始位置和旋转
        mesh.position.set(x + offset, y, baseHeight);
        mesh.rotation.x = Math.PI / 2; // 绕 X 轴旋转 90 度，使 Y 轴向 Z 方向

        mesh.userData.name = item.name;
        mesh.userData.adcode = item.adcode;
        mesh.userData.baseZ = baseHeight;

        let labelObj: CSS2DObject | undefined;
        // Label Creation
        const labelConfig = option.label;
        if (labelConfig && labelConfig.show) {
          const rank = fieldRanks[series.field]?.get(itemIndex) || 0;
          const cssObj = this.createLabel(labelConfig, val, rank);
          if (cssObj) {
            cssObj.position.set(0, actualHeight, 0);
            mesh.add(cssObj);
            labelObj = cssObj;
            if (option.label?.carousel?.show) {
              cssObj.userData.value = val;
              carouselItems.push(cssObj);
            }
          }
        }

        if (animation) {
          mesh.scale.set(1, 0.001, 1); // 初始高度接近 0
          barAnimations.push({
            mesh,
            targetScale: 1,
            currentScale: 0.001,
            speed: step,
            labelObj
          });
        } else {
          if (labelObj) {
            labelObj.element.style.opacity = "1";
          }
        }

        barGroup.add(mesh);
      });
    });

    if (barAnimations.length > 0) {
      this.animations.set(id, barAnimations);
    }

    if (option.label?.carousel?.show && carouselItems.length > 0) {
      // 按照数值从大到小排序
      carouselItems.sort((a, b) => (b.userData.value || 0) - (a.userData.value || 0));

      const interval = option.label.carousel.interval || 1000;
      this.carouselStates.set(id, {
        items: carouselItems,
        currentIndex: 0,
        timer: null,
        interval: interval
      });
      // Start carousel after first show
    }
  }

  // 二次缓出函数
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  public animate() {
    this.animations.forEach((animList, id) => {
      let allFinished = true;
      animList.forEach((anim) => {
        if (anim.currentScale < 1) {
          anim.currentScale += anim.speed;
          if (anim.currentScale > 1) anim.currentScale = 1;

          // 使用缓动函数计算实际缩放值
          const easedScale = this.easeOutQuad(anim.currentScale);
          anim.mesh.scale.set(1, Math.max(0.001, easedScale), 1);
          allFinished = false;
        }

        // 当缩放完成 (scale >= 1) 时显示标牌
        if (anim.currentScale >= 1 && anim.labelObj) {
          const carousel = this.carouselStates.get(id);
          if (!carousel) {
            anim.labelObj.element.style.opacity = "1";
          }
        }
      });

      if (allFinished) {
        this.animations.delete(id);

        // If finished and has carousel, start it
        const carousel = this.carouselStates.get(id);
        if (carousel && !carousel.timer) {
          this.startCarousel(id);
        }
      }
    });
  }

  private startCarousel(id: string) {
    const state = this.carouselStates.get(id);
    if (!state || state.items.length === 0) return;

    const showNext = () => {
      const s = this.carouselStates.get(id);
      if (!s) return;

      // Hide current
      if (s.items[s.currentIndex]) {
        s.items[s.currentIndex].element.style.opacity = "0";
      }

      // Increment index
      s.currentIndex = (s.currentIndex + 1) % s.items.length;

      // Show next
      if (s.items[s.currentIndex]) {
        s.items[s.currentIndex].element.style.opacity = "1";
      }

      s.timer = setTimeout(showNext, s.interval);
    };

    // Show first one immediately
    state.items[0].element.style.opacity = "1";
    state.timer = setTimeout(showNext, state.interval);
  }

  public remove(id: string) {
    this.animations.delete(id);
    const carousel = this.carouselStates.get(id);
    if (carousel) {
      if (carousel.timer) clearTimeout(carousel.timer);
      this.carouselStates.delete(id);
    }
    const group = this.barsMap.get(id);
    if (group) {
      if (group.parent) {
        group.parent.remove(group);
      }
      group.traverse((obj: any) => {
        if (obj.isCSS2DObject && obj.element && obj.element.parentNode) {
          obj.element.parentNode.removeChild(obj.element);
        }
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((m: any) => m.dispose());
        }
      });
      this.barsMap.delete(id);
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

  public liftBars(adcode: string, offset: number) {
    this.barsMap.forEach((group) => {
      group.children.forEach((mesh: THREE.Object3D) => {
        const barAdcode = String(mesh.userData?.adcode || "");
        if (this.matchesRegionCode(barAdcode, String(adcode || ""))) {
          const baseZ = mesh.userData.baseZ || 0;
          mesh.position.z = baseZ + offset;
        }
      });
    });
  }

  public restoreBars(adcode: string) {
    this.barsMap.forEach((group) => {
      group.children.forEach((mesh: THREE.Object3D) => {
        const barAdcode = String(mesh.userData?.adcode || "");
        if (this.matchesRegionCode(barAdcode, String(adcode || ""))) {
          const baseZ = mesh.userData.baseZ || 0;
          mesh.position.z = baseZ;
        }
      });
    });
  }

  public dispose() {
    this.barsMap.forEach((_, id) => {
      this.remove(id);
    });
    this.barsMap.clear();
  }
}
