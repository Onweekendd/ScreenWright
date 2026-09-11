import { asHtml, Geometry, Utils } from "../captureUtils";
import type { GradientStop } from "../types/captureInternal";

type CloneRoot = Document | HTMLElement;

/**
 * 文本 DOM 采集核心（渐变字 flatten、富文本、custom-table 文字同步）
 * 供 fontDomStrategy 与 overlay onclone 补丁共用
 */
export const FontDomCapture = {
  TEXT_SYNC_SELECTOR:
    ".text-font, li .text-font, li > span, .custom-table-list [data-translate], .custom-table-list .parts-marquee .row-content, .custom-table-list .column-item > div",

  GRADIENT_SCAN_SELECTOR:
    ".gradient-text, .gradient-text__plain, .ft-text-text, .text-font, [data-translate], label, h1, h2, h3, h4, h5, h6, p, .sw-label-type, .w-e-text-container, .rich-text, .ql-editor",

  RICH_TEXT_SELECTOR: ".w-e-text-container, .rich-text, .ql-editor, .ft-text-text",

  parseFirstColorFromCss(value: unknown) {
    if (!value || value === "none") {
      return null;
    }
    const m = String(value).match(
      /rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)|#[0-9a-fA-F]{3,8}/i
    );
    return m ? m[0] : null;
  },

  COLOR_TOKEN_RE: /rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)|#[0-9a-fA-F]{3,8}/gi,

  parseGradientStopsFromCss(backgroundImage: string) {
    const str = String(backgroundImage || "");
    const start = str.indexOf("linear-gradient(");
    if (start === -1) {
      return [];
    }
    let depth = 0;
    const innerStart = start + "linear-gradient(".length;
    let innerEnd = innerStart;
    for (let i = innerStart; i < str.length; i++) {
      const ch = str[i];
      if (ch === "(") {
        depth++;
      } else if (ch === ")") {
        if (depth === 0) {
          innerEnd = i;
          break;
        }
        depth--;
      }
    }
    let body = str.slice(innerStart, innerEnd).trim();
    body = body.replace(
      /^(?:to\s+(?:top|bottom|left|right)(?:\s+(?:top|bottom|left|right))?|[+-]?[\d.]+deg)\s*,\s*/i,
      ""
    );

    const stops: GradientStop[] = [];
    const parts: string[] = [];
    let buf = "";
    let pDepth = 0;
    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if (ch === "(") {
        pDepth++;
        buf += ch;
      } else if (ch === ")") {
        pDepth--;
        buf += ch;
      } else if (ch === "," && pDepth === 0) {
        parts.push(buf.trim());
        buf = "";
      } else {
        buf += ch;
      }
    }
    if (buf.trim()) {
      parts.push(buf.trim());
    }

    parts.forEach((part) => {
      const perMatch = part.match(/([\d.]+)\s*%\s*$/);
      const position = perMatch ? parseFloat(perMatch[1]) : null;
      const colorPart = perMatch ? part.slice(0, perMatch.index).trim() : part;
      this.COLOR_TOKEN_RE.lastIndex = 0;
      const cm = this.COLOR_TOKEN_RE.exec(colorPart);
      if (cm) {
        stops.push({ color: cm[0], position: position ?? undefined });
      }
    });
    return stops;
  },

  normalizeGradientStops(stops: Array<{ color: string; position?: number | null }>) {
    if (!stops.length) {
      return stops;
    }
    const list = stops.map((s) => ({ color: s.color, position: s.position }));
    if (list[0].position == null) {
      list[0].position = 0;
    }
    if (list[list.length - 1].position == null) {
      list[list.length - 1].position = 100;
    }
    for (let i = 1; i < list.length - 1; i++) {
      if (list[i].position == null) {
        let prev = i - 1;
        let next = i + 1;
        while (prev >= 0 && list[prev].position == null) {
          prev--;
        }
        while (next < list.length && list[next].position == null) {
          next++;
        }
        const p0 = prev >= 0 ? (list[prev].position as number) : 0;
        const p1 = next < list.length ? (list[next].position as number) : 100;
        list[i].position = (p0 + p1) / 2;
      }
    }
    if (list.length === 2 && list[0].position == null && list[1].position == null) {
      list[0].position = 0;
      list[1].position = 100;
    }
    return list;
  },

  getDominantColorFromGradientCss(backgroundImage: string) {
    const stops = this.normalizeGradientStops(this.parseGradientStopsFromCss(backgroundImage));
    if (!stops.length) {
      return this.parseFirstColorFromCss(backgroundImage);
    }
    if (stops.length === 1) {
      return stops[0].color;
    }
    let maxSpan = -1;
    let best = stops[stops.length - 1].color;
    for (let i = 0; i < stops.length - 1; i++) {
      const span = (stops[i + 1].position as number) - (stops[i].position as number);
      if (span > maxSpan) {
        maxSpan = span;
        best = stops[i + 1].color;
      }
    }
    return best;
  },

  isCssColorTransparent(color: string) {
    return !color || color === "transparent" || color === "rgba(0, 0, 0, 0)";
  },

  hasOpaqueBackground(el: HTMLElement) {
    if (!el) {
      return false;
    }
    const bg = getComputedStyle(el).backgroundColor;
    if (this.isCssColorTransparent(bg)) {
      return false;
    }
    const m = bg.match(/rgba?\([\s\d.,]+,\s*([\d.]+)\s*\)/);
    if (m) {
      return parseFloat(m[1]) > 0.08;
    }
    return true;
  },

  isGradientOrClipText(el: HTMLElement) {
    if (!el) {
      return false;
    }
    if (el.classList.contains("gradient-text") || el.classList.contains("gradient-text__layer")) {
      return true;
    }
    const cs = getComputedStyle(el);
    return (
      cs.webkitBackgroundClip === "text" ||
      cs.backgroundClip === "text" ||
      (cs.webkitTextFillColor === "transparent" && cs.backgroundImage && cs.backgroundImage !== "none")
    );
  },

  getResolvedColorFromHost(liveHost: HTMLElement) {
    const multiLayers = liveHost.querySelectorAll(".gradient-text__layer");
    if (multiLayers.length) {
      let pick: { color: string; opacity: number } | null = null;
      for (const layer of Array.from(multiLayers)) {
        const layerEl = asHtml(layer);
        if (!layerEl) {
          continue;
        }
        const cs = getComputedStyle(layerEl);
        const opacity = parseFloat(cs.opacity);
        const op = Number.isFinite(opacity) ? opacity : 1;
        if (op <= 0.02) {
          continue;
        }
        const color = this.getDominantColorFromGradientCss(cs.backgroundImage);
        if (!color) {
          continue;
        }
        if (!pick || op >= pick.opacity) {
          pick = { color, opacity: op };
        }
      }
      if (pick) {
        return pick.color;
      }
    }

    const textEl = asHtml(liveHost.querySelector(".ft-text-text, .gradient-text, .w-e-text-container"));
    if (!textEl) {
      return "rgba(255, 255, 255, 1)";
    }
    const cs = getComputedStyle(textEl);
    if (!this.isCssColorTransparent(cs.webkitTextFillColor) && cs.webkitTextFillColor !== "transparent") {
      return cs.webkitTextFillColor;
    }
    const fromGradient = this.getDominantColorFromGradientCss(cs.backgroundImage);
    if (fromGradient) {
      return fromGradient;
    }
    if (!this.isCssColorTransparent(cs.color)) {
      return cs.color;
    }
    return "rgba(255, 255, 255, 1)";
  },

  getResolvedColorFromElement(el: HTMLElement) {
    if (el.classList.contains("gradient-text__layer")) {
      return this.getDominantColorFromGradientCss(getComputedStyle(el).backgroundImage) || "rgba(255, 255, 255, 1)";
    }
    const cs = getComputedStyle(el);
    if (!this.isCssColorTransparent(cs.webkitTextFillColor) && cs.webkitTextFillColor !== "transparent") {
      return cs.webkitTextFillColor;
    }
    const fromBg = this.getDominantColorFromGradientCss(cs.backgroundImage);
    if (fromBg) {
      return fromBg;
    }
    const fromInline = this.getDominantColorFromGradientCss(el.style.backgroundImage);
    if (fromInline) {
      return fromInline;
    }
    if (!this.isCssColorTransparent(cs.color)) {
      return cs.color;
    }
    return "rgba(255, 255, 255, 1)";
  },

  findGradientTextElements(root: HTMLElement) {
    const found: HTMLElement[] = [];
    const seen = new Set<Element>();
    root.querySelectorAll(this.GRADIENT_SCAN_SELECTOR).forEach((el) => {
      if (!(el instanceof HTMLElement) || seen.has(el)) {
        return;
      }
      const text = (el.textContent || "").trim();
      if (!text || text.length > 500 || (text.startsWith("{") && text.includes('":'))) {
        return;
      }
      if (this.isGradientOrClipText(el)) {
        seen.add(el);
        found.push(el);
      }
    });
    return found;
  },

  findMatchingCloneText(liveHost: HTMLElement, cloneHost: Element, liveEl: HTMLElement) {
    const translateKey = liveEl.getAttribute("data-translate");
    if (translateKey) {
      const liveMatches = Array.from(liveHost.querySelectorAll("[data-translate]")).filter(
        (n) => n.getAttribute("data-translate") === translateKey
      );
      const cloneMatches = Array.from(cloneHost.querySelectorAll("[data-translate]")).filter(
        (n) => n.getAttribute("data-translate") === translateKey
      );
      const idx = liveMatches.indexOf(liveEl);
      if (idx >= 0 && cloneMatches[idx]) {
        return cloneMatches[idx];
      }
    }
    const liveList = liveHost.querySelectorAll(this.GRADIENT_SCAN_SELECTOR);
    const cloneList = cloneHost.querySelectorAll(this.GRADIENT_SCAN_SELECTOR);
    const idx = Array.from(liveList).indexOf(liveEl);
    return idx >= 0 ? cloneList[idx] || null : null;
  },

  hostNeedsFlatten(liveHost: HTMLElement) {
    if (this.findGradientTextElements(liveHost).length > 0) {
      return true;
    }
    if (liveHost.querySelector(".gradient-text, .w-e-text-container, .rich-text")) {
      return true;
    }
    const textEl = asHtml(liveHost.querySelector(".ft-text-text"));
    if (!textEl) {
      return false;
    }
    return this.isGradientOrClipText(textEl) || this.hasOpaqueBackground(textEl);
  },

  applyFlatStyle(el: HTMLElement, color: string) {
    el.style.background = "none";
    el.style.backgroundImage = "none";
    el.style.backgroundColor = "transparent";
    el.style.backgroundClip = "unset";
    el.style.webkitBackgroundClip = "unset";
    el.style.webkitTextFillColor = color;
    el.style.color = color;
    el.style.mixBlendMode = "normal";
    el.style.backdropFilter = "none";
    el.style.setProperty("-webkit-backdrop-filter", "none");
  },

  detectInHost(host: HTMLElement) {
    return !!host.querySelector(
      "p, span, h1, h2, h3, h4, h5, h6, label, li, div[data-translate], .custom-table-list, .ft-text, .ft-text-box, .gradient-text, .ft-text-text, .text-font, .w-e-text-container, .rich-text, .ql-editor"
    );
  },

  isTextPrimaryHost(host: HTMLElement) {
    if (!this.detectInHost(host)) {
      return false;
    }
    if (host.querySelector(".gradient-text, .ft-text, .ft-text-box, .custom-table-list, .w-e-text-container")) {
      return true;
    }
    if (host.querySelector("[_echarts_instance_], canvas, video")) {
      return false;
    }
    return this.hostNeedsFlatten(host) || !!host.querySelector("[data-translate]");
  },

  applyTextStyleFromLive(liveEl: HTMLElement, cloneEl: HTMLElement) {
    const cs = getComputedStyle(liveEl);
    const text = (liveEl.textContent || "").trim();
    if (!text) {
      return;
    }
    if (!(cloneEl.textContent || "").trim()) {
      cloneEl.textContent = text;
    }
    cloneEl.style.color = cs.color;
    cloneEl.style.fontSize = cs.fontSize;
    cloneEl.style.fontFamily = cs.fontFamily;
    cloneEl.style.fontWeight = cs.fontWeight;
    cloneEl.style.fontStyle = cs.fontStyle;
    cloneEl.style.lineHeight = cs.lineHeight;
    cloneEl.style.textAlign = cs.textAlign;
    cloneEl.style.textShadow = cs.textShadow;
    cloneEl.style.webkitTextFillColor = cs.webkitTextFillColor || cs.color;
    cloneEl.style.opacity = cs.opacity;
    cloneEl.style.visibility = "visible";
    cloneEl.style.display = cs.display === "none" ? "inline-block" : cs.display;
    cloneEl.style.transform = cs.transform;
    cloneEl.style.writingMode = cs.writingMode;
    cloneEl.style.letterSpacing = cs.letterSpacing;
    cloneEl.style.whiteSpace = cs.whiteSpace;
    cloneEl.style.overflow = "visible";
    if (this.isGradientOrClipText(liveEl)) {
      this.applyFlatStyle(cloneEl, this.getResolvedColorFromElement(liveEl));
    }
  },

  patchRichTextInClone(clonedDoc: Document | HTMLElement, liveRoot: HTMLElement) {
    if (!liveRoot) {
      return;
    }
    const liveRichNodes = liveRoot.querySelectorAll(this.RICH_TEXT_SELECTOR);
    const cloneRichNodes = clonedDoc.querySelectorAll(this.RICH_TEXT_SELECTOR);
    const n = Math.min(liveRichNodes.length, cloneRichNodes.length);
    for (let i = 0; i < n; i++) {
      const liveEl = liveRichNodes[i];
      const cloneEl = cloneRichNodes[i];
      if (liveEl instanceof HTMLElement && cloneEl instanceof HTMLElement) {
        this.applyTextStyleFromLive(liveEl, cloneEl);
      }
    }
  },

  findCloneCustomTableList(liveTable: HTMLElement, clonedDoc: CloneRoot, liveRoot: HTMLElement) {
    const host = liveTable.closest("[data-id]");
    if (host) {
      const id = host.getAttribute("data-id");
      const cloneHost = clonedDoc.querySelector('[data-id="' + Utils.escapeDataId(id) + '"]');
      const inHost = cloneHost && cloneHost.querySelector(".custom-table-list");
      if (inHost) {
        return inHost;
      }
    }
    const scope = liveRoot || liveTable.ownerDocument;
    const liveTables = Array.from(scope.querySelectorAll(".custom-table-list"));
    const cloneTables = Array.from(clonedDoc.querySelectorAll(".custom-table-list"));
    const idx = liveTables.indexOf(liveTable);
    return idx >= 0 ? cloneTables[idx] || null : null;
  },

  patchCustomTableListInClone(clonedDoc: CloneRoot, liveRoot: HTMLElement) {
    if (!liveRoot) {
      return;
    }

    liveRoot.querySelectorAll(".custom-table-list").forEach((node) => {
      const liveTable = asHtml(node);
      if (!liveTable) {
        return;
      }
      const cloneTable = asHtml(this.findCloneCustomTableList(liveTable, clonedDoc, liveRoot));
      if (!cloneTable) {
        return;
      }

      const liveWrap = asHtml(liveTable.querySelector(".el-scrollbar__wrap"));
      const cloneWrap = asHtml(cloneTable.querySelector(".el-scrollbar__wrap"));
      if (liveWrap && cloneWrap) {
        const viewH = liveWrap.clientHeight;
        cloneWrap.style.overflow = "hidden";
        cloneWrap.style.height = viewH + "px";
        cloneWrap.style.maxHeight = viewH + "px";
        cloneWrap.scrollTop = 0;
      }

      const liveView = asHtml(liveTable.querySelector(".el-scrollbar__view"));
      const cloneView = asHtml(cloneTable.querySelector(".el-scrollbar__view"));
      if (liveView && cloneView) {
        cloneView.style.height = liveView.clientHeight + "px";
        cloneView.style.minHeight = liveView.clientHeight + "px";
      }

      const liveBox = asHtml(liveTable.querySelector(".customTableList-scrollbar-box"));
      const cloneBox = asHtml(cloneTable.querySelector(".customTableList-scrollbar-box"));
      if (liveBox && cloneBox) {
        const liveItems = liveBox.querySelectorAll(".customTableList-scrollbar-box-item");
        const cloneItems = cloneBox.querySelectorAll(".customTableList-scrollbar-box-item");
        const itemCount = liveItems.length;
        if (itemCount > 1 && itemCount % 2 === 0 && liveWrap && liveBox.scrollHeight > liveWrap.clientHeight * 1.4) {
          const half = itemCount / 2;
          for (let i = half; i < cloneItems.length; i++) {
            const item = asHtml(cloneItems[i]);
            if (item) {
              item.style.display = "none";
            }
          }
        }
        cloneBox.style.height = liveBox.clientHeight + "px";
      }

      const liveColumns = liveTable.querySelectorAll(".column-item");
      const cloneColumns = cloneTable.querySelectorAll(".column-item");
      const colN = Math.min(liveColumns.length, cloneColumns.length);
      for (let i = 0; i < colN; i++) {
        const liveCol = asHtml(liveColumns[i]);
        const cloneCol = asHtml(cloneColumns[i]);
        if (!liveCol || !cloneCol) {
          continue;
        }
        const liveText = asHtml(
          liveCol.querySelector("[data-translate]") ||
            liveCol.querySelector(".parts-marquee .row-content") ||
            liveCol.querySelector("div")
        );
        if (liveText) {
          cloneCol.style.lineHeight = getComputedStyle(liveText).lineHeight;
        }
        cloneCol.style.top = getComputedStyle(liveCol).top;
        cloneCol.style.left = getComputedStyle(liveCol).left;
        cloneCol.style.width = getComputedStyle(liveCol).width;
        cloneCol.style.height = getComputedStyle(liveCol).height;
      }

      const liveTexts = liveTable.querySelectorAll(this.TEXT_SYNC_SELECTOR);
      const cloneTexts = cloneTable.querySelectorAll(this.TEXT_SYNC_SELECTOR);
      const textN = Math.min(liveTexts.length, cloneTexts.length);
      for (let i = 0; i < textN; i++) {
        const liveTextEl = asHtml(liveTexts[i]);
        const cloneTextEl = asHtml(cloneTexts[i]);
        if (liveTextEl && cloneTextEl) {
          this.applyTextStyleFromLive(liveTextEl, cloneTextEl);
        }
      }
    });
  },

  hideJsonLikeTextInClone(clonedDoc: CloneRoot) {
    const root = clonedDoc instanceof Document ? clonedDoc : clonedDoc;
    root.querySelectorAll("span, div, p, pre").forEach((node) => {
      const el = asHtml(node);
      if (!el || el.children.length > 2) {
        return;
      }
      const text = (el.textContent || "").trim();
      if (text.length > 60 && text.startsWith("{") && text.includes('":')) {
        el.style.display = "none";
        el.style.visibility = "hidden";
      }
    });
  },

  syncTextFontsFromLive(clonedDoc: CloneRoot, liveRoot: HTMLElement) {
    if (!liveRoot) {
      return;
    }
    liveRoot.querySelectorAll("[data-id]").forEach((node) => {
      const liveHost = asHtml(node);
      if (!liveHost) {
        return;
      }
      const id = liveHost.getAttribute("data-id");
      if (!id) {
        return;
      }
      const cloneHost = clonedDoc.querySelector('[data-id="' + Utils.escapeDataId(id) + '"]');
      if (!cloneHost) {
        return;
      }
      const liveFonts = liveHost.querySelectorAll(this.TEXT_SYNC_SELECTOR);
      const cloneFonts = cloneHost.querySelectorAll(this.TEXT_SYNC_SELECTOR);
      const n = Math.min(liveFonts.length, cloneFonts.length);
      for (let i = 0; i < n; i++) {
        const liveEl = asHtml(liveFonts[i]);
        const cloneEl = asHtml(cloneFonts[i]);
        if (liveEl && cloneEl) {
          this.applyTextStyleFromLive(liveEl, cloneEl);
        }
      }
    });
  },

  flattenInClone(clonedDoc: CloneRoot, liveRoot: HTMLElement) {
    if (!liveRoot) {
      return;
    }
    this.hideJsonLikeTextInClone(clonedDoc);
    this.syncTextFontsFromLive(clonedDoc, liveRoot);
    this.patchRichTextInClone(clonedDoc, liveRoot);
    this.patchCustomTableListInClone(clonedDoc, liveRoot);
    liveRoot.querySelectorAll("[data-id]").forEach((node) => {
      const liveHost = asHtml(node);
      if (!liveHost || !this.hostNeedsFlatten(liveHost)) {
        return;
      }
      const id = liveHost.getAttribute("data-id");
      if (!id) {
        return;
      }
      const color = this.getResolvedColorFromHost(liveHost);
      const cloneHosts = clonedDoc.querySelectorAll('[data-id="' + Utils.escapeDataId(id) + '"]');
      const liveBox = Geometry.getShapeBox(liveHost);
      const liveBoxOpaque = this.hasOpaqueBackground(liveBox);

      cloneHosts.forEach((cloneNode) => {
        const cloneHost = asHtml(cloneNode);
        if (!cloneHost) {
          return;
        }
        if (liveBoxOpaque) {
          Geometry.getShapeBox(cloneHost).style.backgroundColor = "transparent";
        }
        cloneHost.querySelectorAll(".ft-text, .ft-text-box").forEach((boxNode) => {
          const box = asHtml(boxNode);
          if (!box) {
            return;
          }
          box.style.backgroundColor = "transparent";
          box.style.backgroundImage = "none";
          box.style.backdropFilter = "none";
          box.style.setProperty("-webkit-backdrop-filter", "none");
        });
        cloneHost.querySelectorAll(".gradient-text__layer, .gradient-text__sizer").forEach((layerNode) => {
          const layer = asHtml(layerNode);
          if (layer) {
            layer.style.display = "none";
          }
        });
        const plain = asHtml(cloneHost.querySelector(".gradient-text__plain"));
        if (plain) {
          plain.style.display = "inline-block";
        }
        cloneHost.querySelectorAll(".ft-text-text, .gradient-text, .gradient-text__plain").forEach((textNode) => {
          const el = asHtml(textNode);
          if (el) {
            this.applyFlatStyle(el, color);
          }
        });
        const gradientEls = this.findGradientTextElements(liveHost);
        gradientEls.forEach((liveEl) => {
          const cloneEl = this.findMatchingCloneText(liveHost, cloneHost, liveEl);
          if (cloneEl instanceof HTMLElement) {
            this.applyFlatStyle(cloneEl, this.getResolvedColorFromElement(liveEl));
          }
        });
      });
    });
  }
};

/** 兼容旧导出名 @deprecated 使用 FontDomCapture */
export const TextDomCapture = FontDomCapture;
