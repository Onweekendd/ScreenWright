import * as THREE from "three";
import { CSS3DObject, CSS3DSprite } from "three/examples/jsm/renderers/CSS3DRenderer.js";

import { setMinioUrl } from "@/utils/config";

import { getPointByProj4 } from "../echartcommonMap/utils";

const offsetScale = 5;

export interface IconData {
  name?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  value?: number;
  address?: string;
  [key: string]: any;
}

export interface StatusMode {
  name: string;
  url: string;
  iconScale?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textBackground?: string | { type?: "color" | "picture"; color?: string; url?: string };
  textBackgroundUrl?: string;
  textFillType?: "color" | "picture";
  fontWeight?: string;
  fontStyle?: string;
  innerIconColor?: string;
  hoverMode?: InteractionMode;
  activeMode?: InteractionMode;
  [key: string]: any;
}

export interface InteractionMode {
  highLightUrl?: string;
  textBackground?: string | { type?: "color" | "picture"; color?: string; url?: string };
  textFollow?: boolean;
  iconScale?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textFillType?: "color" | "picture";
  textBackgroundUrl?: string;
  offsetX?: number;
  offsetY?: number;
  innerIconColor?: string;
  [key: string]: any;
}

export interface IconOption {
  url?: string;
  iconSize?: "fix" | "scale";
  followCamera?: "all" | "none" | "horizontal";
  originPoint?: "center" | "bottom" | "top";
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textFillType?: "color" | "picture";
  textBackground?: string | { type?: "color" | "picture"; color?: string; url?: string };
  textBackgroundUrl?: string;
  fontWeight?: string;
  fontStyle?: string;
  offsetX?: number;
  offsetY?: number;
  rotation?: [number, number, number];
  scale?: [number, number, number];
  statusList?: StatusMode[];
  hoverShow?: boolean;
  hoverMode?: InteractionMode;
  activeShow?: boolean;
  activeMode?: InteractionMode;
  textAnimation?: "none" | "carousel";
  textAnimationInterval?: number;
  originX?: number;
  originY?: number;

  [key: string]: any;
}

export type MapGlIconActiveAction = "select" | "unselect" | "toggle";

export interface MapGlIconActiveOptions {
  childId?: string;
  field?: string;
  value?: unknown;
  action?: MapGlIconActiveAction;
  exclusive?: boolean;
  clearWhenMiss?: boolean;
}

interface InternalIconObj extends THREE.Object3D {
  isCSS3DObject?: boolean;
  element?: HTMLElement;
}

interface IconRuntimeEntry {
  id: string;
  childId: string;
  index: number;
  data: IconData;
  container: HTMLElement;
  element: HTMLElement;
  activeShow: boolean;
  activeTextFollow: boolean;
  hoverTextFollow: boolean;
  applyDefault: () => void;
  applyActive: () => void;
  setTextVisible: (visible: boolean) => void;
}

export class MapGlIconManager {
  private scene: THREE.Scene;
  private iconsMap: Map<string, THREE.Group> = new Map();
  private iconItemMap: Map<string, InternalIconObj> = new Map();
  private activeIcon: HTMLElement | null = null; // 当前处于激活态的图标元素
  private activeIcons: Set<HTMLElement> = new Set();
  private iconRuntimeMap: Map<string, IconRuntimeEntry> = new Map();
  private popupStateMap: Map<string, boolean> = new Map(); // 记录当前选中挂载的uuid用于显隐控制
  private carouselStates: Map<
    string,
    {
      items: { container: HTMLElement; textSpan: HTMLElement }[];
      currentIndex: number;
      timer: NodeJS.Timeout | null;
      interval: number;
      highLightUrl?: string;
      iconUrl?: string;
    }
  > = new Map();

  private static _styleInjected = false;

  /**
   * Inject a global CSS rule so that CSS3DRenderer's per-frame
   * `element.style.pointerEvents = 'auto'` (inline, no !important)
   * is overridden by the stylesheet rule with !important.
   */
  private static injectPointerEventsStyle() {
    if (MapGlIconManager._styleInjected) return;
    const style = document.createElement("style");
    style.textContent = `[data-map-gl-icon] { pointer-events: none !important; }`;
    document.head.appendChild(style);
    MapGlIconManager._styleInjected = true;
  }

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    MapGlIconManager.injectPointerEventsStyle();
  }

  private isIconActive(container: HTMLElement | null) {
    return Boolean(container && this.activeIcons.has(container));
  }

  private getRuntimeEntryByContainer(container: HTMLElement | null) {
    if (!container) return null;
    for (const entry of this.iconRuntimeMap.values()) {
      if (entry.container === container) {
        return entry;
      }
    }
    return null;
  }

  private setEntryInactive(entry: IconRuntimeEntry, options: { restoreHoverText?: boolean } = {}) {
    this.activeIcons.delete(entry.container);
    if (this.activeIcon === entry.container) {
      this.activeIcon = null;
    }
    entry.applyDefault();

    if (entry.activeTextFollow) {
      const keepHoverText = Boolean(options.restoreHoverText && entry.hoverTextFollow && entry.element.matches(":hover"));
      entry.setTextVisible(keepHoverText);
    }
  }

  private clearAllActiveIcons(options: { restoreHoverText?: boolean; childId?: string } = {}) {
    const entries = Array.from(this.activeIcons)
      .map((container) => this.getRuntimeEntryByContainer(container))
      .filter((entry): entry is IconRuntimeEntry => Boolean(entry))
      .filter((entry) => !options.childId || entry.childId === options.childId);

    entries.forEach((entry) => this.setEntryInactive(entry, options));
    if (!options.childId) {
      this.activeIcons.clear();
      this.activeIcon = null;
    } else if (!this.activeIcon && this.activeIcons.size > 0) {
      const remainingActiveIcons = Array.from(this.activeIcons);
      this.activeIcon = remainingActiveIcons[remainingActiveIcons.length - 1] || null;
    }
  }

  private setEntryActive(entry: IconRuntimeEntry, options: { exclusive?: boolean; exclusiveChildId?: string } = {}) {
    if (!entry.activeShow) {
      return false;
    }

    if (options.exclusive !== false) {
      this.clearAllActiveIcons({ childId: options.exclusiveChildId });
    }

    this.activeIcons.add(entry.container);
    this.activeIcon = entry.container;
    entry.applyActive();
    if (entry.activeTextFollow) {
      entry.setTextVisible(true);
    }
    return true;
  }

  private getValueByPath(data: Record<string, any>, field: string) {
    if (!field) return undefined;
    if (field === "componentId") {
      return data.componentId;
    }
    return field.split(".").reduce((target, key) => (target == null ? undefined : target[key]), data as any);
  }

  private resolveIconScale(value: unknown, fallback = 1) {
    const scale = Number(value);
    return Number.isFinite(scale) && scale > 0 ? scale : fallback;
  }

  private getDefaultIconScale(container: HTMLElement) {
    return this.resolveIconScale(container.dataset.mapGlIconScale, 1);
  }

  private getIconVisualParts(container: HTMLElement) {
    return {
      visual: container.querySelector(".icon-visual") as HTMLElement | null,
      baseImg: container.querySelector(".icon-background-default") as HTMLImageElement | null,
      hoverImg: container.querySelector(".icon-background-hover") as HTMLImageElement | null
    };
  }

  private applyIconVisualState(
    container: HTMLElement,
    options: {
      iconUrl?: string;
      highlightUrl?: string;
      highlighted?: boolean;
      scale?: number;
    } = {}
  ) {
    const { visual, baseImg, hoverImg } = this.getIconVisualParts(container);
    const { iconUrl = "", highlightUrl = "", highlighted = false, scale = 1 } = options;

    if (baseImg && iconUrl && baseImg.getAttribute("src") !== iconUrl) {
      baseImg.setAttribute("src", iconUrl);
    }

    if (hoverImg) {
      if (highlightUrl && hoverImg.getAttribute("src") !== highlightUrl) {
        hoverImg.setAttribute("src", highlightUrl);
      }
      hoverImg.style.opacity = highlighted && highlightUrl ? "1" : "0";
    }

    if (visual) {
      visual.style.transform = `scale(${scale})`;
    }
  }

  public update(
    id: string,
    data: IconData[],
    option: IconOption,
    mapParams: {
      centerX: number;
      centerY: number;
      scale: number;
      baseHeight: number;
      mapGroup: THREE.Group | null;
      mapSize: number;
      projectPoint?: (point: [number, number]) => [number, number] | null;
    },
    onClick?: (item: IconData, event: MouseEvent) => void
  ) {
    // 首先完全移除旧的实例
    this.clearAllActiveIcons();
    this.remove(id);

    const iconGroup = new THREE.Group();
    iconGroup.name = `iconGroup_${id}`;
    this.iconsMap.set(id, iconGroup);

    if (mapParams.mapGroup) {
      mapParams.mapGroup.add(iconGroup);
    } else {
      this.scene.add(iconGroup);
    }

    const {
      url: defaultUrl = "",
      statusList = [],
      fontSize: defaultFontSize = 5,
      fontFamily: defaultFontFamily = "Arial",
      color: defaultColor = "#ffffff",
      textBackground: defaultTextBg = "transparent",
      fontWeight: defaultFontWeight = "normal",
      fontStyle: defaultFontStyle = "normal",
      offsetX = 0,
      offsetY = 0,
      rotation = [0, 0, 0],
      iconSize = "fix",
      originPoint = "center",
      followCamera = "all",
      scale: userScale = [1, 1, 1],
      hoverShow = false,
      hoverMode = {},
      activeShow = false,
      activeMode = {},
      originX = 0,
      originY = 0
    } = option;

    const { centerX, centerY, scale, baseHeight, mapSize, projectPoint } = mapParams;
    // const unitScale = 0.005;
    const [rotX, rotY, rotZ] = rotation;
    const hoverTextFollow = !!(hoverShow && (hoverMode as any)?.textFollow);
    const activeTextFollow = !!(activeShow && (activeMode as any)?.textFollow);
    const getTextFillType = (target: any) => target?.textFillType || target?.textfillType;
    const resolveTextBackground = (target: any, fallback: any = "transparent") => {
      if (!target) {
        return fallback;
      }

      if (getTextFillType(target) === "picture") {
        const rawBg = target.textBackground;
        const bgColor =
          typeof rawBg === "string"
            ? rawBg
            : typeof rawBg?.color === "string"
              ? rawBg.color
              : "transparent";
        const bgUrl =
          target.textBackgroundUrl || (typeof rawBg === "object" && rawBg?.type === "picture" ? rawBg.url || "" : "");

        return {
          type: "picture",
          url: bgUrl,
          color: bgColor
        };
      }

      if (target.textBackground !== undefined) {
        return target.textBackground;
      }

      return fallback;
    };
    const isTransparentBackground = (bg: any) => {
      if (typeof bg !== "string") {
        return false;
      }

      const normalized = bg.replace(/\s+/g, "").toLowerCase();
      return normalized === "" || normalized === "transparent" || normalized.endsWith(",0)") || normalized.endsWith(",0.0)");
    };
    const hasVisibleTextBackground = (bg: any) => {
      if (!bg) {
        return false;
      }
      if (typeof bg === "string") {
        return !isTransparentBackground(bg);
      }
      if (typeof bg === "object") {
        return Boolean(bg.url) || !isTransparentBackground(bg.color);
      }
      return false;
    };
    const defaultTextBgResolved = resolveTextBackground(option, defaultTextBg);

    const applyTextBackground = (span: HTMLElement, bg: any) => {
      span.style.backgroundColor = "transparent";
      span.style.backgroundImage = "";
      span.style.backgroundSize = "";
      span.style.backgroundRepeat = "";
      span.style.backgroundPosition = "";
      if (typeof bg === "string") {
        span.style.backgroundColor = bg;
        return;
      }
      if (!bg || typeof bg !== "object") return;
      const fillType = bg.type === "picture" ? "picture" : "color";
      const color = typeof bg.color === "string" ? bg.color : "transparent";
      const url = typeof bg.url === "string" ? bg.url : "";
      if (fillType === "picture" && url) {
        span.style.backgroundImage = `url(${setMinioUrl(url)})`;
        span.style.backgroundSize = "100% 100%";
        span.style.backgroundRepeat = "no-repeat";
        span.style.backgroundPosition = "center";
        span.style.backgroundColor = color;
      } else {
        span.style.backgroundColor = color;
      }
    };

    data.forEach((item, index) => {
      // 1. 寻找状态配置
      const statusConfig = statusList.find((s) => s.name === item.status);
      const defaultIconScale = this.resolveIconScale(statusConfig?.iconScale, 1);

      const iconUrl = setMinioUrl(statusConfig?.url || item.url || defaultUrl);
      const fontSize = statusConfig?.fontSize || defaultFontSize;
      const color = statusConfig?.color || defaultColor;
      const fontFamily = statusConfig?.fontFamily || defaultFontFamily;
      const fontWeight = statusConfig?.fontWeight || defaultFontWeight;
      const fontStyle = statusConfig?.fontStyle || defaultFontStyle;
      const statusTextBgResolved = resolveTextBackground(statusConfig, defaultTextBgResolved);
      const textBg = statusTextBgResolved;

      // 2. 创建 DOM 元素
      const container = document.createElement("div");
      container.className = `mapGlIcon--${id}--${index}`;
      container.style.display = "flex";
      container.style.position = "relative";
      container.style.flexDirection = "column";
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
      container.style.cursor = "pointer";
      container.style.willChange = "transform"; // GPU compositing hint for frequent CSS3D transform updates
      container.dataset.mapGlIcon = "1";
      container.dataset.mapGlIconScale = String(defaultIconScale);

      const stopBubble = (e: Event) => {
        e.stopPropagation();
      };
      const stopWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };
      container.addEventListener("mousemove", stopBubble);
      container.addEventListener("mousedown", stopBubble);
      container.addEventListener("mouseup", stopBubble);
      container.addEventListener("click", stopBubble);
      container.addEventListener("contextmenu", stopBubble);
      container.addEventListener("wheel", stopWheel, { passive: false });

      const element = document.createElement("div");
      element.className = `icon-container`;
      element.style.display = "inline-flex";
      element.style.justifyContent = "center";
      element.style.alignItems = "center";
      element.style.position = "relative";
      element.style.pointerEvents = "auto";

      container.appendChild(element);

      const iconVisual = document.createElement("div");
      iconVisual.className = "icon-visual";
      iconVisual.style.position = "relative";
      iconVisual.style.display = "inline-flex";
      iconVisual.style.alignItems = "center";
      iconVisual.style.justifyContent = "center";
      iconVisual.style.pointerEvents = "none";
      iconVisual.style.transformOrigin = "center center";
      iconVisual.style.transition = "transform 0.2s ease";

      element.appendChild(iconVisual);

      const resolveInteractionIconUrl = (mode?: InteractionMode | null) => setMinioUrl(mode?.highLightUrl || mode?.url || iconUrl);
      const hoverHighlightUrl = resolveInteractionIconUrl(hoverMode);
      const activeHighlightUrl = resolveInteractionIconUrl(activeMode);
      const needsHoverLayer = [hoverHighlightUrl, activeHighlightUrl].some((url) => Boolean(url) && url !== iconUrl);

      const setTextVisible = (el: HTMLElement, visible: boolean) => {
        const span = el.querySelector("span") as HTMLElement | null;
        if (!span) return;
        span.style.opacity = visible ? "1" : "0";
      };

      // 如果有图片，创建图片元素
      if (iconUrl) {
        const img = document.createElement("img");
        img.className = "icon-background icon-background-default";
        img.src = iconUrl;
        img.style.width = "auto";
        img.style.height = "auto";
        img.style.maxWidth = "100%";
        img.style.display = "block";
        img.style.pointerEvents = "none";
        img.draggable = false;
        iconVisual.appendChild(img);

        if (needsHoverLayer) {
          const hoverImg = document.createElement("img");
          hoverImg.className = "icon-background icon-background-hover";
          hoverImg.src = hoverHighlightUrl || activeHighlightUrl || iconUrl;
          hoverImg.style.position = "absolute";
          hoverImg.style.inset = "0";
          hoverImg.style.width = "100%";
          hoverImg.style.height = "100%";
          hoverImg.style.objectFit = "contain";
          hoverImg.style.display = "block";
          hoverImg.style.opacity = "0";
          hoverImg.style.pointerEvents = "none";
          hoverImg.style.transition = "opacity 0.2s ease";
          hoverImg.draggable = false;
          iconVisual.appendChild(hoverImg);
        }
      }

      // 如果有文字内容（由 item.name 或配置提供）
      const textContent = item.name || "";
      if (textContent) {
        const textSpan = document.createElement("span");
        textSpan.className = "icon-text";
        textSpan.textContent = textContent;
        textSpan.style.color = color;
        textSpan.style.fontSize = `${fontSize * 10}px`; // 放大10倍配合整体缩放
        textSpan.style.fontFamily = fontFamily;
        textSpan.style.fontWeight = fontWeight;
        textSpan.style.fontStyle = fontStyle;
        applyTextBackground(textSpan, textBg);
        textSpan.style.padding = "10px 20px";
        textSpan.style.borderRadius = "2px";
        textSpan.style.whiteSpace = "nowrap";
        textSpan.style.whiteSpace = "nowrap";
        // textSpan.style.marginTop = "2px";
        textSpan.style.position = "absolute";
        textSpan.style.left = "50%";
        textSpan.style.top = "50%";
        // 应用文字偏移 (默认居中，叠加偏移)
        textSpan.style.transform = `translate(-50%, -50%) translate(${offsetX * offsetScale}px, ${-(offsetY * offsetScale)}px)`;
        textSpan.style.transition = "opacity 0.6s ease-out";
        textSpan.style.opacity = "1";
        textSpan.style.pointerEvents = "none";

        if (hoverTextFollow || activeTextFollow) {
          textSpan.style.opacity = "0";
        }
        element.appendChild(textSpan);
      }

      // 3. 创建 CSS3D 对象
      // "all" 模式使用 CSS3DSprite (自动全向朝向相机)
      // "none" 和 "horizontal" 模式使用 CSS3DObject (支持手动控制旋转)
      let iconObj: InternalIconObj;
      if (followCamera === "all") {
        iconObj = new CSS3DSprite(container);
      } else {
        iconObj = new CSS3DObject(container) as unknown as InternalIconObj;
        // 应用基础旋转
        iconObj.rotation.set(
          THREE.MathUtils.degToRad(rotX),
          THREE.MathUtils.degToRad(rotY),
          THREE.MathUtils.degToRad(rotZ)
        );
      }

      iconObj.userData = {
        followCamera,
        baseRotation: [...rotation],
        id: `mapGlIcon-${id}-${index}`
      };

      // 4. 设置位置 (经纬度转场景坐标)
      if (item.longitude !== undefined && item.latitude !== undefined) {
        const p =
          projectPoint?.([Number(item.longitude), Number(item.latitude)]) ||
          getPointByProj4([Number(item.longitude), Number(item.latitude)]);
        if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) {
          return;
        }
        const x = (p[0] - centerX) * scale;
        const y = (p[1] - centerY) * scale;

        // 设置位置
        iconObj.position.set(
          x,
          y,
          baseHeight + 0.005 // 略高于地表
        );
      }

      // 5. 设置缩放 (参考区域标签逻辑)
      const baseLabelScale = mapSize * 0.00012;
      const finalScale = iconSize === "fix" ? Math.max(0.0008, Math.min(0.05, baseLabelScale)) : baseLabelScale;

      iconObj.scale.set(finalScale * userScale[0], finalScale * userScale[1], finalScale * userScale[2]);

      this.iconItemMap.set(iconObj.userData.id, iconObj);

      iconGroup.add(iconObj);

      const applyImgStyles = (el: HTMLElement, mode: InteractionMode | null, isDefault: boolean = false) => {
        const baseScale = this.getDefaultIconScale(el);
        this.applyIconVisualState(el, {
          iconUrl,
          highlightUrl: isDefault ? "" : resolveInteractionIconUrl(mode),
          highlighted: !isDefault,
          scale: isDefault ? baseScale : baseScale * this.resolveIconScale(mode?.iconScale, 1)
        });
      };
      applyImgStyles(container, null, true);

      // 6. 处理锚点 (originPoint)
      // CSS3D 默认中心对齐。可以根据 originPoint 调整 translate
      // 应用原点偏移 (基数放大10倍配合整体缩放)并兼容原点设置
      element.style.transform = `translate(${originX * 10}px, ${-originY * 10}px) ${originPoint === "bottom" ? "translateY(-50%)" : ""}`;

      // 7. 交互绑定
      const applyStyles = (el: HTMLElement, mode: InteractionMode | null, isDefault: boolean = false) => {
        const img = el.querySelector(".icon-background-default");
        const span = el.querySelector("span");
        const baseScale = this.getDefaultIconScale(el);
        const interactionScale = isDefault ? 1 : this.resolveIconScale(mode?.iconScale, 1);
        const visualScale = baseScale * interactionScale;

        // 图标图片更新
        if (img) {
          this.applyIconVisualState(el, {
            iconUrl,
            highlightUrl: isDefault ? "" : resolveInteractionIconUrl(mode),
            highlighted: !isDefault,
            scale: visualScale
          });
        }

        // 文字样式更新
        if (span) {
          const sFontSize = isDefault ? fontSize : mode?.fontSize || fontSize;
          const sColor = isDefault ? color : mode?.color || color;
          const sBg = isDefault ? textBg : resolveTextBackground(mode, textBg);

          const sWeight = isDefault ? fontWeight : mode?.fontWeight || fontWeight;
          const sStyle = isDefault ? fontStyle : mode?.fontStyle || fontStyle;

          span.style.fontSize = `${sFontSize * 10}px`;
          span.style.color = sColor;
          applyTextBackground(span as HTMLElement, sBg);
          span.style.fontWeight = sWeight;
          span.style.fontStyle = sStyle;

          span.style.transform = `translate(-50%, -50%) translate(${offsetX * offsetScale * interactionScale}px, ${-(offsetY * offsetScale * interactionScale)}px)`;
        }
      };

      const runtimeEntry: IconRuntimeEntry = {
        id: iconObj.userData.id,
        childId: id,
        index,
        data: { ...item, componentId: container.className },
        container,
        element,
        activeShow,
        activeTextFollow,
        hoverTextFollow,
        applyDefault: () => applyStyles(container, null, true),
        applyActive: () => applyStyles(container, activeMode),
        setTextVisible: (visible: boolean) => setTextVisible(container, visible)
      };
      this.iconRuntimeMap.set(runtimeEntry.id, runtimeEntry);

      const persistentHoverTextBg = resolveTextBackground(hoverMode, textBg);
      if (textContent && hoverShow && !hoverTextFollow && hasVisibleTextBackground(persistentHoverTextBg)) {
        applyStyles(container, hoverMode);
        applyImgStyles(container, null, true);
      }

      if (hoverShow || activeShow) {
        element.addEventListener("mouseenter", () => {
          if (hoverShow && !this.isIconActive(container)) {
            applyStyles(container, hoverMode);
            if (hoverTextFollow) {
              this.pauseCarousel(id);
              setTextVisible(container, true);
            }
          }
        });

        element.addEventListener("mouseleave", () => {
          if (hoverShow && !this.isIconActive(container)) {
            if (hoverTextFollow) {
              setTextVisible(container, false);
              this.resumeCarousel(id);
            }
            applyImgStyles(container, null, true);
          }
        });

        element.addEventListener("click", (e) => {
          e.stopPropagation();
          if (onClick) {
            onClick({ ...item, componentId: container.className }, e);
          }
          if (!activeShow) return;

          if (this.isIconActive(container)) {
            this.setEntryInactive(runtimeEntry, { restoreHoverText: true });
          } else {
            this.setEntryActive(runtimeEntry, { exclusive: true });
          }
        });
      }
    });

    const carouselItems: { container: HTMLElement; textSpan: HTMLElement }[] = [];
    Array.from(iconGroup.children).forEach((obj: any) => {
      if (obj.element) {
        const span = obj.element.querySelector(".icon-text");

        if (span) {
          // 文字样式更新
          if (JSON.stringify(hoverMode) !== "{}" && hoverMode.textFollow) {
            const sFontSize = hoverMode?.fontSize || 5;
            const sColor = hoverMode?.color;
            let sBg = hoverMode?.textBackground;

            if (hoverMode && getTextFillType(hoverMode) === "picture") {
              sBg = {
                type: "picture",
                url: hoverMode.textBackgroundUrl || "",
                color: typeof sBg === "string" ? sBg : (sBg as any)?.color || "transparent"
              };
            }

            const sWeight = hoverMode?.fontWeight;
            const sStyle = hoverMode?.fontStyle;

            span.style.fontSize = `${sFontSize * 10}px`;
            span.style.color = sColor;
            applyTextBackground(span as HTMLElement, sBg);
            span.style.fontWeight = sWeight;
            span.style.fontStyle = sStyle;
          }

          carouselItems.push({ container: obj.element, textSpan: span });
        }
      }
    });

    const isCarousel =
      (option.hoverMode?.textFollow && option.hoverMode?.textAnimation === "carousel") ||
      statusList.some((s) => s.textAnimation === "carousel");
    if (isCarousel && carouselItems.length > 0) {
      let interval = option.hoverMode?.textAnimationInterval || 1000;
      if (option.hoverMode?.textAnimation === "carousel" && option.hoverMode?.textAnimationInterval) {
        interval = option.hoverMode?.textAnimationInterval;
      } else {
        const activeStatus = statusList.find((s) => s.textAnimation === "carousel");
        if (activeStatus && activeStatus.textAnimationInterval) {
          interval = activeStatus.textAnimationInterval;
        }
      }

      carouselItems.forEach((item) => {
        item.textSpan.style.opacity = "0";
      });

      this.carouselStates.set(id, {
        items: carouselItems,
        currentIndex: 0,
        timer: null,
        interval: interval,
        highLightUrl: setMinioUrl(hoverMode?.highLightUrl || hoverMode?.url),
        iconUrl: setMinioUrl(option.url || "")
      });
      this.startCarousel(id);
    }
  }

  public setIconActiveByField(options: MapGlIconActiveOptions = {}) {
    const childId = String(options.childId || "");
    const field = String(options.field || "name");
    const targetValue = String(options.value ?? "");
    const action = options.action || "select";
    const exclusive = options.exclusive !== false;

    const matchedEntries = Array.from(this.iconRuntimeMap.values()).filter((entry) => {
      if (childId && entry.childId !== childId) {
        return false;
      }
      const matchedValue = this.getValueByPath(entry.data, field);
      return String(matchedValue ?? "") === targetValue;
    });

    if (matchedEntries.length === 0) {
      if (options.clearWhenMiss) {
        this.clearAllActiveIcons({ childId });
      }
      return false;
    }

    const targetEntry = matchedEntries[0];
    if (action === "unselect") {
      matchedEntries.forEach((entry) => this.setEntryInactive(entry));
      return true;
    }

    if (action === "toggle" && this.isIconActive(targetEntry.container)) {
      this.setEntryInactive(targetEntry);
      return true;
    }

    return this.setEntryActive(targetEntry, { exclusive, exclusiveChildId: childId || undefined });
  }

  public mountDom(componentId: string, options: { element: HTMLElement; boxOffsetX: number; boxOffsetY: number }) {
    const { element, boxOffsetX, boxOffsetY } = options;

    // 1. 构造一致的匹配 ID
    let uuid = componentId.replace(/--/g, "-");
    if (!this.iconItemMap.has(uuid) && componentId.includes("--")) {
      const parts = componentId.split("--");
      const id = parts[1] || parts[0];
      const index = parts[2] || "0";
      uuid = `mapGlIcon-${id}-${index}`;
    }

    const iconObj = this.iconItemMap.get(uuid);
    if (!iconObj || !iconObj.element) {
      console.warn(`[MapGlIconManager] 未找到 ID 为 ${uuid} 的图标实例`);
      return;
    }

    const className = `mounted-dom-${uuid}`;
    const existingDom = iconObj.element.querySelector(`.${className}`) as HTMLElement;

    // 2. 状态判断 (Toggle 显隐驱动)
    const isCurrentlyOpen = this.popupStateMap.get(uuid) || false;
    const nextState = !isCurrentlyOpen;

    // 实现“排他性”选中：关闭除当前 UUID 以外的所有正在显示的弹出框
    this.popupStateMap.forEach((isOpen, otherUuid) => {
      if (otherUuid !== uuid && isOpen) {
        // 查找并隐藏其他 DOM
        const otherIconObj = this.iconItemMap.get(otherUuid);
        if (otherIconObj && otherIconObj.element) {
          const otherDom = otherIconObj.element.querySelector(`.mounted-dom-${otherUuid}`) as HTMLElement;
          if (otherDom) {
            otherDom.style.display = "none";
          }
        }
        this.popupStateMap.set(otherUuid, false);
      }
    });

    // 3. 显隐当前目标
    if (existingDom) {
      existingDom.style.display = nextState ? "block" : "none";
      if (nextState) {
        existingDom.appendChild(element); // 再次挂载确保内容最新
      }
      this.popupStateMap.set(uuid, nextState);
    } else {
      // 首次挂载
      const containerElement = document.createElement("div");
      containerElement.className = className;
      containerElement.style.position = "absolute";
      containerElement.style.display = nextState ? "block" : "none";
      containerElement.style.left = `${boxOffsetX * 50}px`;
      containerElement.style.top = `${boxOffsetY * -50}px`;
      if (nextState) {
        containerElement.appendChild(element);
      }
      iconObj.element.appendChild(containerElement);
      this.popupStateMap.set(uuid, nextState);
    }
  }

  private triggerNextCarousel(id: string) {
    const s = this.carouselStates.get(id);
    if (!s) return;
    if (!this.isIconActive(s.items[s.currentIndex].container)) {
      s.items[s.currentIndex].textSpan.style.opacity = "0";
      this.applyIconVisualState(s.items[s.currentIndex].container, {
        iconUrl: s.iconUrl,
        highlightUrl: s.highLightUrl,
        highlighted: false,
        scale: this.getDefaultIconScale(s.items[s.currentIndex].container)
      });
    }

    s.currentIndex = (s.currentIndex + 1) % s.items.length;

    if (!this.isIconActive(s.items[s.currentIndex].container)) {
      s.items[s.currentIndex].textSpan.style.opacity = "1";
      this.applyIconVisualState(s.items[s.currentIndex].container, {
        iconUrl: s.iconUrl,
        highlightUrl: s.highLightUrl,
        highlighted: Boolean(s.highLightUrl),
        scale: this.getDefaultIconScale(s.items[s.currentIndex].container)
      });
    }

    s.timer = setTimeout(() => this.triggerNextCarousel(id), s.interval);
  }

  /**
   * 暂停指定图层的文字轮播
   * @param id 图层ID
   */
  public pauseCarousel(id: string) {
    const state = this.carouselStates.get(id);
    if (state) {
      if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
      // 暂停时隐藏当前正在显示的文字（如果不是激活态）
      const currentItem = state.items[state.currentIndex];
      if (currentItem && !this.isIconActive(currentItem.container)) {
        currentItem.textSpan.style.opacity = "0";
        this.applyIconVisualState(currentItem.container, {
          iconUrl: state.iconUrl,
          highlightUrl: state.highLightUrl,
          highlighted: false,
          scale: this.getDefaultIconScale(currentItem.container)
        });
      }
    }
  }

  /**
   * 继续指定图层的文字轮播
   * @param id 图层ID
   */
  public resumeCarousel(id: string) {
    const state = this.carouselStates.get(id);
    if (state && !state.timer) {
      state.timer = setTimeout(() => this.triggerNextCarousel(id), state.interval);
    }
  }

  private startCarousel(id: string) {
    const state = this.carouselStates.get(id);
    if (!state || state.items.length === 0) return;

    if (!this.isIconActive(state.items[state.currentIndex].container)) {
      state.items[state.currentIndex].textSpan.style.opacity = "1";
      this.applyIconVisualState(state.items[state.currentIndex].container, {
        iconUrl: state.iconUrl,
        highlightUrl: state.highLightUrl,
        highlighted: Boolean(state.highLightUrl),
        scale: this.getDefaultIconScale(state.items[state.currentIndex].container)
      });
    }
    state.timer = setTimeout(() => this.triggerNextCarousel(id), state.interval);
  }

  // Reusable temp vectors to avoid per-frame allocations in animate()
  private _tmpWorldPos = new THREE.Vector3();
  private _tmpCamPos = new THREE.Vector3();

  public animate(camera: any | null) {
    if (!camera) return;

    this.iconsMap.forEach((group) => {
      group.children.forEach((obj: THREE.Object3D) => {
        const { followCamera } = obj.userData;

        if (followCamera === "horizontal") {
          // 只在 Y 轴朝向相机
          obj.getWorldPosition(this._tmpWorldPos);
          camera.getWorldPosition(this._tmpCamPos);

          // 计算 Y 轴旋转，使对象面对相机
          const dx = this._tmpCamPos.x - this._tmpWorldPos.x;
          const dz = this._tmpCamPos.z - this._tmpWorldPos.z;
          const angle = Math.atan2(dx, dz);

          // 如果对象有父级（如 mapGroup 旋转），需要减去父级的 Y 旋转
          let parentY = 0;
          let p = obj.parent;
          while (p) {
            parentY += p.rotation.y;
            p = p.parent;
          }

          obj.rotation.y = angle - parentY;
        }
      });
    });
  }

  public remove(id: string) {
    const state = this.carouselStates.get(id);
    if (state && state.timer) {
      clearTimeout(state.timer);
    }
    this.carouselStates.delete(id);

    Array.from(this.iconRuntimeMap.values()).forEach((entry) => {
      if (entry.childId === id) {
        this.activeIcons.delete(entry.container);
        if (this.activeIcon === entry.container) {
          this.activeIcon = null;
        }
        this.iconRuntimeMap.delete(entry.id);
        this.iconItemMap.delete(entry.id);
        this.popupStateMap.delete(entry.id);
      }
    });

    const group = this.iconsMap.get(id);
    if (group) {
      if (group.parent) {
        group.parent.remove(group);
      }

      // 显式清理 DOM 元素，确保立即销毁
      group.traverse((obj: any) => {
        // CSS3DSprite (and CSS3DObject) instances have an 'element' property pointing to the DOM element
        // and 'isCSS3DObject' property set to true.
        if (obj.isCSS3DObject && obj.element && obj.element.parentNode) {
          obj.element.parentNode.removeChild(obj.element);
        }
      });

      this.iconsMap.delete(id);
    }
  }

  public dispose() {
    this.iconsMap.forEach((_, id) => {
      this.remove(id);
    });
    this.iconsMap.clear();
    this.iconItemMap.clear();
    this.iconRuntimeMap.clear();
    this.activeIcons.clear();
    this.activeIcon = null;
  }
}
