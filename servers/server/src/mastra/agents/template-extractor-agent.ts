import { Agent } from "@mastra/core/agent";

import { loadPrompt } from "@/agent-resources/prompts";

import { resolveReasoningModel } from "../provider/model-registry";
import { memory } from "../storage/storage";
import { editFilesTool, readFileTool } from "../tools/file";
import { fullWorkspace } from "../workspace";

/**
 * 大屏布局范式模板提取 Agent。
 *
 * 定位：模板即"认知与范式合一"的单一产物——直接由 _layout.json + _event_flows + info.json
 * 做语义理解 + 去实例化抽象，产出可复用的 template-{screenId}.json 供 embedding 检索。
 * **不依赖已废弃的 _analysis.json 中间层。**
 *
 * 工作流（见 prompts/template-extractor-core.md）：
 * 1. sandbox 跑 `npx tsx scripts/create-template.ts <id>` 机械抽插槽 + 写骨架；
 * 2. 读 _layout.json + _event_flows + info.json 建立认知（聚类分区/定镜像与交互/核实嵌套）；
 * 3. edit_files 填语义 TODO 字段 + 标注每个插槽 role；
 * 4. 只回模板路径 + 范式名 + 插槽数，探索细节不回灌主 agent。
 *
 * 工具：
 * - readFileTool / editFilesTool：读探索产物/组件、改模板文件。
 * - sandbox（随 fullWorkspace 自动挂载）：跑 create-template.ts。
 * - skill_read（随 workspace）：按需查组件字段定义。
 */
const instructions = [
  loadPrompt("mastra/template-extractor-core.md"),
  loadPrompt("mastra/workspace-structure.md"),
  loadPrompt("mastra/file-tools.md")
].join("\n\n");

export const templateExtractorAgent = new Agent({
  id: "template-extractor-agent",
  name: "模板提取 Agent",
  description:
    "从单个真实大屏提取可复用的布局范式模板（template-{screenId}.json）。直接由 _layout.json + _event_flows + info.json 做语义理解与去实例化抽象，跑 create-template.ts 抽插槽，回写模板的语义字段与插槽 role，供 embedding 检索。需要为某屏生成/刷新布局范式模板时调用。",
  instructions,

  model: () => resolveReasoningModel(),

  memory,
  // 需要 sandbox 跑脚本 + skill_read 查字段定义，用全量 workspace。
  workspace: fullWorkspace,
  tools: {
    readFileTool,
    editFilesTool
  },
  defaultOptions: {
    maxSteps: 25
  }
});
