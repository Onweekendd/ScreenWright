import z from "zod";

// Figma 节点类型枚举 (包含扩展类型)
export const figmaNodeTypeSchema = z.enum([
  // 标准 Figma 节点类型
  "FRAME",
  "GROUP",
  "COMPONENT",
  "COMPONENT_SET",
  "INSTANCE",
  "RECTANGLE",
  "ELLIPSE",
  "POLYGON",
  "STAR",
  "LINE",
  "VECTOR",
  "TEXT",
  "TEXT_PATH",
  "SECTION",
  "SLICE",
  "BOOLEAN_OPERATION",
  "STICKY",
  "CONNECTOR",
  "SHAPE_WITH_TEXT",
  "CODE_BLOCK",
  "STAMP",
  "WIDGET",
  "EMBED",
  "LINK_UNFURL",
  "MEDIA",
  "SLIDE",
  "REGULAR_POLYGON",
  // 扩展类型 (自定义导出)
  "IMAGE-SVG"
]);

// 布局模式定义
export const layoutModeSchema = z.object({
  mode: z.enum(["none", "column", "row"]).describe("布局模式: none/column/row"),
  gap: z.string().optional().describe("间距"),
  sizing: z
    .object({
      horizontal: z.enum(["fixed", "hug", "fill"]).optional(),
      vertical: z.enum(["fixed", "hug", "fill"]).optional()
    })
    .optional()
    .describe("尺寸模式"),
  absolutePosition: z
    .object({
      x: z.number(),
      y: z.number()
    })
    .optional()
    .describe("绝对位置"),
  dimensions: z
    .object({
      width: z.number().optional(),
      height: z.number().optional()
    })
    .optional()
    .describe("尺寸")
});

// 字符级样式覆盖定义（用于处理文本中不同字符的不同样式）
export const characterStyleOverridesSchema = z
  .object({
    ranges: z.array(
      z.object({
        start: z.number().describe("样式开始位置（字符索引）"),
        end: z.number().describe("样式结束位置（字符索引）"),
        styleId: z.string().describe("样式 ID")
      })
    ),
    styleTable: z.record(
      z.string(),
      z.object({
        fontFamily: z.string().optional().describe("字体名称"),
        fontPostScriptName: z.string().optional().describe("字体 PostScript 名称"),
        fontStyle: z.string().optional().describe("字体样式"),
        fontWeight: z.number().optional().describe("字重"),
        fontSize: z.number().optional().describe("字号"),
        letterSpacing: z.number().optional().describe("字间距"),
        fills: z
          .array(
            z.object({
              blendMode: z.string().optional(),
              type: z.string(),
              color: z
                .object({
                  r: z.number(),
                  g: z.number(),
                  b: z.number(),
                  a: z.number().optional()
                })
                .optional(),
              gradientHandlePositions: z.array(z.any()).optional(),
              gradientStops: z.array(z.any()).optional()
            })
          )
          .optional()
      })
    )
  })
  .describe("字符级样式覆盖，用于同一文本节点中不同字符的不同样式");

// 文本样式定义
export const textStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  fontSize: z.number().optional(),
  lineHeight: z.string().optional(),
  letterSpacing: z.string().optional(),
  textAlignHorizontal: z.enum(["LEFT", "CENTER", "RIGHT", "JUSTIFIED"]).optional(),
  textAlignVertical: z.enum(["TOP", "CENTER", "BOTTOM"]).optional()
});

// 填充样式定义
// type/scaleMode 放宽为 z.string()：真实 Figma 数据里出现过未在枚举内的取值（如
// 菱形/角度渐变的变体、PATTERN/VIDEO/NOISE 等纹理填充、非标准 scaleMode），
// 严格枚举会导致 fills 校验失败，这里只做形状校验，不再收窄取值范围。
// 同时补上 color/blendMode/opacity/gradientStops/gradientHandlePositions，
// 兼容未经化简、直接透传的原始 Figma paint 对象。
export const fillSchema = z.union([
  z.string(), // 纯色: "#FFFFFF"
  z
    .object({
      type: z.string(),
      blendMode: z.string().optional(),
      opacity: z.number().optional(),
      color: z
        .object({
          r: z.number(),
          g: z.number(),
          b: z.number(),
          a: z.number().optional()
        })
        .optional()
        .describe("原始 paint 颜色对象（未化简为 hex 时的兜底）"),
      gradient: z.string().optional().describe("CSS 渐变字符串"),
      gradientStops: z.array(z.any()).optional(),
      gradientHandlePositions: z.array(z.any()).optional(),
      imageRef: z.string().optional().describe("图片引用 hash"),
      scaleMode: z.string().optional(),
      objectFit: z.string().optional(),
      isBackground: z.boolean().optional(),
      imageDownloadArguments: z
        .object({
          needsCropping: z.boolean().optional(),
          requiresImageDimensions: z.boolean().optional(),
          cropTransform: z.array(z.array(z.number())).optional(),
          filenameSuffix: z.string().optional()
        })
        .loose()
        .optional()
    })
    .loose()
]);

export type fillType = z.infer<typeof fillSchema>;

// 描边样式定义
export const strokeSchema = z.any();

// 效果样式定义
export const effectSchema = z.object({
  boxShadow: z.string().optional().describe("CSS box-shadow"),
  backdropFilter: z.string().optional().describe("CSS backdrop-filter")
});

// 组件属性值定义
export const componentPropertyValueSchema = z.union([
  z.object({
    type: z.literal("TEXT"),
    value: z.string()
  }),
  z.object({
    type: z.literal("BOOLEAN"),
    value: z.boolean()
  }),
  z.object({
    type: z.literal("INSTANCE_SWAP"),
    value: z.string().optional()
  }),
  z.object({
    type: z.literal("VARIANT"),
    value: z.string()
  })
]);

// Figma 节点类型定义
export interface FigmaNode {
  id: string;
  name: string;
  type: z.infer<typeof figmaNodeTypeSchema>;
  layout?: string;
  text?: string;
  textStyle?: string;
  characterStyleOverrides?: z.infer<typeof characterStyleOverridesSchema>; // 字符级样式覆盖对象
  fills?: string;
  strokes?: string;
  effects?: string;
  opacity?: number;
  borderRadius?: string;
  visible?: boolean;
  locked?: boolean;
  imgLocalPath?: string;
  componentProperties?: any;
  children?: FigmaNode[];
  stateIndex?: number;
}

// Figma 节点数据结构
export const figmaNodeSchema: z.ZodSchema<FigmaNode> = z.lazy(() =>
  z.object({
    // === 基础属性 ===
    id: z.string().describe("节点唯一标识"),
    name: z.string().describe("节点名称"),
    type: figmaNodeTypeSchema.describe("节点类型"),

    // === 布局信息 ===
    layout: z.string().optional().describe("布局样式引用 ID (layout_XXX)"),

    // === 文本相关 (仅 TEXT 节点) ===
    text: z.string().optional().describe("文本内容"),
    textStyle: z.string().optional().describe("文本样式引用 ID (style_XXX)"),
    characterStyleOverrides: characterStyleOverridesSchema.optional().describe("字符级样式覆盖对象"),

    // === 样式引用 (使用 ID 引用 globalVars 中的样式) ===
    fills: z.string().optional().describe("填充样式引用 ID (fill_XXX)"),
    strokes: z.string().optional().describe("描边样式引用 ID (stroke_XXX)"),
    effects: z.string().optional().describe("效果样式引用 ID (effect_XXX)"),
    opacity: z.number().min(0).max(1).optional().describe("透明度 0-1"),
    borderRadius: z.string().optional().describe("圆角半径"),

    // === 可选基础属性 ===
    visible: z.boolean().optional().describe("是否可见"),
    locked: z.boolean().optional().describe("是否锁定"),

    imgLocalPath: z.string().optional().describe("图片本地路径"),

    // === 组件相关 (仅 INSTANCE 节点) ===
    componentProperties: z.any(),

    stateIndex: z.number().optional().describe("组件状态索引"),

    // === 子节点 (递归结构) ===
    children: z.array(figmaNodeSchema).optional().describe("子节点列表")
  })
);

// 全局样式变量定义
// 使用 z.record() 允许任意字符串 key（如 layout_XXX, fill_XXX, style_XXX 等）
export const globalStylesSchema = z.record(
  z.string(),
  z.union([layoutModeSchema, textStyleSchema, z.array(fillSchema), strokeSchema, effectSchema])
);

// Figma 文件元数据
export const metadataSchema = z.object({
  name: z.string().describe("文件名称"),
  components: z.record(z.string(), z.any()).optional().describe("组件定义"),
  componentSets: z.record(z.string(), z.any()).optional().describe("组件集定义")
});

export interface DownloadedImageInfo {
  nodeId: string;
  filePath: string;
  dimensions: {
    width: number;
    height: number;
  };
  wasCropped: boolean;
}

export const figmaImageSchema: z.ZodSchema<DownloadedImageInfo> = z
  .object({
    nodeId: z.string().describe("节点唯一标识"),
    filePath: z.string().describe("图片文件路径"),
    dimensions: z
      .object({
        width: z.number().describe("图片宽度"),
        height: z.number().describe("图片高度")
      })
      .describe("图片尺寸"),
    wasCropped: z.boolean().describe("是否被裁剪")
  })
  .describe("下载的图片信息");

export const figmaFileSchema = z.looseObject({
  fileKey: z.string().optional().describe("Figma 文件 Key"),
  metadata: metadataSchema.optional().describe("文件元数据"),
  nodes: z.array(figmaNodeSchema).describe("节点树列表"),
  globalVars: z
    .object({
      styles: z.any().describe("全局样式变量映射表")
    })
    .optional()
    .describe("全局变量(包含样式定义)")
});

export type FigmaFileType = z.infer<typeof figmaFileSchema>;
