import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "README.md"), "utf8");
const lines = src.split("\n");

function findLine(prefix, from = 0) {
  const i = lines.findIndex((l, idx) => idx >= from && l.startsWith(prefix));
  if (i === -1) throw new Error("Not found: " + prefix);
  return i;
}

function slice(fromPrefix, toPrefix) {
  const start = findLine(fromPrefix);
  const end = toPrefix ? findLine(toPrefix, start + 1) : lines.length;
  return lines.slice(start, end).join("\n");
}

const docsDir = path.join(root, "docs");
fs.mkdirSync(docsDir, { recursive: true });

const structureExtra = fs.readFileSync(path.join(__dirname, "split-readme-structure-extra.md"), "utf8");

const structure =
  "# 目录与维护地图\n\n" +
  "> **本文档回答：** 代码在哪？出问题改哪个文件？各目录边界是什么？\n\n" +
  "[← 返回索引](../README.md)\n\n---\n\n" +
  slice("## 一、架构与目录", "## 二、类型与数据结构") +
  "\n\n---\n\n" +
  structureExtra;

const flowExtra = fs.readFileSync(path.join(__dirname, "split-readme-flow-extra.md"), "utf8");

const flow =
  "# 调用链与核心策略\n\n" +
  "> **本文档回答：** 程序怎么跑？文件之间什么关系？策略如何分发？\n\n" +
  "[← 返回索引](../README.md) · 详细参数见 [API 参考](./03-api-reference.md) · 原理见 [机制与引擎](./04-principles-and-engines.md)\n\n---\n\n" +
  flowExtra +
  "\n\n---\n\n" +
  slice("## 四、对外入口 API", "## 五、全流程") +
  "\n\n---\n\n" +
  slice("## 五、全流程", "## 六、策略原理") +
  "\n\n---\n\n" +
  fs.readFileSync(path.join(__dirname, "split-readme-flow-tail.md"), "utf8");

const apiExtra = fs.readFileSync(path.join(__dirname, "split-readme-api-extra.md"), "utf8");

const apiRef =
  "# API / 配置 / 类型详细参考\n\n" +
  "> **本文档回答：** 每个参数、函数干什么？如何安全改代码不破坏现有行为？\n\n" +
  "[← 返回索引](../README.md) · 流程见 [调用链](./02-flow-and-strategies.md)\n\n---\n\n" +
  slice("## 二、类型与数据结构", "## 三、全局配置 CFG") +
  "\n\n---\n\n" +
  slice("## 三、全局配置 CFG", "## 四、对外入口 API") +
  "\n\n---\n\n" +
  slice("## 四、对外入口 API", "## 五、全流程") +
  "\n\n---\n\n" +
  slice("## 七、逐文件 API 参考", "## 八、Snapdom vs html2canvas") +
  "\n\n---\n\n" +
  apiExtra +
  "\n\n" +
  slice("## 十、调试指南", "*文档版本");

const principlesExtra = fs.readFileSync(path.join(__dirname, "split-readme-principles-extra.md"), "utf8");

const principles =
  "# 机制原理与引擎对比\n\n" +
  "> **本文档回答：** 截图为什么这样设计？sanitize / 数据层 / 分层合成是什么意思？html2canvas 和 snapdom 怎么选？\n\n" +
  "[← 返回索引](../README.md) · 流程见 [调用链](./02-flow-and-strategies.md) · 参数见 [API 参考](./03-api-reference.md)\n\n---\n\n" +
  principlesExtra +
  "\n\n---\n\n" +
  slice("## 六、策略原理", "## 七、逐文件 API 参考") +
  "\n\n---\n\n" +
  slice("## 八、Snapdom vs html2canvas", "## 九、后续优化方向") +
  "\n\n---\n\n" +
  slice("## 九、后续优化方向", "## 十、调试指南") +
  "\n\n---\n\n*机制文档与代码同步至 captureStrategies 拆解后架构。*";

fs.writeFileSync(path.join(docsDir, "01-structure.md"), structure);
fs.writeFileSync(path.join(docsDir, "02-flow-and-strategies.md"), flow);
fs.writeFileSync(path.join(docsDir, "03-api-reference.md"), apiRef);
fs.writeFileSync(path.join(docsDir, "04-principles-and-engines.md"), principles);
console.log("Split complete");
