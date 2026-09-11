/**
 * Figma Plugin API 节点 → REST API 格式转换器
 *
 * 将插件沙箱内的节点树转换为与 Figma REST API (GetFileNodesResponse) 一致的 JSON 结构，
 * 供后端 simplifyRawFigmaObject 直接消费。
 */

/// <reference types="@figma/plugin-typings" />

export class FigmaRawConverter {
  /**
   * 将根节点转换为 GetFileNodesResponse 格式
   * { nodes: { [rootId]: { document: ... } } }
   */
  toNodesResponse(rootNode: BaseNode): Record<string, any> {
    return {
      nodes: {
        [rootNode.id]: {
          document: this.convertNode(rootNode)
        }
      }
    };
  }

  /**
   * 递归转换单个节点及其子节点
   */
  private convertNode(node: BaseNode): Record<string, any> {
    const result: Record<string, any> = {
      id: node.id,
      name: node.name,
      type: node.type
    };

    // ── SceneNodeMixin ──
    const scene = node as SceneNode;
    if ("visible" in scene && scene.visible === false) {
      result.visible = false;
    }
    if ("locked" in scene && scene.locked) {
      result.locked = true;
    }
    if ("opacity" in scene && scene.opacity !== 1) {
      result.opacity = scene.opacity;
    }
    if ("blendMode" in scene) {
      result.blendMode = scene.blendMode;
    }
    if ("scrollBehavior" in scene) {
      result.scrollBehavior = scene.scrollBehavior;
    }
    if ("rotation" in scene && scene.rotation) {
      result.rotation = scene.rotation;
    }

    // ── 填充 & 描边 (GeometryMixin) ──
    if ("fills" in node) {
      const fills = (node as any).fills;
      if (fills !== figma.mixed) {
        result.fills = this.cloneDeep(fills);
      }
    }
    if ("strokes" in node) {
      const strokes = (node as any).strokes;
      if (strokes !== figma.mixed) {
        result.strokes = this.cloneDeep(strokes);
      }
    }
    if ("strokeWeight" in node && (node as any).strokeWeight !== figma.mixed) {
      result.strokeWeight = (node as any).strokeWeight;
    }
    if ("strokeAlign" in node) {
      result.strokeAlign = (node as any).strokeAlign;
    }

    // ── 边界框 ──
    // 优先用 Plugin API 提供的 absoluteBoundingBox（已包含旋转后的真实 AABB）
    // 旧实现读 absoluteTransform[0][2]/[1][2]，那是 local (0,0) 在画布上的位置，
    // 旋转节点下不等于 AABB 左上角，会导致后端位置偏移一个 width/height
    const absBB = (node as any).absoluteBoundingBox;
    if (absBB) {
      result.absoluteBoundingBox = {
        x: Math.round(absBB.x),
        y: Math.round(absBB.y),
        width: Math.round(absBB.width),
        height: Math.round(absBB.height)
      };
    } else if ("width" in node && "height" in node) {
      const transform = (node as any).absoluteTransform;
      if (transform) {
        result.absoluteBoundingBox = {
          x: Math.round(transform[0][2]),
          y: Math.round(transform[1][2]),
          width: Math.round((node as any).width),
          height: Math.round((node as any).height)
        };
      }
    }

    // absoluteRenderBounds
    if ("absoluteRenderBounds" in node && (node as any).absoluteRenderBounds) {
      const rb = (node as any).absoluteRenderBounds;
      result.absoluteRenderBounds = { x: rb.x, y: rb.y, width: rb.width, height: rb.height };
    } else if (result.absoluteBoundingBox) {
      result.absoluteRenderBounds = { ...result.absoluteBoundingBox };
    }

    // ── 约束 ──
    if ("constraints" in node && (node as any).constraints) {
      result.constraints = (node as any).constraints;
    }

    // ── 效果 ──
    if ("effects" in node) {
      result.effects = this.cloneDeep((node as any).effects);
    }

    // ── 保持宽高比 ──
    if ("preserveRatio" in node) {
      result.preserveRatio = (node as any).preserveRatio;
    }
    if ("targetAspectRatio" in node && (node as any).targetAspectRatio) {
      result.targetAspectRatio = { ...(node as any).targetAspectRatio };
    }

    result.interactions = [];

    // ── 子节点 ──
    if ("children" in node) {
      result.children = (node as any).children.map((child: BaseNode) => this.convertNode(child));

      if ("clipsContent" in node) {
        result.clipsContent = (node as any).clipsContent;
      }
      if ("background" in node) {
        const bg = (node as any).background;
        if (bg && bg !== figma.mixed) {
          result.background = this.cloneDeep(bg);
        }
      }
      if ("backgroundColor" in node && (node as any).backgroundColor) {
        result.backgroundColor = { ...(node as any).backgroundColor };
      }
    }

    // ── INSTANCE 特有 ──
    if (node.type === "INSTANCE") {
      const inst = node as InstanceNode;
      if (inst.mainComponent) {
        result.componentId = inst.mainComponent.id;
      }
      result.overrides = inst.overrides.map((o) => ({
        id: o.id,
        overriddenFields: [...o.overriddenFields]
      }));
      // 导出变体属性，后端据此判定 tabitem 的 active / noActive
      const props = inst.componentProperties;
      if (props && Object.keys(props).length > 0) {
        result.componentProperties = this.cloneDeep(props);
      }
    }

    // ── TEXT 特有 ──
    if (node.type === "TEXT") {
      const text = node as TextNode;
      result.characters = text.characters;

      const style: Record<string, any> = {
        textAlignHorizontal: text.textAlignHorizontal,
        textAlignVertical: text.textAlignVertical,
        textAutoResize: text.textAutoResize
      };

      const segments = text.getStyledTextSegments([
        "fills",
        "fontSize",
        "fontName",
        "fontWeight",
        "letterSpacing",
        "lineHeight"
      ]);

      if (segments.length > 0) {
        const base = segments[0];
        style.fontFamily = base.fontName.family;
        style.fontPostScriptName = base.fontName.style;
        style.fontStyle = base.fontName.style;
        style.fontSize = base.fontSize;
        style.fontWeight = base.fontWeight;
        if (base.letterSpacing && base.letterSpacing.value !== 0) {
          style.letterSpacing = base.letterSpacing.value;
          style.letterSpacingUnit = base.letterSpacing.unit;
        }
        if (base.lineHeight && base.lineHeight.unit !== "AUTO") {
          style.lineHeightPx = base.lineHeight.value;
          style.lineHeightUnit = base.lineHeight.unit === "PIXELS" ? "PIXELS" : "FONT_SIZE_%";
        }
        if (!("fills" in result)) {
          result.fills = this.cloneDeep(base.fills);
        }

        const overrides: number[] = new Array(text.characters.length).fill(0);
        const styleTable: Record<string, Record<string, any>> = {};
        const styleIdByKey: Record<string, number> = {};
        let nextStyleId = 1;

        const baseFillsJson = JSON.stringify(base.fills);
        const baseLhKey = base.lineHeight.unit === "AUTO" ? "AUTO" : `${base.lineHeight.value}`;
        const baseLsValue = base.letterSpacing?.value ?? 0;

        for (let s = 1; s < segments.length; s++) {
          const seg = segments[s];
          const diff: Record<string, any> = {};

          if (JSON.stringify(seg.fills) !== baseFillsJson) {
            diff.fills = this.cloneDeep(seg.fills);
          }
          if (seg.fontSize !== base.fontSize) {
            diff.fontSize = seg.fontSize;
          }
          if (
            seg.fontName.family !== base.fontName.family ||
            seg.fontName.style !== base.fontName.style
          ) {
            diff.fontFamily = seg.fontName.family;
            diff.fontPostScriptName = seg.fontName.style;
            diff.fontStyle = seg.fontName.style;
          }
          if (seg.fontWeight !== base.fontWeight) {
            diff.fontWeight = seg.fontWeight;
          }
          if ((seg.letterSpacing?.value ?? 0) !== baseLsValue) {
            diff.letterSpacing = seg.letterSpacing.value;
            diff.letterSpacingUnit = seg.letterSpacing.unit;
          }
          const segLhKey = seg.lineHeight.unit === "AUTO" ? "AUTO" : `${seg.lineHeight.value}`;
          if (segLhKey !== baseLhKey && seg.lineHeight.unit !== "AUTO") {
            diff.lineHeightPx = seg.lineHeight.value;
            diff.lineHeightUnit = seg.lineHeight.unit === "PIXELS" ? "PIXELS" : "FONT_SIZE_%";
          }

          if (Object.keys(diff).length === 0) continue;

          const key = JSON.stringify(diff);
          let styleId = styleIdByKey[key];
          if (styleId === undefined) {
            styleId = nextStyleId++;
            styleIdByKey[key] = styleId;
            styleTable[String(styleId)] = diff;
          }
          for (let i = seg.start; i < seg.end; i++) {
            overrides[i] = styleId;
          }
        }

        result.characterStyleOverrides = overrides;
        result.styleOverrideTable = styleTable;
      } else {
        result.characterStyleOverrides = [];
        result.styleOverrideTable = {};
      }

      result.style = style;
      result.lineTypes = ["NONE"];
      result.lineIndentations = [0];
      result.layoutVersion = 4;
    }

    // ── complexStrokeProperties ──
    result.complexStrokeProperties = { strokeType: "BASIC" };

    return result;
  }

  /**
   * 深拷贝 Paint / Effect 等只读数组，确保可序列化
   */
  private cloneDeep(obj: unknown): any {
    return JSON.parse(JSON.stringify(obj));
  }
}
