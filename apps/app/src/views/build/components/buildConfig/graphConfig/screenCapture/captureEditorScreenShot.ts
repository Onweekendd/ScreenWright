import { snapdom } from "@zumer/snapdom";

import { withCullingSuspended } from "../../../buildRender/hooks/cullingSuspend";
import { runLayerCompositeCapture } from "./layerCompositeCapture";
import { promptEditorScreenShotMode } from "./promptEditorScreenShotMode";
import type { CaptureElementRef, ScreenShotOptions, ScreenShotResult } from "./types";

function resolveCaptureElement(ref: CaptureElementRef): HTMLElement | null {
  if (!ref) {
    return null;
  }
  if (typeof ref === "string") {
    return ref.startsWith("#")
      ? document.getElementById(ref.slice(1))
      : (document.querySelector(ref) as HTMLElement | null);
  }
  return ref;
}

/**
 * 临时去掉祖先上的 transform，返回恢复函数。
 *
 * 无限画布把相机（平移 + 缩放）挂在画布的父容器上，snapdom 会把祖先的缩放带进截图：
 * 输出尺寸是设计稿尺寸，内容却按当前缩放比缩在左上角。截图期间把祖先 transform 置为 none，
 * 截到的就是 1:1 的设计稿。
 */
function neutralizeAncestorTransforms(dom: HTMLElement): () => void {
  const stash: Array<{ el: HTMLElement; transform: string }> = [];
  for (let el = dom.parentElement; el && el !== document.body; el = el.parentElement) {
    if (getComputedStyle(el).transform !== "none") {
      stash.push({ el, transform: el.style.transform });
      el.style.transform = "none";
    }
  }
  return () => stash.forEach(({ el, transform }) => (el.style.transform = transform));
}

/** 简单模式：整屏 snapdom 一次截取 */
async function captureEditorScreenShotSimple(
  dom: HTMLElement,
  { mimeType = "image/jpeg", scale = 1, backgroundColor, exclude, dpr, outerShadows }: ScreenShotOptions = {}
): Promise<ScreenShotResult> {
  const restoreTransforms = neutralizeAncestorTransforms(dom);
  let canvas: HTMLCanvasElement;
  try {
    canvas = await snapdom.toCanvas(dom, {
      scale,
      embedFonts: true,
      fast: true,
      backgroundColor,
      exclude,
      dpr,
      outerShadows
    });
  } finally {
    restoreTransforms();
  }
  const isJpeg = mimeType === "image/jpeg";
  const dataUrl = canvas.toDataURL(isJpeg ? "image/jpeg" : "image/png", isJpeg ? 0.92 : undefined);
  const ext = isJpeg ? "jpg" : "png";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b: Blob | null) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      mimeType,
      isJpeg ? 0.92 : undefined
    );
  });
  return {
    dataUrl,
    file: new File([blob], `screenshot.${ext}`, { type: mimeType })
  };
}

/**
 * 构建页 editor 截图（完整 / 简单模式）
 *
 * 截图期间暂停画布裁剪：移出可视窗口的组件平时是 display: none 的，不暂停就会从截图里消失。
 */
export function captureEditorScreenShot(options: ScreenShotOptions = {}): Promise<ScreenShotResult | null> {
  return withCullingSuspended(() => captureEditorScreenShotUncovered(options));
}

async function captureEditorScreenShotUncovered(options: ScreenShotOptions): Promise<ScreenShotResult | null> {
  const { canvas, editor, componentList, mimeType = "image/jpeg", screenShotMode = "full" } = options;

  if (screenShotMode === "simple") {
    if (!canvas) {
      return null;
    }
    const dom = resolveCaptureElement(canvas);
    if (!dom) {
      return null;
    }
    return captureEditorScreenShotSimple(dom, options);
  }

  const dataUrl = await runLayerCompositeCapture({
    componentList,
    canvas,
    editor,
    mode: "editor",
    mimeType,
    captureStrategy: "composite"
  });
  if (!dataUrl) {
    return null;
  }

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = mimeType === "image/jpeg" ? "jpg" : "png";
  return {
    dataUrl,
    file: new File([blob], `screenshot.${ext}`, { type: mimeType })
  };
}

/**
 * 弹窗选择模式后执行构建页封面截图
 */
export async function captureEditorScreenShotWithPrompt(
  options: Omit<ScreenShotOptions, "screenShotMode"> = {}
): Promise<ScreenShotResult | null> {
  const screenShotMode = await promptEditorScreenShotMode();
  if (!screenShotMode) {
    return null;
  }
  return captureEditorScreenShot({ ...options, screenShotMode });
}

export { promptEditorScreenShotMode };
