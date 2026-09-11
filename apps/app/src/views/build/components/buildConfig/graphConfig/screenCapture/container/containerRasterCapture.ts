/**
 * 面板 / 组组件共用：按 componentList 子项坐标离屏合成栅格
 * video 走 VideoDataCapture 数据层，其余子项走 capturePerComponent
 */
import { CFG } from "../captureConfig";
import { asHtml, Geometry, Utils } from "../captureUtils";
import type {
  CaptureComponentItem,
  CaptureLayer,
  ComponentList,
  DesignSize,
  ModuleDescriptor
} from "../types/captureInternal";
import { VideoDataCapture } from "../videoDataCapture";

const canvasCtx = (canvas: HTMLCanvasElement) => canvas.getContext("2d")!;

function loadDataUrlImage(dataUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export interface ContainerChildRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ContainerRasterContext {
  designW: number;
  designH: number;
  backgroundColor?: string | null;
  children: CaptureComponentItem[];
  resolveChildRect: (child: CaptureComponentItem) => ContainerChildRect | null;
  containerHost: HTMLElement;
  viewWrapper: HTMLElement;
  designSize: DesignSize;
  componentList: ComponentList;
  videoLogLabel: string;
  findChildHost: (childId: string | number) => HTMLElement | null;
  hideSiblings: (activeChildId: string | number) => () => void;
  capturePerComponent: (
    descriptor: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ) => Promise<CaptureLayer | null>;
}

/** 面板 / 组内截图时隐藏兄弟子组件，避免 html2canvas 串层 */
export function hideContainerSiblingsForCapture(
  containerHost: HTMLElement,
  activeChildId: string | number
): () => void {
  const stash: Array<{
    el: HTMLElement;
    visibility: string;
    opacity: string;
    display: string;
  }> = [];
  if (!containerHost) {
    return () => {};
  }
  containerHost.querySelectorAll("[data-id]").forEach((node) => {
    const host = asHtml(node);
    if (!host) {
      return;
    }
    const id = host.getAttribute("data-id");
    if (!id || String(id) === String(activeChildId) || String(id) === String(containerHost.getAttribute("data-id"))) {
      return;
    }
    stash.push({
      el: host,
      visibility: host.style.visibility,
      opacity: host.style.opacity,
      display: host.style.display
    });
    host.style.visibility = "hidden";
    host.style.opacity = "0";
    host.style.display = "none";
  });
  return () => {
    stash.forEach(({ el, visibility, opacity, display }) => {
      el.style.visibility = visibility;
      el.style.opacity = opacity;
      el.style.display = display;
    });
  };
}

export async function buildRasterFromContainerData(ctx: ContainerRasterContext): Promise<string | null> {
  const { designW, designH } = ctx;
  if (!designW || !designH || !ctx.children.length) {
    return null;
  }

  const scale = CFG.layerScale;
  const outW = Math.max(1, Math.round(designW * scale));
  const outH = Math.max(1, Math.round(designH * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const g = canvasCtx(canvas);

  if (ctx.backgroundColor) {
    g.fillStyle = ctx.backgroundColor;
    g.fillRect(0, 0, outW, outH);
  }

  let painted = 0;
  for (const child of ctx.children) {
    const childId = child.id;
    if (childId == null) {
      continue;
    }

    const rect = ctx.resolveChildRect(child);
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      continue;
    }

    const dx = (rect.left / designW) * outW;
    const dy = (rect.top / designH) * outH;
    const dw = (rect.width / designW) * outW;
    const dh = (rect.height / designH) * outH;

    if (VideoDataCapture.isVideoComponentItem(child)) {
      const restoreSiblings = ctx.hideSiblings(childId);
      let dataUrl: string | null = null;
      try {
        const childHost = ctx.findChildHost(childId);
        dataUrl = await VideoDataCapture.captureContainerChildVideo(child, ctx.componentList, childHost, 0);
        if (dataUrl) {
          Utils.log("info", ctx.videoLogLabel, childId);
        }
      } finally {
        restoreSiblings();
      }
      if (dataUrl) {
        const img = await loadDataUrlImage(dataUrl);
        if (img) {
          g.drawImage(img, dx, dy, dw, dh);
          painted++;
        }
      }
      continue;
    }

    const childHost = ctx.findChildHost(childId);
    if (!childHost) {
      continue;
    }
    const restoreSiblings = ctx.hideSiblings(childId);
    const childBox = Geometry.getShapeBox(childHost);
    let single: CaptureLayer | null = null;
    try {
      single = await ctx.capturePerComponent(
        {
          id: String(childId),
          box: childBox,
          host: childHost,
          designRect: rect,
          zIndex: Number(child.zIndex) || 0,
          primaryMode: "dom",
          strategies: ["dom"]
        },
        ctx.viewWrapper,
        ctx.designSize,
        ctx.componentList
      );
    } finally {
      restoreSiblings();
    }
    if (single?.dataUrl) {
      const img = await loadDataUrlImage(single.dataUrl);
      if (img) {
        g.drawImage(img, dx, dy, dw, dh);
        painted++;
      }
    }
  }

  if (!painted) {
    return null;
  }
  return Utils.safeCanvasToDataUrl(canvas, "image/png");
}
