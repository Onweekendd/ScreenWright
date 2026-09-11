import { snapdom } from "@zumer/snapdom";

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

/** 简单模式：整屏 snapdom 一次截取 */
async function captureEditorScreenShotSimple(
  dom: HTMLElement,
  mimeType: ScreenShotOptions["mimeType"] = "image/jpeg"
): Promise<ScreenShotResult> {
  const canvas = await snapdom.toCanvas(dom, {
    scale: 1,
    embedFonts: true,
    fast: true
  });
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
 */
export async function captureEditorScreenShot(options: ScreenShotOptions = {}): Promise<ScreenShotResult | null> {
  const { canvas, editor, componentList, mimeType = "image/jpeg", screenShotMode = "full" } = options;

  if (screenShotMode === "simple") {
    if (!canvas) {
      return null;
    }
    const dom = resolveCaptureElement(canvas);
    if (!dom) {
      return null;
    }
    return captureEditorScreenShotSimple(dom, mimeType);
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
