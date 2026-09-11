/** CSS3 动画 / 透视 / preserve-3d 冻结（供特殊组件 snapdom 与逐模块 dom 截图） */
import { Utils } from "./captureUtils";
import { SPECIAL_COMPONENT_SELECTOR } from "./strategies/specialComponentRegistry";

interface StyleStashItem {
  el: HTMLElement;
  animation?: string;
  transform?: string;
  webkitTransform?: string;
}

export const Transform3DCapture = {
  CONTAINER_SELECTOR: `${SPECIAL_COMPONENT_SELECTOR}, .spin-container, .drag-container, .point-box, .spin-point, .carousel, figure.spinner, .spinner-item`,

  shouldFreeze(el: HTMLElement) {
    if (this.hasMatrix3d(el)) {
      return true;
    }
    const cs = getComputedStyle(el);
    if (cs.animationName && cs.animationName !== "none") {
      return true;
    }
    if (cs.transformStyle === "preserve-3d") {
      return true;
    }
    return !!(cs.transform && cs.transform !== "none" && !/^matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*0\)/.test(cs.transform));
  },

  hasMatrix3d(el: HTMLElement) {
    const cs = getComputedStyle(el);
    return !!(cs.transform && cs.transform.includes("matrix3d"));
  },

  freezeForLiveCapture(root: HTMLElement) {
    const stash: StyleStashItem[] = [];
    const freezeEl = (el: HTMLElement) => {
      if (!el || el.closest(".custom-table-list")) {
        return;
      }
      const cs = getComputedStyle(el);
      if (!this.shouldFreeze(el) && !el.matches(this.CONTAINER_SELECTOR)) {
        return;
      }
      if (typeof el.getAnimations === "function") {
        el.getAnimations().forEach((anim) => {
          try {
            anim.pause();
          } catch {
            /* ignore */
          }
        });
      }
      stash.push({
        el,
        animation: el.style.animation,
        transform: el.style.transform,
        webkitTransform: el.style.webkitTransform
      });
      if (cs.animationName && cs.animationName !== "none") {
        el.style.animationPlayState = "paused";
        el.style.animation = "none";
      }
      const matrix = getComputedStyle(el).transform;
      if (matrix && matrix !== "none") {
        el.style.transform = matrix;
        el.style.webkitTransform = matrix;
      }
    };

    root
      .querySelectorAll(
        ".imagesList3d, .ft-swiperCard, .ft-swiper, .carousel, .vertical-card, .cube-main, .carousel-3d-container, .image-stack-container"
      )
      .forEach((container) => {
        if (!(container instanceof HTMLElement)) {
          return;
        }
        const cs = getComputedStyle(container);
        stash.push({
          el: container,
          transform: container.style.transform,
          webkitTransform: container.style.webkitTransform
        });
        if (cs.perspective && cs.perspective !== "none") {
          container.style.perspective = cs.perspective;
        }
        container.style.transformStyle = cs.transformStyle;
      });

    root.querySelectorAll(this.CONTAINER_SELECTOR).forEach((container) => {
      freezeEl(container as HTMLElement);
      container
        .querySelectorAll(
          ".spin-point, .point-box, .spin-container, .drag-container, .ground, .spinner-item, figure.spinner"
        )
        .forEach((child) => {
          freezeEl(child as HTMLElement);
        });
    });

    return () => {
      stash.forEach(({ el, animation, transform, webkitTransform }) => {
        if (!el) {
          return;
        }
        el.style.animation = animation || "";
        el.style.transform = transform || "";
        el.style.webkitTransform = webkitTransform || "";
      });
    };
  },

  sync3dStyles(liveEl: Element, cloneEl: Element) {
    if (!(liveEl instanceof HTMLElement) || !(cloneEl instanceof HTMLElement)) {
      return;
    }
    const cs = getComputedStyle(liveEl);
    const matrix = cs.transform;
    cloneEl.style.transform = matrix && matrix !== "none" ? matrix : liveEl.style.transform;
    cloneEl.style.webkitTransform = cloneEl.style.transform;
    cloneEl.style.transformOrigin = cs.transformOrigin;
    cloneEl.style.transformStyle = cs.transformStyle;
    if (cs.perspective && cs.perspective !== "none") {
      cloneEl.style.perspective = cs.perspective;
      cloneEl.style.perspectiveOrigin = cs.perspectiveOrigin;
    }
    cloneEl.style.animation = "none";
    cloneEl.style.animationPlayState = "paused";
    cloneEl.style.opacity = cs.opacity;
  },

  syncIndexed3d(liveScope: Element, cloneScope: Element, selector: string) {
    const liveNodes = liveScope.querySelectorAll(selector);
    const cloneNodes = cloneScope.querySelectorAll(selector);
    for (let i = 0; i < Math.min(liveNodes.length, cloneNodes.length); i++) {
      this.sync3dStyles(liveNodes[i], cloneNodes[i]);
    }
  },

  syncMarkerPairs(liveScope: Element, cloneScope: Element) {
    const pairs = [
      ".imagesList3d",
      ".ft-swiperCard",
      ".ft-swiper",
      ".ft-carousel-image-v2",
      ".carousel",
      ".carousel-3d-container",
      ".carousel-3d-slider",
      "figure.spinner",
      ".spinner-item",
      ".spin-container",
      ".drag-container",
      ".spin-point",
      ".point-box",
      ".ground",
      ".cube-main",
      ".cube-container",
      ".vertical-card",
      ".stack",
      ".image-stack-container",
      ".swiper-container",
      ".el-carousel",
      ".el-carousel__container"
    ];
    pairs.forEach((sel) => {
      const liveNodes = liveScope.querySelectorAll(sel);
      const cloneNodes = cloneScope.querySelectorAll(sel);
      if (
        liveScope instanceof HTMLElement &&
        cloneScope instanceof HTMLElement &&
        liveScope.matches(sel) &&
        cloneScope.matches(sel)
      ) {
        this.sync3dStyles(liveScope, cloneScope);
      }
      for (let i = 0; i < Math.min(liveNodes.length, cloneNodes.length); i++) {
        this.sync3dStyles(liveNodes[i], cloneNodes[i]);
      }
    });
    [".spin-point", ".spinner-item", "figure.spinner", ".point-box", ".spin-container", ".drag-container"].forEach(
      (sel) => this.syncIndexed3d(liveScope, cloneScope, sel)
    );
  },

  patchInClone(clonedDoc: Document | HTMLElement, liveRoot: HTMLElement, liveTarget?: HTMLElement) {
    if (!liveRoot) {
      return;
    }
    const { queryRoot } = Utils.getClonePatchContext(clonedDoc);
    const cloneScope = queryRoot instanceof HTMLElement ? queryRoot : liveRoot;
    const liveScope = liveTarget || liveRoot;

    if (cloneScope instanceof HTMLElement && liveScope instanceof HTMLElement) {
      this.syncMarkerPairs(liveScope, cloneScope);
      if (liveTarget && liveTarget !== liveRoot) {
        this.syncMarkerPairs(liveTarget, cloneScope);
      }
    }

    const pairs = [
      ".imagesList3d",
      ".ft-swiperCard",
      ".ft-swiper",
      ".ft-carousel-image-v2",
      ".carousel",
      ".carousel-3d-container",
      ".carousel-3d-slider",
      "figure.spinner",
      ".spinner-item",
      ".spin-container",
      ".drag-container",
      ".spin-point",
      ".point-box",
      ".ground",
      ".cube-main",
      ".cube-container",
      ".vertical-card",
      ".stack",
      ".image-stack-container"
    ];
    liveRoot.querySelectorAll("[data-id]").forEach((liveHost) => {
      const id = liveHost.getAttribute("data-id");
      if (!id) {
        return;
      }
      const cloneHost =
        queryRoot.querySelector('[data-id="' + Utils.escapeDataId(id) + '"]') ||
        (queryRoot instanceof HTMLElement && queryRoot.getAttribute("data-id") === id ? queryRoot : null);
      if (!cloneHost) {
        return;
      }
      pairs.forEach((sel) => {
        const liveNodes = liveHost.querySelectorAll(sel);
        const cloneNodes = cloneHost.querySelectorAll(sel);
        for (let i = 0; i < Math.min(liveNodes.length, cloneNodes.length); i++) {
          this.sync3dStyles(liveNodes[i], cloneNodes[i]);
        }
      });
    });
  }
};
