import { CFG } from "../captureConfig";
import { Utils } from "../captureUtils";
import { ChartCapture } from "../media/chartCapture";
import type { ImageCaptureApi } from "../media/imageCaptureTypes";
import { UeStreamCapture } from "../media/ueStreamCapture";
import { VideoNormal } from "../media/videoNormal";
import { FontDomCapture } from "../strategies/fontDomCapture";
import { Transform3DCapture } from "../transform3dCapture";
import type { SnapshotMap, SnapshotMarkFn } from "../types/captureInternal";

/** 单组件管线（面板内 / 组内 / 叶子共用） */
export function createSingleComponentCapture(imageCapture: ImageCaptureApi) {
  return {
    analyze(host: HTMLElement, box: HTMLElement) {
      return {
        pixelStream: UeStreamCapture.isHost(host) || UeStreamCapture.getStreamVideos(host).length > 0,
        normalVideo: VideoNormal.detectInHost(host),
        echarts: !!host.querySelector("[_echarts_instance_]"),
        canvas: !!host.querySelector("canvas"),
        webglCanvas: !!host.querySelector(".three-scene canvas, canvas.maptalks-canvas, canvas[data-engine]"),
        image: imageCapture.detectInHost(host, box),
        textDom: FontDomCapture.detectInHost(host),
        svg: !!host.querySelector("svg")
      };
    },

    collectNativeCanvasSnapshots(root: HTMLElement, snapshots: SnapshotMap, mark: SnapshotMarkFn) {
      root.querySelectorAll("canvas").forEach((canvas) => {
        if (canvas.hasAttribute(CFG.captureAttr) || !Utils.isVisible(canvas)) {
          return;
        }
        if (canvas.closest("[_echarts_instance_]")) {
          return;
        }
        try {
          const dataUrl = canvas.toDataURL("image/png");
          if (dataUrl && dataUrl !== "data:,") {
            mark(canvas, { dataUrl, rect: canvas.getBoundingClientRect(), tag: "canvas" });
          }
        } catch {
          /* WebGL 跨域污染时跳过 */
        }
      });
    },

    collectChartAndCanvasSnapshots(root: HTMLElement, snapshots: SnapshotMap, mark: SnapshotMarkFn) {
      ChartCapture.collectSnapshots(root, snapshots, mark);
      this.collectNativeCanvasSnapshots(root, snapshots, mark);
    },

    applyMediaPatchesOnClone(clonedDoc: Document | HTMLElement, snapshots: SnapshotMap, liveRoot?: HTMLElement) {
      const { ownerDoc, queryRoot } = Utils.getClonePatchContext(clonedDoc);
      ChartCapture.applySnapshotsOnClone(clonedDoc, snapshots);
      VideoNormal.applySnapshotsOnClone(clonedDoc, snapshots);
      imageCapture.applyBgSnapshotsOnClone(clonedDoc, snapshots);
      imageCapture.applyImgSnapshotsOnClone(clonedDoc, snapshots, liveRoot);

      queryRoot.querySelectorAll("svg").forEach((svg) => {
        try {
          const rect = svg.getBoundingClientRect();
          const w = Math.max(1, Math.round(rect.width));
          const h = Math.max(1, Math.round(rect.height));
          const svgText = new XMLSerializer().serializeToString(svg);
          const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText);
          const img = ownerDoc.createElement("img");
          img.src = dataUrl;
          img.style.width = w + "px";
          img.style.height = h + "px";
          img.style.display = "block";
          if (svg.parentNode) {
            svg.parentNode.replaceChild(img, svg);
          }
        } catch {
          /* ignore */
        }
      });
    },

    patchClone(clonedDoc: Document, liveRoot: HTMLElement, snapshots: SnapshotMap) {
      this.applyMediaPatchesOnClone(clonedDoc, snapshots, liveRoot);
      Transform3DCapture.patchInClone(clonedDoc, liveRoot);
      FontDomCapture.flattenInClone(clonedDoc, liveRoot);
    }
  };
}

export type SingleComponentCapture = ReturnType<typeof createSingleComponentCapture>;
