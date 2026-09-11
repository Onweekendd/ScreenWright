/**
 * 组件 Schema 验证测试
 *
 * 对 parsed-components 下每个分类目录中的 JSON fixture 进行验证：
 *   1. 将 config 字段与必要的缺省字段合并，构造完整组件对象
 *   2. 优先使用 componentPropSchemaMap 中对应 prop 的 data/option 专属 Schema
 *   3. 找不到专属 Schema 时回退到通用 ComponentFlatSchema
 *
 * 注意：外层 for 循环用于按分类生成 describe 块，内层 for 循环用于逐个生成 it 用例。
 * 每个用例相互独立，一个失败不影响其他用例继续运行。
 */

import type { z } from "zod";

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ComponentFlatSchema } from "../schemas/component";
import type { ComponentProp } from "../schemas/components/propSchemaMap";
import { componentPropSchemaMap } from "../schemas/components/propSchemaMap";

// ── 路径 ─────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const PARSED_DIR = join(__dirname, "../schemas/parsed-components");

// ── 工具函数 ──────────────────────────────────────────────────────────────────

/** 读取目录下所有 JSON 文件，返回 { name, config } 列表 */
function loadGroup(subdir: string): Array<{ name: string; config: Record<string, unknown> }> {
  const dir = join(PARSED_DIR, subdir);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        config: Record<string, unknown>;
      };
      return { name: f.replace(/\.json$/, ""), config: raw.config };
    });
}

/**
 * 组装完整组件对象。
 * parsed-components 的 config 缺少运行时必填字段，与 create-component.ts 保持一致补上最小默认值：
 *   - id / left / top / zIndex：定位信息，fixture 不含
 *   - events：部分无数据组件（实时时钟等）fixture 不含
 *   - data / dataSource / dataType：无数据源的组件（实时时钟等）fixture 不含
 */
function buildComponent(config: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 1,
    left: 0,
    top: 0,
    zIndex: 0,
    events: [],
    data: [],
    dataSource: {},
    dataType: 0,
    cbArgs: [],
    ...config
  };
}

/**
 * 构建针对该组件 prop 的完整 Schema。
 * 逻辑与 edit-file.ts 中 validateComponentContent 保持一致。
 */
function buildSchema(config: Record<string, unknown>): z.ZodTypeAny {
  const prop = ((config.component as Record<string, unknown> | undefined)?.prop as ComponentProp) ?? undefined;
  const entry = prop && prop in componentPropSchemaMap ? componentPropSchemaMap[prop] : undefined;
  if (entry) {
    return ComponentFlatSchema.omit({ data: true, option: true }).extend({
      data: entry.data,
      option: entry.option
    });
  }
  return ComponentFlatSchema;
}

/** 将 ZodIssue 列表格式化为可读字符串 */
function formatErrors(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `  [${path}] ${issue.message}`;
    })
    .join("\n");
}

// ── 分类定义（与 components/index.ts 导出分类对齐） ───────────────────────────

const GROUPS: Record<string, string> = {
  "图表 (echart)": "echart",
  "指标 (indicator)": "indicator",
  "交互 (interactive)": "interactive",
  "媒体 (media)": "media",
  "文本 (text)": "text",
  "第三方 (third-party)": "third-party",
  "扩展 (extends)": "extends"
};

// ── 测试生成 ──────────────────────────────────────────────────────────────────

for (const [groupLabel, subdir] of Object.entries(GROUPS)) {
  describe(groupLabel, () => {
    const components = loadGroup(subdir);

    for (const { name, config } of components) {
      const prop = ((config.component as Record<string, unknown> | undefined)?.prop as string) ?? "unknown";
      const hasPropSchema = prop in componentPropSchemaMap;
      const schemaLabel = hasPropSchema ? `${prop} schema` : "ComponentFlatSchema (通用回退)";

      it(`${name}，fixture config，${schemaLabel} 验证通过，无错误`, () => {
        const component = buildComponent(config);
        const schema = buildSchema(config);
        const result = schema.safeParse(component);

        if (!result.success) {
          const errorText = formatErrors(result.error.issues);
          expect.fail(
            `组件 "${name}" (prop="${prop}") 使用 ${schemaLabel} 验证失败，` +
              `共 ${result.error.issues.length} 个错误:\n${errorText}`
          );
        }

        expect(result.success).toBe(true);
      });
    }
  });
}
