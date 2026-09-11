import { CFG } from "../captureConfig";
import { Utils } from "../captureUtils";
import type { SnapshotMap, SnapshotMarkFn } from "../types/captureInternal";

export const ChartCapture = {
  getHosts(root: HTMLElement) {
    return Array.from(root.querySelectorAll("[_echarts_instance_]")).filter(
      (node): node is HTMLElement => node instanceof HTMLElement && Utils.isVisible(node)
    );
  },

  isHostReady(host: HTMLElement) {
    const api = window.echarts;
    if (api && api.getInstanceByDom) {
      const inst = api.getInstanceByDom(host);
      if (inst && !inst.isDisposed()) {
        return true;
      }
    }
    const canvas = host.querySelector("canvas");
    return !!(canvas && canvas.width > 0 && canvas.height > 0);
  },

  async waitReady(root: HTMLElement) {
    const deadline = Date.now() + CFG.chartWaitMax;
    while (Date.now() < deadline) {
      const hosts = this.getHosts(root);
      if (!hosts.length) {
        return;
      }
      if (hosts.every((h) => this.isHostReady(h))) {
        const api = window.echarts;
        if (api && api.getInstanceByDom) {
          hosts.forEach((host) => {
            const inst = api.getInstanceByDom(host);
            if (inst && !inst.isDisposed()) {
              try {
                inst.resize();
              } catch {
                /* ignore */
              }
            }
          });
        }
        await Utils.waitFrames(8);
        return;
      }
      await Utils.sleep(CFG.poll);
    }
  },

  collectSnapshots(root: HTMLElement, snapshots: SnapshotMap, mark: SnapshotMarkFn) {
    root.querySelectorAll("[_echarts_instance_]").forEach((node) => {
      const host = node instanceof HTMLElement ? node : null;
      if (!host || !Utils.isVisible(host)) {
        return;
      }
      const canvas = host.querySelector("canvas");
      if (!canvas) {
        return;
      }
      let dataUrl = "";
      try {
        const api = window.echarts;
        if (api && api.getInstanceByDom) {
          const inst = api.getInstanceByDom(host);
          if (inst && !inst.isDisposed()) {
            dataUrl = inst.getDataURL({
              type: "png",
              pixelRatio: Math.max(1, window.devicePixelRatio || 1),
              backgroundColor: "transparent"
            });
          }
        }
        if (!dataUrl || dataUrl === "data:,") {
          dataUrl = canvas.toDataURL("image/png");
        }
      } catch {
        /* ignore */
      }
      if (dataUrl && dataUrl !== "data:,") {
        mark(canvas, { dataUrl, rect: canvas.getBoundingClientRect(), tag: "chart" });
      }
    });
  },

  applySnapshotsOnClone(clonedDoc: Document | HTMLElement, snapshots: SnapshotMap) {
    const { ownerDoc, queryRoot } = Utils.getClonePatchContext(clonedDoc);
    const attr = CFG.captureAttr;
    const nodeToImg = (node: Element | null, payload: { dataUrl: string | null; rect: DOMRect }) => {
      if (!node || !payload?.dataUrl) {
        return;
      }
      const w = Math.max(1, Math.round(payload.rect.width));
      const h = Math.max(1, Math.round(payload.rect.height));
      const img = ownerDoc.createElement("img");
      img.src = payload.dataUrl;
      img.style.width = w + "px";
      img.style.height = h + "px";
      img.style.display = "block";
      if (node.parentNode) {
        node.parentNode.replaceChild(img, node);
      }
    };
    snapshots.forEach((payload, sid) => {
      if (payload.tag === "bg") {
        return;
      }
      const node = queryRoot.querySelector("[" + attr + '="' + sid + '"]');
      if (!node || node.tagName === "LI") {
        return;
      }
      nodeToImg(node, payload);
    });
  }
};
