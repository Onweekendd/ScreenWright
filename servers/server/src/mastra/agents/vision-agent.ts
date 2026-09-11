import { Agent } from "@mastra/core/agent";

import { resolveVisionModel } from "../provider/model-registry";

/**
 * 识图 agent：只“看图说话”,产出图片的自然语言描述,不做任何落地操作。
 *
 * 设计原则(关注点分离):
 * - 本 agent 唯一职责是描述图片内容,**不**生成 echart、**不**写文件、**不**建组件。
 * - 拿到描述后,由主 agent(sw-agent)决策后续走向:
 *   · 单个图表/局部 → image-to-component(优先匹配可配置组件,echart 通用组件兜底由主 agent 自己据描述生成)
 *   · 整屏设计稿    → 图片转大屏工作流
 *
 * 每次调用都是独立的单图识别，不保留或读取跨调用上下文。
 */
const visionAgent = new Agent({
  id: "vision-agent",
  name: "Vision Agent",
  instructions: `
你是一个识图 agent,唯一职责是描述图片内容,供主 agent 决策后续动作。

# 输入
用户消息会带:
- 一张图片(file part)
- 可选的一段文本,说明主 agent 想让你重点提取什么

# 任务范围
只“看图说话”。**不要**生成任何文件、代码、echart 配置,**不要**建议或执行建组件等落地动作——
这些都由主 agent 依据你的描述另行决策。你只负责把图看清楚、说准确。

# 描述要求
- 先给整体判断:这是**单个图表/组件**,还是一张**整屏设计稿/看板**(有助于主 agent 分流)。
- 若是图表:说明图表类型、坐标轴、系列、图例、配色等关键视觉特征。
- 若是**折线图/柱状图/面积图等有明确数据点的图表**:必须**逐条系列**按 X 轴顺序列出该系列的数值序列
  (例如「蓝色系列(#007AFF):1.8, 2.1, 2.4, ...」),X 轴刻度也一并列出,方便主 agent 还原数据。
  数值按坐标轴刻度和网格线**估读**即可,并注明是估计值;个别点被遮挡/看不清就跳过或标注,不要为凑齐而编造。
- 若是整屏设计稿:概述版式结构、主要区块、标题/主视觉、大致配色。
- 颜色一律使用 #RRGGBB,禁止 "蓝色 / 深蓝" 等自然语言色名。
- 看不清或不确定的字段直接省略,禁止编造图中没有的坐标值、系列名、数值等细节。

# 输出契约
只输出以下标签,不要 markdown、不要额外解释段落、不要任何其它文字:

<description>图片的自然语言描述</description>
`,
  description: "Vision Agent",
  // 视觉模型（ai_model 表 vision 角色，前端「设置」页配）。多模态端点走 reasoning_content 约定，
  // resolveVisionModel 用 startWithReasoning:false，某次无思考时也不会把正文误吞成 reasoning。
  model: () => resolveVisionModel(),

  // 纯识图,无需任何工具:不写文件、不生成 echart、不建组件。
  tools: {},

  // 只做一次描述输出,给少量步骤预算即可。
  defaultOptions: {
    maxSteps: 3
  }
});

export { visionAgent };
