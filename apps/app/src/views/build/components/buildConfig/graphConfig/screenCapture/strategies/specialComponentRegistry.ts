/** 特殊单组件 DOM 标记（html2canvas 无法正确还原，需 snapdom 独立图层） */
export interface SpecialComponentMarker {
  key: string;
  label: string;
  /** 用于 host 匹配 */
  selectors: string[];
  /** snapdom 优先截取节点；缺省同 selectors */
  rasterSelectors?: string[];
  /** 就绪等待：需有可见子节点/图片 */
  readySelectors?: string[];
}

export const SPECIAL_COMPONENT_MARKERS: SpecialComponentMarker[] = [
  {
    key: "imagesList3d",
    label: "3D图片列表",
    selectors: [".imagesList3d"],
    rasterSelectors: [".imagesList3d"],
    readySelectors: [".imagesList3d .spin-point", ".imagesList3d img", ".drag-container img"]
  },
  {
    key: "ringIndicator3d",
    label: "3D圆型指标",
    selectors: [".ringIndicator3d"],
    rasterSelectors: [".ringIndicator3d", ".carousel", "figure.spinner"],
    readySelectors: [".ringIndicator3d .spinner-item", ".ringIndicator3d figure.spinner"]
  },
  {
    key: "ringIndicator3dNew",
    label: "3D圆型指标v2",
    selectors: [".ringIndicator3dNew"],
    rasterSelectors: [".ringIndicator3dNew", ".carousel", "figure.spinner"],
    readySelectors: [".ringIndicator3dNew .spinner-item", ".ringIndicator3dNew figure.spinner"]
  },
  {
    key: "swiperCard",
    label: "轮播卡片",
    selectors: [".ft-swiperCard"],
    rasterSelectors: [".ft-swiperCard", ".carousel", "figure.spinner"],
    readySelectors: [".ft-swiperCard figure.spinner", ".ft-swiperCard .spinner-item", ".ft-swiperCard img"]
  },
  {
    key: "swiper",
    label: "轮播图",
    selectors: [".ft-swiper"],
    rasterSelectors: [".ft-swiper"],
    readySelectors: [".ft-swiper .el-carousel__item", ".ft-swiper img"]
  },
  {
    key: "particles",
    label: "上升粒子",
    selectors: [".particles-js-canvas-el", ".simple-particle", ".ext-container"],
    rasterSelectors: [".ext-container", ".simple-particle", ".particles-js-canvas-el"],
    readySelectors: [".particles-js-canvas-el", ".simple-particle canvas", ".ext canvas"]
  }
];

/** 供 querySelector 使用的合并选择器 */
export const SPECIAL_COMPONENT_SELECTOR = SPECIAL_COMPONENT_MARKERS.flatMap((m) => m.selectors).join(", ");

const OVERFLOW_CHAIN_SELECTOR = [
  ".go-shape-box",
  ".ft-swiperCard",
  ".ft-swiper",
  ".imagesList3d",
  ".ringIndicator3d",
  ".ringIndicator3dNew",
  ".carousel",
  ".carousel-3d-container"
].join(", ");

export function hostHasSpecialMarker(host: HTMLElement | null | undefined): boolean {
  if (!host) {
    return false;
  }
  try {
    if (host.matches(SPECIAL_COMPONENT_SELECTOR)) {
      return true;
    }
  } catch {
    /* 部分选择器不支持 matches */
  }
  return !!host.querySelector(SPECIAL_COMPONENT_SELECTOR);
}

export function detectSpecialComponentKey(host: HTMLElement): string | null {
  for (const marker of SPECIAL_COMPONENT_MARKERS) {
    const sel = marker.selectors.join(", ");
    try {
      if (host.matches(sel) || host.querySelector(sel)) {
        return marker.key;
      }
    } catch {
      if (host.querySelector(sel)) {
        return marker.key;
      }
    }
  }
  return null;
}

export function findSpecialMarker(host: HTMLElement): SpecialComponentMarker | null {
  const key = detectSpecialComponentKey(host);
  if (!key) {
    return null;
  }
  return SPECIAL_COMPONENT_MARKERS.find((m) => m.key === key) || null;
}

/** snapdom 截取目标：优先组件内层根，否则模块 host */
export function findSpecialRasterTarget(host: HTMLElement): HTMLElement | null {
  const marker = findSpecialMarker(host);
  if (!marker) {
    return null;
  }
  const candidates = marker.rasterSelectors || marker.selectors;
  for (const sel of candidates) {
    const el = host.querySelector(sel);
    if (el instanceof HTMLElement && el.getBoundingClientRect().width > 0) {
      return el;
    }
  }
  for (const sel of marker.selectors) {
    if (host.matches(sel)) {
      return host;
    }
  }
  return null;
}

/** 截图时强制 overflow:visible，避免 3D 内容被 shape-box 裁切 */
export function prepareOverflowForCapture(host: HTMLElement) {
  const touched = new Set<HTMLElement>();
  const stash: Array<{ el: HTMLElement; overflow: string; overflowX: string; overflowY: string }> = [];

  const touch = (el: HTMLElement | null) => {
    if (!el || touched.has(el)) {
      return;
    }
    touched.add(el);
    stash.push({
      el,
      overflow: el.style.overflow,
      overflowX: el.style.overflowX,
      overflowY: el.style.overflowY
    });
    el.style.overflow = "visible";
    el.style.overflowX = "visible";
    el.style.overflowY = "visible";
  };

  touch(host);
  host.querySelectorAll(OVERFLOW_CHAIN_SELECTOR).forEach((node) => {
    if (node instanceof HTMLElement) {
      touch(node);
    }
  });

  return () => {
    stash.forEach(({ el, overflow, overflowX, overflowY }) => {
      el.style.overflow = overflow;
      el.style.overflowX = overflowX;
      el.style.overflowY = overflowY;
    });
  };
}

export function collectReadySelectors(host: HTMLElement): string[] {
  const marker = findSpecialMarker(host);
  const selectors = marker?.readySelectors?.length ? marker.readySelectors : ["img[src]"];
  return selectors.filter((sel) => {
    try {
      return !!host.querySelector(sel);
    } catch {
      return false;
    }
  });
}

/** 从独立层 id 还原模块 id */
export function specialLayerIdToModuleId(layerId: string): string {
  return String(layerId).replace(/-special$/, "");
}
