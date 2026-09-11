/** 大屏分层截图入口 */
import { CFG } from "./captureConfig";
import {
  BiCaptureEntry,
  ChartCapture,
  DomOverlayCapture,
  Readiness,
  ScreenCompositor,
  VideoNormal
} from "./captureStrategies";
import { ComponentTreeCapture, Geometry, Utils } from "./captureUtils";
import type { LayerCaptureOptions } from "./types";

export async function runLayerCompositeCapture(options: LayerCaptureOptions = {}): Promise<string | null> {
  const { componentList = [], mode = "editor", mimeType = "image/png" } = options;
  const captureStrategy = options.captureStrategy ?? "composite";

  CFG.delay = mode === "editor" ? 800 : 4000;
  VideoNormal._playbackRestoreQueue.length = 0;

  const zMap = Geometry.buildZIndexMap(componentList);
  let unmarkWrapper = () => {};

  try {
    const scope = await BiCaptureEntry.resolveScope({ ...options, mode });
    unmarkWrapper = BiCaptureEntry.markCaptureWrapper(scope.canvas);

    Utils.log("info", "截图作用域", {
      root: scope.root.id || scope.root.className,
      canvas: scope.canvas.id || scope.canvas.className,
      editor: scope.editor.id || scope.editor.className,
      designSize: scope.designSize
    });

    if (CFG.delay > 0) {
      await Utils.sleep(CFG.delay);
    }
    if (mode === "editor" && ComponentTreeCapture.countPanelComponents(componentList) > 0) {
      await Utils.sleep(1500);
    }
    await Readiness.waitFonts();
    await ChartCapture.waitReady(scope.canvas);
    await VideoNormal.waitReady(scope.canvas);
    await Readiness.waitPanelContentReady(scope.canvas, componentList);
    await Readiness.waitImagesReady(scope.canvas);
    await Readiness.waitComplexDomReady(scope.canvas);
    if (mode === "preview") {
      await Readiness.waitPageContentReady(scope.canvas);
    }
    await Utils.waitFrames(6);

    if (captureStrategy === "panelStitch") {
      Utils.log("info", "截图策略: panelStitch");
      return await ScreenCompositor.capturePanelStitch(scope, componentList, zMap, mimeType);
    }

    if (captureStrategy === "single") {
      const hasPanels = ComponentTreeCapture.countPanelComponents(componentList) > 0;
      if (hasPanels) {
        return await ScreenCompositor.capturePanelStitch(scope, componentList, zMap, mimeType);
      }
      Utils.log("info", "截图策略: single snapdom");
      return await DomOverlayCapture.captureOnce(scope, mimeType, componentList);
    }

    Utils.log("info", "截图策略: composite");
    return await ScreenCompositor.capture(scope.canvas, scope.root, zMap, componentList, mimeType);
  } catch (error) {
    Utils.log("error", error);
    return null;
  } finally {
    await VideoNormal.restoreAfterCapture();
    unmarkWrapper();
  }
}
