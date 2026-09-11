import fs from "node:fs";
import path from "node:path";

import { type ComponentProp, componentPropSchemaMap } from "@screenwright/types/schemas";
import type { z } from "zod";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";

/**
 * 组件字段 schema 的读取与渲染。
 *
 * 补的是一个实测出来的空洞：`pick-components` 原先把**向量库里的检索文档**当 schema 喂给模型，
 * 并在提示词里写「data 必须严格符合所选组件文档里写明的字段结构」——而那些文档只有 19 行，
 * 内容是描述 / 与其他组件的区别 / 别名 / 适用场景，**根本没写任何字段结构**。
 * 模型只能现编，于是同一轮里三个 ft-countup-v2 编出了三套字段名（一个 name、两个 label），
 * 而它真实的 data schema 只有 `{ value }`——三个都是错的，标签全丢，KPI 卡渲染成裸数字。
 *
 * 真正的权威在 `componentPropSchemaMap`：每个 prop 都有 data / option 两套 zod schema，
 * 且每个字段都带 `.describe()`。它同时也是 `validateComponentContent` 属性层的依据，
 * 所以「喂给模型的」和「落盘时校验的」天然是同一份，不会分叉。
 */

/** option 里承载**内容**（而非视觉样式）的字段名词面。 */
const CONTENT_OPTION_RE = /text|title|label|unit|name|column|prefix|suffix/iu;

/**
 * 样式字段的词面，命中即排除。
 *
 * 必须有这一层：只按 CONTENT_OPTION_RE 收会把 `prefixFontSize` / `prefixColor` /
 * `seriesLabelOffsetX` 全捞进来——它们含 prefix / label，却是纯样式。而样式不该由这一步决定：
 * 每块区是独立并发调用，各自选色的结果是全屏一致性靠运气，应交给全屏统一的主题或素材层。
 */
const STYLE_OPTION_RE =
  /color|font|align|offset|inline|split|show|position|distance|width|height|size|weight|margin|padding|radius/iu;

/** option 字段太多（实测 59~192 个），全渲染进提示词不现实，只挑内容相关的这些。 */
const MAX_OPTION_FIELDS = 24;

const isKnownProp = (prop: string): prop is ComponentProp => prop in componentPropSchemaMap;

/** 取 zod object 的 shape；不是 object（如顶层就是 array）时返回 null */
const shapeOf = (schema: unknown): Record<string, z.ZodType> | null => {
  const def = (schema as { def?: { type?: string; shape?: Record<string, z.ZodType>; element?: unknown } }).def;
  if (!def) {
    return null;
  }
  // data schema 通常是 z.array(z.object(...))，要下钻一层拿数组元素的 shape
  if (def.type === "array" && def.element) {
    return shapeOf(def.element);
  }
  return def.shape ?? null;
};

/**
 * 字段类型的短标注，**数组与标量必须能一眼分开**。
 *
 * 这不是可有可无的装饰：echart 那批组件的很多 option 字段是**按系列平铺的数组**
 * （`dataUnitName` 的模板值就是 `["系列一","系列二"]`）。只渲染字段名和中文描述时，
 * 「数据单位名称」看着就该填 `"MW"`，模型也确实这么填了——组件里 `option.dataUnitName.forEach(...)`
 * 当场抛 `forEach is not a function`，整个图表白屏。这类错误落盘校验也拦不住（值类型对不上
 * 只是 warning），只有在浏览器里才会炸，所以必须在生成的那一刻就说清楚。
 */
const typeLabel = (schema: z.ZodType | undefined): string => {
  const def = (schema as { def?: { type?: string; element?: unknown; innerType?: unknown } } | undefined)?.def;
  if (!def) {
    return "";
  }
  // optional / nullable / default 都包了一层，要下钻到真正的类型
  if (def.innerType) {
    return typeLabel(def.innerType as z.ZodType);
  }
  if (def.type === "array") {
    const inner = typeLabel(def.element as z.ZodType);
    return inner ? `${inner}[]` : "数组";
  }
  return def.type ?? "";
};

/**
 * 渲染字段清单，嵌套对象 / 对象数组往下展一层。
 *
 * 展这一层不是锦上添花：ftScroll 的 `column` 在 zod 里没有 `.describe()`，只渲染字段名的话
 * 模型看到的就是光秃秃一个 `column`，而列的真实结构 `{ name: 显示名, alias: 数据字段名 }`
 * 只写在 skill 文档的 option 表格里——那一段不在这里抽取的 `## dataChart 数据格式` 小节内。
 * 实测模型因此编出了 `{ name: "orderId", label: "订单号" }`：数据键塞进了显示名，
 * `label` 更是 schema 里根本没有的键，整张表渲染成空。
 */
const renderFields = (shape: Record<string, z.ZodType>, keys: readonly string[], depth = 0): string =>
  keys
    .map((k) => {
      const pad = "  ".repeat(depth + 1);
      const desc = shape[k]?.description;
      const type = typeLabel(shape[k]);
      const label = type ? `${k}: ${type}` : k;
      const head = desc ? `${pad}${label}  // ${desc}` : `${pad}${label}`;
      // 只展一层：再往下是 seriesY* 那类上百个平铺样式字段，展开会把提示词撑爆
      const inner = depth === 0 ? shapeOf(shape[k]) : null;
      const innerKeys = inner ? Object.keys(inner) : [];
      return innerKeys.length > 0 ? `${head}\n${renderFields(inner!, innerKeys, depth + 1)}` : head;
    })
    .join("\n");

/** skill 里的组件字段文档根目录。107/116 份文档的数据格式小节标题完全一致，抽取很可靠。 */
const SKILL_DOC_ROOT = path.join(
  getAgentWorkspacePath(),
  "skills/executor/sw-component-schema/references/components"
);

/**
 * `## dataChart 数据格式` 到下一个二级标题 / 分隔线之间的内容。
 *
 * 行尾一律写成 `\r?\n`：仓库里这批文档是 CRLF，只写 `\n` 会一条都匹配不上，
 * 而失败是静默的（返回 null 后无声退回 zod schema），排查起来只看得到「怎么没生效」。
 */
const DATA_SECTION_RE = /## dataChart 数据格式\r?\n([\s\S]*?)(?=\r?\n---|\r?\n## |$)/u;

/** prop → 文档路径。目录只在首次用到时扫一遍，foreach 并发时不重复走 IO。 */
let docIndex: Map<string, string> | null = null;

const buildDocIndex = (): Map<string, string> => {
  const index = new Map<string, string>();
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".md") && entry.name !== "index.md") {
        index.set(entry.name.slice(0, -3), full);
      }
    }
  };
  try {
    walk(SKILL_DOC_ROOT);
  } catch {
    // 工作区里没有 skills（比如只跑单测时）就退化成只用 zod schema，不是错误
  }
  return index;
};

/**
 * 取 skill 文档里的 `## dataChart 数据格式` 小节。
 *
 * **为什么不能只靠 zod schema**：echart 那批组件的 data 字段在 zod 里没有 `.describe()`，
 * 渲染出来就是光秃秃的 `name / seriesName / value`。而 skill 文档里写着
 * 「seriesName: 系列标识（同名数据为一个系列）」，并附一段多系列的 JSON 示例——
 * 后者决定了多系列数据该怎么排，光看字段名推不出来。
 *
 * 分工因此是：**语义与示例取自 skill 文档，权威键集取自 zod schema**。
 * 后者机器可判、与 `validateComponentContent` 同源，组件改字段时两边不会分叉。
 *
 * 这一节实测中位数 227 字符、最大 579，三个候选加起来不到 250 token，可以直接进提示词。
 */
export const readDataFormatDoc = (prop: string): string | null => {
  docIndex ??= buildDocIndex();
  const file = docIndex.get(prop);
  if (!file) {
    return null;
  }
  try {
    return DATA_SECTION_RE.exec(fs.readFileSync(file, "utf-8"))?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
};

/**
 * 文档示例里出现、但 zod 里已经没有的字段名。
 *
 * 两种写法都要认：TS 接口里键在行首（`  name: string;`），JSON 示例里键带引号
 * （`{ "name": "car" }`）。取到的名字再减去权威键集，剩下的就是会误导模型的过时名。
 *
 * 只在 `dataKeys` 非空时有意义——列驱动组件（data 是自由键值对）没有权威键集可比。
 */
const TS_KEY_RE = /^\s*([A-Za-z_]\w*)\??\s*:/gmu;
const JSON_KEY_RE = /"([A-Za-z_]\w*)"\s*:/gu;

const docOnlyKeys = (doc: string | null, dataKeys: readonly string[]): string[] => {
  if (!doc) {
    return [];
  }
  const found = new Set<string>();
  for (const re of [TS_KEY_RE, JSON_KEY_RE]) {
    re.lastIndex = 0;
    for (const m of doc.matchAll(re)) {
      found.add(m[1]!);
    }
  }
  return [...found].filter((k) => !dataKeys.includes(k));
};

export interface PropSchemaBrief {
  /** data 数组里单项的字段名。落盘前的键集校验直接用它 */
  dataKeys: string[];
  /** data 的键由 `option.columns` 定义（schema 是自由键值对），此时键集校验不适用 */
  columnDriven: boolean;
  /** 渲染给模型看的字段说明；prop 不在表里时为 null（此时不做任何断言，别编） */
  text: string | null;
}

/**
 * 把一个 prop 的字段 schema 渲染成提示词片段。
 *
 * data 全量渲染（只有 1~4 个字段），option 只挑内容相关的——配色字号那些不该由这一步决定：
 * 每块区是独立并发调用，各自选色的结果是全屏一致性靠运气。视觉交给全屏统一的主题或素材层。
 */
export const describePropSchema = (prop: string): PropSchemaBrief => {
  if (!isKnownProp(prop)) {
    return { dataKeys: [], columnDriven: false, text: null };
  }

  const entry = componentPropSchemaMap[prop] as { data?: unknown; option?: unknown };
  const dataShape = shapeOf(entry.data);
  const optionShape = shapeOf(entry.option);

  const dataKeys = dataShape ? Object.keys(dataShape) : [];
  const sections: string[] = [];

  // skill 文档给语义与示例，zod 给权威键名——**两者会不一致，且必须由 zod 说了算**。
  //
  // 实测：echartpie 的 skill 文档写的是 `{ name, value }`（"扇区分类名称"），
  // 而 zod / dataRemark（运行时真正读的那份）是 `{ seriesName, value }`。
  // 第一版只把文档当权威，模型老实照做，产出的饼图一片空白。
  // 所以文档之后必须再钉一句键名，并写明冲突时以谁为准；只有 zod 没有 describe 时
  // 文档才是净增量（echart 那批 data 字段在 zod 里全无描述）。
  const doc = readDataFormatDoc(prop);
  if (doc) {
    sections.push(`data 的结构（字段含义与示例）：\n${doc}`);
  }
  if (dataKeys.length > 0) {
    sections.push(
      `data 每一项的**权威字段名**（只有这些；与上面示例若有出入，以这里为准）：\n` +
        (dataShape ? renderFields(dataShape, dataKeys) : dataKeys.map((k) => `  ${k}`).join("\n"))
    );

    // 光说「以这里为准」不够：示例里那个错名字仍然摆在眼前，模型的解法是**两个都写**
    // （实测 echartpie 产出 `{name, seriesName, value}`——渲染不坏，但多余键正是编字段名的信号）。
    // 所以把冲突的名字逐个点出来，从「你自己判断」变成「这几个别写」。
    const stale = docOnlyKeys(doc, dataKeys);
    if (stale.length > 0) {
      sections.push(
        `⚠️ 上面示例里的 ${stale.map((k) => `\`${k}\``).join("、")} 是**过时字段名，已经不存在**，` +
          `写了会被丢弃。不要为了保险两个都写。`
      );
    }
  }

  if (optionShape) {
    const contentKeys = Object.keys(optionShape)
      .filter((k) => CONTENT_OPTION_RE.test(k) && !STYLE_OPTION_RE.test(k))
      .slice(0, MAX_OPTION_FIELDS);
    if (contentKeys.length > 0) {
      sections.push(
        `option 里承载文字内容的字段（标题 / 单位 / 前后缀标签 / 表格列等，按需填，不填就用模板默认值）：\n${renderFields(optionShape, contentKeys)}`
      );
    }
  }

  // 有 `column` 这个 option 字段、data 又没有固定键 → 列驱动。
  // 注意是**单数** `column`：写成 columns 会一个都匹配不上（zod schema 里就叫 column）。
  const columnDriven = dataKeys.length === 0 && !!optionShape && "column" in optionShape;

  // `column` 的 name / alias 在 zod 里都没有 `.describe()`，上面只渲染得出两个光秃秃的字段名，
  // 而**哪个是数据键**恰恰是这里唯一会出错的地方（实测模型把数据键写进了 name）。
  // 语义只写在 skill 文档的 option 表格里，那一段不在 dataChart 小节内、抽不到，只能在这里明说。
  if (columnDriven) {
    sections.push(
      "表格列必须自己声明：option.column = [{ name: 表头显示名, alias: data 里的键 }, …]。\n" +
        "**alias 才是数据字段名**，各列的 alias 要和 data 每一项的键一一对应；不声明就会沿用模板默认列，跟你造的数据对不上、整张表是空的。"
    );
  }

  return { dataKeys, columnDriven, text: sections.length > 0 ? sections.join("\n\n") : null };
};

export interface DataKeyCheck {
  ok: boolean;
  /** 额外的人话说明，拼进喂回模型的反馈里 */
  note?: string;
  /** schema 里有、生成的数据里缺的键。缺了就是渲染不出来 */
  missing: string[];
  /** 生成的数据里有、schema 里没有的键。多余键会被静默丢弃，是模型编字段名的信号 */
  extra: string[];
}

/**
 * 校验模型给的 option 覆盖值**类型**是否与 schema 一致，目前只查「数组 vs 标量」这一维。
 *
 * 只查这一维是因为它是唯一会当场炸的：echart 那批组件里大量 option 是按系列平铺的数组，
 * 组件内部直接 `option.dataUnitName.forEach(...)` / `option.shadowFuzzy[i]`，
 * 给个字符串就是 `forEach is not a function`，整个图表白屏。
 *
 * **落盘那层拦不住它**——`validateComponentContent` 的属性层只出 warning、不阻断，
 * 而这里是唯一一个既知道 schema、又还能让模型改一次的位置。实测代价：
 * 模型把 `dataUnitName` 填成 `"MW"`，屏建出来了、断言全绿、浏览器里两个图表直接崩。
 */
export const checkOptionTypes = (prop: string, option?: Record<string, unknown>): string[] => {
  if (!isKnownProp(prop) || !option) {
    return [];
  }
  const optionShape = shapeOf((componentPropSchemaMap[prop] as { option?: unknown }).option);
  if (!optionShape) {
    return [];
  }

  const problems: string[] = [];
  for (const [key, value] of Object.entries(option)) {
    const label = typeLabel(optionShape[key]);
    if (!label) {
      continue;
    }
    const wantsArray = label.endsWith("[]") || label === "数组";
    if (wantsArray && !Array.isArray(value)) {
      problems.push(`${key} 必须是数组（${label}），你给的是 ${JSON.stringify(value)}`);
    } else if (!wantsArray && Array.isArray(value)) {
      problems.push(`${key} 必须是单值（${label}），你给的是数组`);
    }
  }
  return problems;
};

/**
 * 校验生成的 data 的**键集**是否与 schema 对得上。
 *
 * 只查键不查值：值的类型交给落盘时的 `validateComponentContent` 兜（那一层本来就要跑），
 * 而这里要的是一条能立刻喂回模型的、人话说得清的反馈——「你少了 seriesName、多了 load」。
 *
 * prop 不在 schema 表里时一律放行：没有权威可依时不该凭空拦人。
 */
export const checkDataKeys = (
  prop: string,
  data: ReadonlyArray<Record<string, unknown>>,
  option?: Record<string, unknown>
): DataKeyCheck => {
  const { dataKeys, columnDriven } = describePropSchema(prop);

  // 列驱动组件（ftScroll 这类，data 的键由 option.column 定义）：schema 里查不到固定键，
  // 键集校验对它永远放行。但它另有两条硬约束，都得在这里兜。
  //
  // 字段名一律以 zod schema 为准，别照直觉写：是**单数 `column`**，每列是
  // `{ name: 显示名, alias: 数据字段名, icon? }`——**数据键在 `alias` 上，不在 `name` 上**。
  // 这一处前后猜错过两次（columns/key、name/label），两次都是静默的：
  // 猜错键名后校验只会得到空集合，于是「全部对齐」——**漏报比误报更难发现**。
  if (columnDriven) {
    const column = option?.column;
    if (!Array.isArray(column) || column.length === 0) {
      return {
        ok: false,
        missing: ["option.column"],
        extra: [],
        note: `${prop} 的表格列由 option.column 定义（每列形如 { name: "订单号", alias: "orderId" }，name 是表头显示名、alias 是 data 里的键），不给就会沿用模板默认列，跟你造的数据对不上、整张表渲染成空`
      };
    }

    const aliases = column.map((col) => (col as { alias?: unknown } | null)?.alias);
    const badShape = aliases.some((a) => typeof a !== "string" || a.length === 0);
    if (badShape) {
      return {
        ok: false,
        missing: ["option.column[].alias"],
        extra: [],
        note: `${prop} 的每一列都必须写成 { name: 表头显示名, alias: data 里的键 }。只有这两个键名有效——写成 field / label / title 都会被丢弃，表格渲染成空`
      };
    }

    const present = new Set(data.flatMap((row) => Object.keys(row)));
    const missing = (aliases as string[]).filter((a) => !present.has(a));
    return missing.length === 0
      ? { ok: true, missing: [], extra: [] }
      : {
          ok: false,
          missing,
          extra: [],
          note: `${prop} 的 option.column 里这些 alias 在 data 里找不到对应的键，这几列会是空的`
        };
  }

  if (dataKeys.length === 0 || data.length === 0) {
    return { ok: true, missing: [], extra: [] };
  }

  const present = new Set(data.flatMap((row) => Object.keys(row)));
  const missing = dataKeys.filter((k) => !present.has(k));
  const extra = [...present].filter((k) => !dataKeys.includes(k));

  return { ok: missing.length === 0 && extra.length === 0, missing, extra };
};
