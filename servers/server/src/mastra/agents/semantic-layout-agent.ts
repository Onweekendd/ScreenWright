import { Agent } from "@mastra/core/agent";

import { resolveVisionModel } from "../provider/model-registry";

/**
 * 大屏语义布局分析专用 Agent。
 *
 * 它只输出调用方提供的结构化 Schema；区域归属、冲突消解和最终节点树均由确定性代码处理。
 */
export const semanticLayoutAgent = new Agent({
  id: "semantic-layout-agent",
  name: "Semantic Layout Agent",
  instructions: `
你是大屏设计稿的语义布局分析器。

规则：
1. 只描述图片中真实可见的结构，不推测隐藏内容。
2. 坐标统一使用 0 到 1000 的归一化坐标，原点为图片左上角。
3. 一级区域必须扁平，禁止区域嵌套。
4. 区域内部的分组也只允许一层，禁止分组嵌套。
5. 分组表示需要一起移动、缩放或维护的功能单元，例如“标题背景 + 标题文字”“指标名称 + 数值 + 单位”。
6. 不要为了提高覆盖率强行分组；不确定时保持未分组。
7. 严格遵循调用方提供的结构化输出 Schema。
`,
  description: "识别大屏一级区域和区域内部的一层功能分组",
  model: () => resolveVisionModel(),
  tools: {},
  defaultOptions: {
    maxSteps: 1
  }
});
