/** BI 唯一标识入口：解析 canvas / editor 作用域 */
import { CAPTURE_WRAPPER_ATTR } from "../captureConfig";
import { CFG } from "../captureConfig";
import { Geometry, Utils } from "../captureUtils";
import { castHtml as asHtml } from "../dom/captureDomHelpers";
import type { CaptureElementRef, CaptureScope, LayerCaptureOptions } from "../types";
import type { DesignSize } from "../types/captureInternal";
import { Readiness } from "./readiness";

export const BiCaptureEntry = {
  selectors: {
    root: ".bi-view",
    canvas: ".view-wrapper",
    editor: ".es-editor",
    module: "[data-id]"
  },

  resolveElement(ref: CaptureElementRef, label: string) {
    if (ref instanceof HTMLElement) {
      return ref;
    }
    if (typeof ref !== "string" || !ref) {
      throw new Error("无效的 DOM 引用：" + label);
    }
    const el = ref.startsWith("#") ? document.getElementById(ref.slice(1)) : document.querySelector(ref);
    if (!el) {
      throw new Error("未找到 " + label + "：" + ref);
    }
    return el as HTMLElement;
  },

  resolveEditorElement(canvas: HTMLElement, editorRef: CaptureElementRef | undefined) {
    if (editorRef instanceof HTMLElement) {
      return editorRef;
    }
    if (typeof editorRef === "string") {
      const editor = asHtml(canvas.querySelector(editorRef));
      if (!editor) {
        throw new Error("未找到 editor：" + editorRef);
      }
      return editor as HTMLElement;
    }
    return (canvas.querySelector(this.selectors.editor) as HTMLElement) || canvas;
  },

  buildScope(root: HTMLElement, canvas: HTMLElement, editor: HTMLElement): CaptureScope {
    if (!Utils.isVisible(canvas)) {
      throw new Error("canvas 不可见或尺寸为 0");
    }
    return {
      root,
      canvas,
      editor,
      designSize: Geometry.getCanvasDesignSize(canvas)
    };
  },

  /** 预览页：.bi-view → .view-wrapper → .es-editor */
  async resolvePreview() {
    await Readiness.waitLoadingGone();
    const deadline = Date.now() + CFG.loadingWait;
    while (Date.now() < deadline) {
      const root = asHtml(document.querySelector(this.selectors.root));
      const canvas =
        (root && asHtml(root.querySelector(this.selectors.canvas))) ||
        asHtml(document.querySelector(this.selectors.canvas));
      if (root && Utils.isVisible(asHtml(root)) && canvas && Utils.isVisible(asHtml(canvas))) {
        const editor = asHtml(canvas.querySelector(this.selectors.editor)) || canvas;
        return this.buildScope(root, canvas, editor);
      }
      await Utils.sleep(CFG.poll);
    }
    throw new Error("大屏未加载完成，请刷新页面后再试");
  },

  /** 统一解析截图作用域：入参优先，否则按 mode 预设 */
  async resolveScope(options: LayerCaptureOptions) {
    const mode = options.mode ?? "editor";
    const hasExplicit = !!(options.canvas || options.root);

    if (hasExplicit) {
      const canvas = this.resolveElement((options.canvas ?? options.root) as CaptureElementRef, "canvas");
      const root = options.root ? this.resolveElement(options.root, "root") : canvas;
      const editor = this.resolveEditorElement(canvas, options.editor);
      return this.buildScope(root, canvas, editor);
    }

    if (mode === "preview") {
      return this.resolvePreview();
    }

    const canvas = document.getElementById("go-chart-edit-content");
    if (!canvas) {
      throw new Error("未找到编辑器画布 #go-chart-edit-content，请传入 canvas 入参");
    }
    const editor = asHtml(canvas.querySelector(this.selectors.editor)) || canvas;
    return this.buildScope(canvas, canvas, editor);
  },

  markCaptureWrapper(canvas: HTMLElement) {
    canvas.setAttribute(CAPTURE_WRAPPER_ATTR, "1");
    return () => canvas.removeAttribute(CAPTURE_WRAPPER_ATTR);
  },

  findScaledWrapperInClone(clonedRoot: Document | HTMLElement, liveViewWrapper: HTMLElement) {
    if (!clonedRoot) {
      return null;
    }
    const root = clonedRoot as Document | HTMLElement;
    const isElement = root.nodeType === 1;
    const isDocument = root.nodeType === 9;
    const query = (sel: string): Element | null =>
      isElement ? (root as HTMLElement).querySelector(sel) : (root as Document).querySelector(sel);
    const htmlRoot = isElement ? (root as HTMLElement) : null;
    const byAttr =
      query("[" + CAPTURE_WRAPPER_ATTR + "]") ||
      (htmlRoot?.matches?.("[" + CAPTURE_WRAPPER_ATTR + "]")
        ? htmlRoot
        : (htmlRoot?.closest?.("[" + CAPTURE_WRAPPER_ATTR + "]") ?? null));
    if (byAttr) {
      return asHtml(byAttr);
    }
    if (liveViewWrapper?.id) {
      const byId = isDocument
        ? (root as Document).getElementById(liveViewWrapper.id)
        : query("#" + Utils.escapeDataId(liveViewWrapper.id));
      if (byId) {
        return asHtml(byId);
      }
    }
    const viewWrapper = query(".view-wrapper");
    if (viewWrapper) {
      return asHtml(viewWrapper);
    }
    const editor = query(".es-editor");
    if (editor?.parentElement) {
      return asHtml(editor.parentElement);
    }
    return isElement ? asHtml(root as HTMLElement) : asHtml((root as Document).body);
  },

  patchScaledWrapperInClone(clonedWrapper: HTMLElement, designSize: DesignSize) {
    if (!clonedWrapper || !designSize) {
      return;
    }
    clonedWrapper.style.transform = "none";
    clonedWrapper.style.transformOrigin = "left top";
    clonedWrapper.style.left = "0";
    clonedWrapper.style.top = "0";
    clonedWrapper.style.marginLeft = "0";
    clonedWrapper.style.marginTop = "0";
    clonedWrapper.style.width = designSize.width + "px";
    clonedWrapper.style.height = designSize.height + "px";
  }
};
