import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { extractSlots, loadScreenLayers } from "./extract-slots";

/**
 * 创建大屏布局范式模板。
 *
 * 用法：tsx --tsconfig "%FUNAI_PROJECT_TSCONFIG%" scripts/create-template.ts <screenId_versionCode>    例: 30551_1
 *
 * 产物：在 screen_{id}/ 根目录生成 template-{screenId}.json，结构遵循
 * docs/screen-layout-template-spec.md。
 *
 * 职责分工：
 * - 本脚本（程序）：填实机械字段——来源 / 分辨率 / 网格 / 插槽（extractSlots 抽取，结构元数据）。
 * - agent（AI）：随后按 spec 填写所有 TODO 语义字段（布局示意图 / 核心组件 / 嵌入摘要 等）。
 *   插槽数组脚本已填好，agent 不需要改动。
 */

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

const main = () => {
  const arg = process.argv[2];
  if (!arg) {
    console.error(
      'usage: tsx --tsconfig "%FUNAI_PROJECT_TSCONFIG%" scripts/create-template.ts <screenId_versionCode>   例: 30551_1'
    );
    process.exit(1);
  }

  // workspace 根 = scripts/ 的上一级。用 import.meta.dirname 定位，
  // 不依赖 cwd / MASTRA_WORKSPACE_PATH，保证在 sandbox 里（cwd=workspace 根）也能稳定运行。
  const base = path.join(import.meta.dirname, "..");
  const screenDir = path.join(base, `screen_${arg}`);
  const infoPath = path.join(screenDir, "info.json");
  if (!existsSync(infoPath)) {
    console.error(`info.json 不存在: ${infoPath}`);
    process.exit(1);
  }

  const info = JSON.parse(readFileSync(infoPath, "utf-8")) as {
    id: number;
    name?: string;
    updatedTime?: string;
    detail?: { width?: number | string; height?: number | string; backgroundColor?: string };
  };
  // 锚点统一取 _meta.json 的 updatedTime（大屏同步的权威时间戳，spec 规定 anchor = _meta.updatedTime，
  // 时效性判断也比对它）；缺失时回退到 info.updatedTime。
  const metaPath = path.join(screenDir, "_meta.json");
  const metaUpdatedTime = existsSync(metaPath)
    ? ((JSON.parse(readFileSync(metaPath, "utf-8")) as { updatedTime?: string }).updatedTime ?? "")
    : "";
  const anchor = metaUpdatedTime || info.updatedTime || "";

  const detail = info.detail ?? {};
  const width = Number(detail.width) || 0;
  const height = Number(detail.height) || 0;
  const g = width && height ? gcd(width, height) : 1;
  const ratio = width && height ? `${width / g}:${height / g}` : "";

  const layers = loadScreenLayers(screenDir, {
    existsSync,
    readdirSync,
    readFileSync,
    join: path.join
  });
  const slots = extractSlots(layers);

  const template = {
    模板ID: "TODO(agent填)：template-{范式英文短名}",
    模板名称: "TODO(agent填)：范式中文名（描述布局形态，与业务解耦）",
    来源: {
      screenId: info.id,
      screenName: info.name ?? "",
      anchor,
      note: "从该真实大屏提取的布局范式；已剔除实例文字/数据源，仅保留可复用的结构模式与骨干组件"
    },
    分辨率: {
      width,
      height,
      ratio,
      note: "TODO(agent填)：屏型说明及它如何支撑该布局"
    },
    网格: { cols: 24, rows: 12 },
    布局示意图:
      "TODO(agent填)：基于各区网格占位绘制 ASCII，必须体现 图层(谁在底/谁浮上) / 镜像对称 / 核心交互（见 spec 第四节）",
    适配场景: "TODO(agent填)：什么业务/场景适合此范式（讲场景，不讲布局）",
    核心布局: {
      整体结构: "TODO(agent填)：一句话概括",
      分区布局: {},
      symmetryRule: "TODO(agent填，无对称可删)",
      readingPattern: "TODO(agent填)"
    },
    核心组件: [],
    视觉风格: {},
    交互模式: [],
    AI匹配语义标签: [],
    嵌入摘要:
      "TODO(agent填)：一段自然语言，供向量化检索；依次含 适配场景 → 布局结构 → 内部结构模式 → 别名标签 → 与相似范式的区别",
    插槽: slots
  };

  const outPath = path.join(screenDir, `template-${info.id}.json`);
  writeFileSync(outPath, JSON.stringify(template, null, 2), "utf-8");

  // 路径与插槽数走 stdout，供调用方（sandbox / 子 agent）直接捕获并复用
  console.log(`模板骨架已生成: ${outPath}`);
  console.log(
    `插槽 ${slots.length} 个（text ${slots.filter((s) => s.type === "text").length} / chart ${slots.filter((s) => s.type === "chart-data").length}），结构元数据已填好`
  );
  console.error("下一步：agent 按 docs/screen-layout-template-spec.md 填写所有 TODO 语义字段（插槽数组不动）");
};

main();
