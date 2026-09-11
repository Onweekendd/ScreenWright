import { CFG } from "../captureConfig";
import { ComponentTreeCapture, Utils } from "../captureUtils";
import { castHtml } from "../dom/captureDomHelpers";
import { ChartCapture } from "../media/chartCapture";
import { UeStreamCapture } from "../media/ueStreamCapture";
import { hostHasSpecialMarker, SpecialComponentStrategy } from "../strategies";
import type { ComponentList } from "../types/captureInternal";

export const Readiness = {
  async waitLoadingGone() {
    const deadline = Date.now() + CFG.loadingWait;
    while (Date.now() < deadline) {
      const masks = document.querySelectorAll("#screenwright-loading-mask, .loading-mask-scene, .loading-mask");
      if (!Array.from(masks).some((el) => Utils.isVisible(el))) {
        return;
      }
      await Utils.sleep(CFG.poll);
    }
  },

  async waitCaptureTargets() {
    const deadline = Date.now() + CFG.loadingWait;
    while (Date.now() < deadline) {
      const root = document.querySelector(".bi-view");
      const canvas = (root && root.querySelector(".view-wrapper")) || document.querySelector(".view-wrapper");
      if (root && Utils.isVisible(castHtml(root)) && canvas && Utils.isVisible(castHtml(canvas))) {
        return { root, canvas };
      }
      await Utils.sleep(CFG.poll);
    }
    throw new Error("大屏未加载完成，请刷新页面后再试");
  },

  async waitFonts() {
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    } catch {
      /* ignore */
    }
  },

  async waitImagesReady(root: HTMLElement, timeoutMs = CFG.imageLoadTimeout) {
    if (!root) {
      return;
    }
    const imgs = Array.from(root.querySelectorAll("img[src]")).filter((node): node is HTMLImageElement => {
      if (!(node instanceof HTMLImageElement)) {
        return false;
      }
      const src = node.currentSrc || node.src;
      return !!src && Utils.isVisible(node);
    });
    if (!imgs.length) {
      return;
    }
    const pending = imgs.filter((img) => !img.complete || img.naturalWidth <= 0);
    if (!pending.length) {
      return;
    }
    Utils.log("info", "等待图片加载:", pending.length);
    await Promise.race([
      Promise.all(
        pending.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve();
                return;
              }
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            })
        )
      ),
      Utils.sleep(timeoutMs)
    ]);
    await Utils.waitFrames(2);
  },

  async waitComplexDomReady(root: HTMLElement) {
    const hosts = Array.from(root.querySelectorAll("[data-id]")).filter(
      (h): h is HTMLElement => h instanceof HTMLElement && hostHasSpecialMarker(h)
    );
    if (!hosts.length || !SpecialComponentStrategy) {
      return;
    }
    Utils.log("info", "等待特殊 DOM 组件就绪:", hosts.length);
    for (const host of hosts) {
      await SpecialComponentStrategy.waitHostReady(host as HTMLElement);
    }
  },

  async waitPageContentReady(root: HTMLElement) {
    const deadline = Date.now() + CFG.contentWaitMax;
    const ueDeadline = Date.now() + CFG.ueWaitMax;
    while (Date.now() < deadline) {
      const ueOk = UeStreamCapture.isReady(root) || Date.now() > ueDeadline;
      const charts = ChartCapture.getHosts(root);
      const chartsOk = !charts.length || charts.every((h) => ChartCapture.isHostReady(h));
      if (ueOk && chartsOk) {
        await Utils.sleep(600);
        return;
      }
      await Utils.sleep(CFG.poll);
    }
  },

  async waitPanelContentReady(root: HTMLElement, componentList: ComponentList) {
    const panelCount = ComponentTreeCapture.countPanelComponents(componentList);
    if (!panelCount) {
      return;
    }

    Utils.log("info", "等待面板内容渲染, 面板数:", panelCount);
    const deadline = Date.now() + CFG.contentWaitMax;

    while (Date.now() < deadline) {
      const quoteLoading = Array.from(root.querySelectorAll(".quote-panel")).some((panel) => {
        const mask = panel.querySelector(".el-loading-mask");
        return mask && Utils.isVisible(mask);
      });

      const quotePanels = root.querySelectorAll(".quote-panel");
      const quoteReady =
        !quotePanels.length ||
        Array.from(quotePanels).every((panel) => {
          const hasInner = panel.querySelector(".screen-quote [data-id]");
          const loading = panel.querySelector(".el-loading-mask");
          return hasInner || !(loading && Utils.isVisible(loading));
        });

      const dynamicReady = Array.from(root.querySelectorAll(".ft-panel")).every((panel) => {
        const panelId = panel.closest("[data-id]")?.getAttribute("data-id");
        if (!panelId) {
          return true;
        }
        const item = ComponentTreeCapture.findComponentById(componentList, panelId);
        if (!item || !ComponentTreeCapture.isPanelComponent(item)) {
          return true;
        }
        const configs = ComponentTreeCapture.getActivePanelConfigs(item);
        const expected = configs.reduce((sum, cfg) => sum + cfg.length, 0);
        if (!expected) {
          return true;
        }
        const rendered = panel.querySelectorAll(".status-view [data-id], .panel-view [data-id]").length;
        return rendered >= expected;
      });

      if (!quoteLoading && quoteReady && dynamicReady) {
        await Utils.sleep(400);
        return;
      }
      await Utils.sleep(CFG.poll);
    }

    Utils.log("warn", "面板内容等待超时，继续截图");
  },

  async prepare() {
    await this.waitLoadingGone();
    const targets = await this.waitCaptureTargets();
    if (CFG.delay > 0) {
      await Utils.sleep(CFG.delay);
    }
    await this.waitFonts();
    await ChartCapture.waitReady(targets.canvas as HTMLElement);
    await this.waitPageContentReady(targets.canvas as HTMLElement);
    await Utils.waitFrames(6);
    return targets;
  }
};
