import { z } from "zod";

/**
 * 轮播表格 (swScroll)
 * 文字
 *
 * ## 数据结构
 *
 * 数据为动态键值对记录，键由 option.columns[].key 定义。
 *
 * @example
 * ```typescript
 * const data: FtScrollData = [
 *   { accidentType: "car", status: "已解决", time: "07:33:40", content: "左侧OBU无响应" }
 * ];
 * ```
 */

// 单个数据项的 Schema（动态键值对）
const swScrollDataItemSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

// 数据数组 Schema
export const swScrollDataSchema = z.array(swScrollDataItemSchema);

export type FtScrollData = z.infer<typeof swScrollDataSchema>;

const swScrollAlignSchema = z.enum(["left", "center", "right"]);

// 列定义 Schema——单一数组，增删列只改这一处，不存在并行数组同步问题
const swScrollColumnSchema = z.object({
  key: z.string().describe("对应 data 里的字段名"),
  title: z.string().describe("表头显示文本"),
  width: z.number().optional().describe("固定像素宽度；不填则按剩余空间等比自动分配，天然撑满容器，不用心算总宽度"),
  align: z.enum(["left", "center", "right"]).optional().describe("不填则使用 rowStyle.align")
});

const swScrollHeaderSchema = z.object({
  show: z.boolean().default(true),
  height: z.number().default(40),
  background: z.string().default("rgba(0,138,255,0.3)"),
  color: z.string().default("#ffffff"),
  fontSize: z.number().default(14)
});

const swScrollRowStyleSchema = z.object({
  height: z.number().default(40),
  fontSize: z.number().default(14),
  color: z.string().default("#ffffff"),
  background: z.string().default("transparent"),
  stripeBackground: z.string().optional().describe("斑马纹背景色（偶数行），不填则不启用斑马纹"),
  align: swScrollAlignSchema.default("center")
});

// 按列 key 覆盖样式（可选）——按 key 取值，不是下标，插入/删除列不会导致覆盖样式错位
const swScrollColumnStyleOverrideSchema = z.object({
  color: z.string().optional(),
  background: z.string().optional(),
  fontSize: z.number().optional(),
  align: swScrollAlignSchema.optional()
});

const swScrollRowIndexSchema = z.object({
  show: z.boolean().default(false),
  title: z.string().default("序号"),
  width: z.number().default(50),
  startFrom: z.number().default(1)
});

// 轮播设置全部收进一个对象，避免 scroll/animationShow 这类分散在顶层、容易漏配的开关联动
const swScrollScrollSchema = z.object({
  enabled: z.boolean().default(false),
  visibleRows: z.number().default(5).describe("可视行数，需明显小于 data 长度才会触发滚动"),
  speed: z.number().default(1).describe("每行滚动耗时（秒）")
});

/**
 * 轮播表格配置选项 Schema
 */
export const swScrollOptionSchema = z.object({
  refresh: z.boolean().describe("是否启用刷新"),
  columns: z.array(swScrollColumnSchema).min(1),
  header: swScrollHeaderSchema,
  rowStyle: swScrollRowStyleSchema,
  columnStyleOverrides: z.record(z.string(), swScrollColumnStyleOverrideSchema).optional(),
  rowIndex: swScrollRowIndexSchema.optional(),
  scroll: swScrollScrollSchema.optional()
});

export type FtScrollOption = z.infer<typeof swScrollOptionSchema>;

/**
 * 联动检查——不揉进 `swScrollOptionSchema` 本体（原因见 swFlopPerformanceSuperRefine 的注释：
 * 真实历史数据可能不满足这些业务约束，但仍是合法的、已渲染过的组件，不该被 schema 一致性
 * 测试当成类型错误），只在运行时校验入口（`componentSuperRefineMap`）挂上。
 *
 * 新结构里列宽默认自动分配、样式按 key 覆盖，原来"数组长度要对齐""像素总和要精确匹配容器
 * 宽度"这类结构性 bug 已经不可能出现，只保留一条业务提示：可视行数应明显小于数据行数。
 */
export function swScrollSuperRefine(
  val: { data?: unknown; option?: Partial<FtScrollOption> },
  ctx: z.RefinementCtx
): void {
  const { option, data } = val;
  if (!option?.scroll?.enabled || !Array.isArray(data)) {
    return;
  }
  if (option.scroll.visibleRows >= data.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["option", "scroll", "visibleRows"],
      message: `scroll.visibleRows（${option.scroll.visibleRows}）应明显小于 data 长度（${data.length}），否则不会触发轮播滚动`
    });
  }
}
