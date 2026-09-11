import { Agent } from "@mastra/core/agent";
import { z } from "zod";

import { resolveReasoningModel } from "../provider/model-registry";
// ============ 内部共用 Schema（严格对齐 subtabDefaultConfig 数据库结构） ============

/**
 * 样式对象 Schema（defaultObj / activeObj / hoverObj 公用结构）
 */
const styleObjSchema = z.object({
  textTranslateX: z.number(),
  textTranslateY: z.number(),
  isBorder: z.boolean(),
  borderWidth: z.number(),
  borderColor: z.string(),
  backgroundColor: z.string(),
  backgroundImage: z.string(),
  backgroundImageType: z.string(),
  backgroundType: z.string(),
  fontSize: z.number(),
  fontWeight: z.union([z.boolean(), z.string(), z.number()]),
  fontStyle: z.union([z.boolean(), z.string()]),
  fontFamily: z.string(),
  fontColor: z.string(),
  isTextShadow: z.boolean(),
  textShadow: z.object({
    x: z.number(),
    y: z.number(),
    blur: z.number(),
    color: z.string(),
    extend: z.number()
  })
});

/**
 * 系列选项卡子项 Schema
 */
const seriesTabItemSchema = z.object({
  name: z.string(),
  defaultObj: styleObjSchema,
  activeObj: styleObjSchema,
  hoverObj: styleObjSchema
});

/**
 * option 选项配置 Schema
 * 注意：defaultObj/activeObj/hoverObj 已废弃，统一使用 seriesTabsList 系列样式
 */
const subtabOptionSchema = z.object({
  active: z.number(),
  rows: z.number(),
  columns: z.number(),
  rowGap: z.number(),
  columnGap: z.number(),
  paddingTop: z.number(),
  paddingBottom: z.number(),
  paddingLeft: z.number(),
  paddingRight: z.number(),
  writingMode: z.string(),
  alignItems: z.string(),
  textAlign: z.string(),
  playVisible: z.boolean(),
  playDelay: z.number(),
  playDuration: z.number(),
  scrollVisible: z.boolean(),
  scrollGap: z.number(),
  scrollTrack: z.string(),
  scrollSlide: z.string(),
  componentLink: z.boolean(),
  isCallback: z.boolean(),
  related: z.boolean(),
  isIsolated: z.boolean(),
  isCancelSelected: z.boolean(),
  isHovered: z.boolean(),
  // 废弃字段，保留兼容
  defaultObj: styleObjSchema.optional(),
  activeObj: styleObjSchema.optional(),
  hoverObj: styleObjSchema.optional(),
  isSeriesFirst: z.boolean(),
  seriesTabsList: z.array(seriesTabItemSchema)
});

/**
 * 加载动画 Schema
 */
const loadAnimationSchema = z.object({
  type: z.string(),
  direction: z.string(),
  duration: z.number(),
  delay: z.number(),
  timingFunction: z.string()
});

/**
 * 数据项 Schema
 */
const tabDataItemSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  disabled: z.boolean().optional()
});

/**
 * 完整 Subtabs 组件 Schema（严格对齐 subtabDefaultConfig 数据库结构）
 */
const subtabsComponentSchema = z.object({
  id: z.number(),
  component: z.object({
    prop: z.string(),
    width: z.number(),
    height: z.number(),
    name: z.string()
  }),
  name: z.string(),
  left: z.number(),
  top: z.number(),
  isLock: z.boolean(),
  zIndex: z.number(),
  display: z.boolean(),
  option: subtabOptionSchema,
  data: z.array(tabDataItemSchema),
  img: z.string(),
  title: z.string(),
  listenArgs: z.array(z.any()),
  cbArgs: z.array(z.any()),
  openFilter: z.boolean(),
  dataSource: z.any(),
  dataType: z.number(),
  dataRemark: z.array(z.any()),
  events: z.array(z.any()),
  encodes: z.array(z.any()).optional(),
  loadAnimation: loadAnimationSchema,
  icon: z.string().optional(),
  callbackArgs: z.array(z.any()).optional(),
  dataFormatter: z.string().optional(),
  moduleId: z.number().optional()
});

/**
 * Subtabs 组件构建 Agent 输入 Schema
 */
export const SubtabConstructionInputSchema = z.object({
  /** Figma 归一化节点（选项卡根节点） */
  figmaNode: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    layout: z.any().optional(),
    children: z.array(z.any()).optional(),
    fills: z.any().optional(),
    strokes: z.any().optional(),
    effects: z.any().optional(),
    textStyle: z.any().optional()
  }),

  /** 选项卡默认配置（从数据库查询，结构对齐 subtabDefaultConfig） */
  defaultConfig: subtabsComponentSchema,

  /** 图片路径映射（nodeId -> MinIO URL） */
  imagePathMap: z.record(z.string(), z.string()).optional(),

  /** 选项卡数据（从 -active/-noActive 节点提取） */
  tabsData: z.array(tabDataItemSchema).optional(),

  /** 系列样式列表（已填充 backgroundImage，需要补充文字样式） */
  seriesTabsList: z.array(seriesTabItemSchema).optional(),

  /** 上下文信息 */
  context: z
    .object({
      /** 任务描述 */
      task: z.string().optional(),
      /** 特殊要求 */
      requirements: z.array(z.string()).optional()
    })
    .optional()
});

/**
 * Subtabs 组件构建 Agent 输出 Schema
 */
export const SubtabConstructionOutputSchema = z.object({
  /** 转换后的完整组件配置（严格对齐 subtabDefaultConfig 数据库结构） */
  component: subtabsComponentSchema,

  /** 分析说明 */
  analysis: z.object({
    layoutType: z.string().describe("布局类型：horizontal/vertical/grid"),
    tabCount: z.number().describe("选项卡数量"),
    hasActiveState: z.boolean().describe("是否识别到激活状态样式"),
    hasImages: z.boolean().describe("是否使用图片背景"),
    styleSource: z.string().describe("样式来源说明")
  })
});

export type SubtabConstructionInput = z.infer<typeof SubtabConstructionInputSchema>;
export type SubtabConstructionOutput = z.infer<typeof SubtabConstructionOutputSchema>;

const instructions: string = `# 身份

你是 Figma 选项卡组件转换专家，负责分析 Figma 设计稿中的选项卡节点，提取布局信息，并映射到 screenwright Subtabs 组件配置。

# 任务目标

将 Figma 中的选项卡设计转换为完整的 Subtabs 组件配置，重点关注：
1. **布局计算**：精确提取行列数、间距、内边距等布局参数
2. **系列样式配置**：为每个选项卡项生成独立的 seriesTabsList 配置

# 核心转换流程

## 步骤 1：识别全局布局（重点）

1. **计算选项卡数量**：\`figmaNode.children.length\`

2. **判断布局类型**：
   - 从每个子节点的 \`absoluteBoundingBox\` 获取位置信息
   - **注意：Figma 的 y 坐标可能是负数，数值越大位置越靠下**

   **判断逻辑（容错阈值放宽到 50px）**：
   - **垂直排列**：所有子节点的 \`x\` 坐标相近（差值 < 50），\`y\` 坐标递增（数值从小到大，或负数从大到小）
     - 判断方法：计算 x 坐标的标准差，如果很小（< 50），且 y 坐标有明显递增趋势
   - **水平排列**：所有子节点的 \`y\` 坐标相近（差值 < 50），\`x\` 坐标递增
   - **网格排列**：既有 x 又有 y 的明显变化，且都超过 50px 的差值

3. **计算行列数**：
   - 水平：\`rows = 1, columns = 子节点数\`
   - 垂直：\`rows = 子节点数, columns = 1\`
   - 网格：根据实际位置分组计算

4. **计算间距**：
   - \`rowGap\`：相邻行之间的垂直距离 = \`相邻节点的 y 坐标差值绝对值 - 前一个节点的 height\`
   - \`columnGap\`：相邻列之间的水平距离 = \`相邻节点的 x 坐标差值绝对值 - 前一个节点的 width\`
   - 注意：负数坐标时，使用绝对值计算

**示例 1：垂直布局计算（负坐标）**
\`\`\`
子节点排列顺序（按名称序号）：
  1-active: { x: 13038, y: -6658, width: 401, height: 148 }
  2-noActive: { x: 13070, y: -6490, width: 345, height: 148 }
  3-noActive: { x: 13070, y: -6322, width: 345, height: 148 }
  4-noActive: { x: 13070, y: -6154, width: 345, height: 148 }

分析：
  - x 坐标：13038, 13070, 13070, 13070 → 最大差值 32px < 50px，判定为相近
  - y 坐标：-6658 → -6490 → -6322 → -6154 → 数值递增（负数变大），位置从上到下

结论：
  布局类型: vertical (x 坐标相近，y 坐标递增)
  rows: 4
  columns: 1
  rowGap 计算：
    节点1 到 节点2: |-6490 - (-6658)| - 148 = 168 - 148 = 20
    节点2 到 节点3: |-6322 - (-6490)| - 148 = 168 - 148 = 20
    节点3 到 节点4: |-6154 - (-6322)| - 148 = 168 - 148 = 20
  rowGap: 20
\`\`\`

**示例 2：水平布局计算**
\`\`\`
子节点位置：
  节点1: { x: 100, y: 200, width: 120, height: 40 }
  节点2: { x: 230, y: 200, width: 120, height: 40 }
  节点3: { x: 360, y: 200, width: 120, height: 40 }

分析：
  - y 坐标：200, 200, 200 → 完全相同
  - x 坐标：100 → 230 → 360 → 递增

结论：
  布局类型: horizontal
  rows: 1
  columns: 3
  columnGap: 230 - 100 - 120 = 10
\`\`\`

## 步骤 2：提取选项卡数据（tabsData）

遍历 \`figmaNode.children\`，从 TEXT 节点的 \`characters\` 字段提取文字内容：
\`\`\`typescript
data: [
  { label: "三大发展历程", value: "0" },
  { label: "四大核心技术", value: "1" },
  ...
]
\`\`\`

## 步骤 3：处理 seriesTabsList（系列样式配置）

**核心机制**：每个选项卡项使用 seriesTabsList 系列样式，每个系列包含三种状态样式：
- \`defaultObj\`：默认状态（未选中）
- \`activeObj\`：激活状态（选中）
- \`hoverObj\`：悬停状态

### 3.1 匹配状态节点

输入的 seriesTabsList 已预填充 backgroundImage，需要从 \`-active\` 和 \`-noActive\` 子节点补充文字样式：

\`\`\`
for (const item of seriesTabsList) {
  // 根据 name 找到对应的状态节点
  const activeNode = 找到名称匹配且以 "-active" 结尾的节点
  const noActiveNode = 找到名称匹配且以 "-noActive" 结尾的节点

  if (activeNode) {
    从 TEXT 子节点补充 activeObj 的文字样式
  }
  if (noActiveNode) {
    从 TEXT 子节点补充 defaultObj 和 hoverObj 的文字样式
  }
}
\`\`\`

### 3.2 文字样式提取

从 TEXT 节点提取并补充：
- \`fontSize\`：从 \`textStyle.fontSize\` 或 \`style.fontSize\`
- \`fontFamily\`：从 \`textStyle.fontFamily\` 或 \`style.fontFamily\`
- \`fontColor\`：从 \`fills\` 数组提取颜色
- \`textTranslateX / textTranslateY\`：计算文本偏移量

### 3.3 文本偏移量计算

\`\`\`
textTranslateX = TEXT节点的 x 坐标 - 状态节点的 x 坐标 - (状态节点宽度 - TEXT节点宽度) / 2
textTranslateY = TEXT节点的 y 坐标 - 状态节点的 y 坐标 - (状态节点高度 - TEXT节点高度) / 2
\`\`\`

## 步骤 4：生成最终配置

将提取的信息合并到 \`defaultConfig\`：

1. **更新布局参数**：
   - \`rows\` / \`columns\`：根据布局计算
   - \`rowGap\` / \`columnGap\`：根据实际间距计算
   - \`paddingTop/PaddingBottom/PaddingLeft/PaddingRight\`：从容器边界计算
2. **更新 data**：使用提取的选项卡标签数组
3. **设置 isSeriesFirst: true**：启用系列样式优先模式
4. **填充 seriesTabsList**：每个选项卡的完整样式配置

# 输入数据结构

## 1. figmaNode（Figma 归一化节点）

选项卡根节点，包含 \`-active\` 和 \`-noActive\` 子节点：

\`\`\`typescript
{
  "id": "2014:2467",
  "name": "标题-subtab",
  "type": "INSTANCE",
  "children": [
    {
      "id": "...",
      "name": "按钮-01三大发展历程-active",
      "type": "GROUP",
      "children": [
        { "name": "...", "type": "RECTANGLE" },
        {
          "name": "四大核心技术",
          "type": "TEXT",
          "characters": "三大发展历程",
          "style": {
            "fontFamily": "Alibaba PuHuiTi 2.0",
            "fontSize": 24,
            ...
          }
        }
      ]
    },
    {
      "id": "...",
      "name": "按钮-01三大发展历程-noActive",
      "type": "GROUP",
      ...
    }
  ]
}
\`\`\`

**重要字段**：
- \`characters\`：TEXT 节点的文字内容（这是真正的显示文本）
- \`style\`：TEXT 节点的样式属性（fontSize, fontFamily 等）

## 2. seriesTabsList（已预填充 backgroundImage）

\`\`\`typescript
[
  {
    "name": "系列1",
    "defaultObj": {
      "backgroundImage": "http://minio-url/noActive.png",
      "backgroundType": "custom",
      "backgroundImageType": "100% 100%",
      ...
    },
    "activeObj": {
      "backgroundImage": "http://minio-url/active.png",
      "backgroundType": "custom",
      "backgroundImageType": "100% 100%",
      ...
    },
    "hoverObj": { 
      "backgroundImage": "http://minio-url/active.png",
      "backgroundType": "custom",
      "backgroundImageType": "100% 100%",
      ...
    }
  }
]
\`\`\`

需要补充：fontSize, fontFamily, fontColor, textTranslateX, textTranslateY 等文字样式。

# 输出要求

严格按照 \`SubtabConstructionOutputSchema\` 生成 JSON：

\`\`\`json
{
  "component": {
    "option": {
      "rows": 1,
      "columns": 3,
      "rowGap": 0,
      "columnGap": 10,
      "isSeriesFirst": true,
      "seriesTabsList": [
        {
          "name": "系列1",
          "defaultObj": { ...完整样式... },
          "activeObj": { ...完整样式... },
          "hoverObj": { ...完整样式... }
        }
      ]
    },
    "data": [
      { "label": "三大发展历程", "value": "0" },
      ...
    ]
  },
  "analysis": {
    "layoutType": "horizontal",
    "tabCount": 3,
    "hasActiveState": true,
    "hasImages": true,
    "styleSource": "从 -active/-noActive 子节点提取样式"
  }
}
\`\`\`

# 注意事项

1. **布局优先**：精确计算行列数和间距是核心任务
2. **系列样式模式**：统一使用 seriesTabsList，不再使用顶层的 defaultObj/activeObj/hoverObj
3. **文字提取**：从 TEXT 节点的 \`characters\` 字段获取真正的显示文本
4. **颜色转换**：Hex 转 RGBA，如 \`"#FFFFFF"\` → \`"rgba(255,255,255,1)"\`
`;

/**
 * Subtabs 组件构建 Agent
 *
 * 核心功能：
 * 1. 分析 Figma 选项卡节点的布局结构（行列数、间距）
 * 2. 处理 seriesTabsList 系列样式配置（补充文字样式）
 * 3. 从 TEXT 节点提取 characters 字段作为显示文本
 * 4. 生成完整的组件配置 JSON
 */
export const subtabConstructionAgent = new Agent({
  id: "subtab-construction-agent",
  name: "Subtabs Component Constructor",
  instructions: instructions,
  model: () => resolveReasoningModel(),
  tools: {}
});
