# Screenwright 图表组件数据结构验证报告

生成时间: 2026-04-13

## 概述

本报告验证了 32 个图表组件的静态数据结构，并为每个组件创建了完整的 Zod schema 验证文件，包括：
- **DataSchema**: 数据数组类型验证 (使用 `z.array()`)
- **OptionSchema**: 配置选项类型验证

## ✅ 验证结果

所有 32 个 echart 组件验证通过！

每个组件都包含：
- ✓ `z.array()` 包装的数据 schema
- ✓ `DataItemSchema` (单条数据)
- ✓ `DataSchema` (数组)
- ✓ `Data` 类型导出
- ✓ `OptionSchema` (配置选项)
- ✓ `Option` 类型导出
- ✓ 数据字段与 template 匹配
- ✓ 使用示例

## 组件列表及数据结构类型

### 1. 系列类数据结构 (seriesName + name + value)

包含 16 个组件，这些组件的数据需要系列名、类目和数值三个字段：

| 组件标识 | 组件名称 | 分类 | 配置字段数 |
|---------|---------|------|-----------|
| echartareaLine | 面积折线图 | 折线图 | 185 |
| echartbar | 柱状图 | 柱形图 | 187 |
| echartbothWayStripBar | 双向条形图 | 柱形图 | 104 |
| echartgrowthRateBar | 增长率柱状图 | 柱形图 | 88 |
| echartline | 折线图 | 折线图 | 161 |
| echartlineAndBar | 折线柱形图 | 柱形图 | 163 |
| echartmultiplyRankBar | 总数排名图 | 柱形图 | 48 |
| echartoverlapBar | 堆叠占比图 | 柱形图 | 37 |
| echartpictorialbar | 象形图 | 柱形图 | 154 |
| echartpluralRosePie | 层叠玫瑰图 | 饼图 | 143 |
| echartradar | 雷达图 | 其他 | 80 |
| echartscatter | 散点图 | 散点图 | 138 |
| echartstripBar | 条形图 | 柱形图 | 157 |
| echartthreedBarAndLine | 3D柱状折线图 | 柱形图 | 93 |
| echartzebra2 | 斑马柱状图2 | 柱形图 | 192 |
| echartzebraBarAndLine | 斑马柱状折线图 | 柱形图 | 150 |

**数据结构示例:**
```typescript
const data: echartbarData = [
  { seriesName: "系列一", name: "A", value: 2024 },
  { seriesName: "系列二", name: "A", value: 2378 }
];
```

### 2. 饼图类数据结构 (seriesName + value)

包含 7 个组件，这些组件的数据只需要系列名和数值：

| 组件标识 | 组件名称 | 分类 | 配置字段数 |
|---------|---------|------|-----------|
| echartdoubleValueLine | 特殊型折线图 | 折线图 | 75 |
| echartfunnel | 漏斗图 | 其他 | 43 |
| echartloopRingPie | 轮播环形饼图 | 饼图 | 87 |
| echartpie | 饼图 | 饼图 | 84 |
| echartscalePie | 刻度饼图 | 饼图 | 57 |
| echartthreePie | 3D饼图 | 饼图 | 95 |
| echartthreeQuartersPie | 环形饼图 | 饼图 | 56 |

**数据结构示例:**
```typescript
const data: echartpieData = [
  { seriesName: "系列一", value: 2024 },
  { seriesName: "系列二", value: 2378 }
];
```

### 3. 无系列类数据结构 (name + value)

包含 7 个组件，这些组件的数据只需要类目和数值：

| 组件标识 | 组件名称 | 分类 | 配置字段数 |
|---------|---------|------|-----------|
| echarteffectScatter | Top10气泡图 | 散点图 | 13 |
| echartgraph | 关系图 | 其他 | 32 |
| echartrank | 排名图 | 柱形图 | 110 |
| echartrankBar | 排名图 | 柱形图 | 26 |
| echartthinBar | 细长柱状图 | 柱形图 | 77 |
| echartthreedBar | 3D柱状图 | 柱形图 | 79 |
| echartzebra | 斑马柱状图 | 柱形图 | 80 |

**数据结构示例:**
```typescript
const data: echartrankData = [
  { name: "A", value: 2024 },
  { name: "B", value: 1423 }
];
```

### 4. 关系类数据结构 (source + target + value)

包含 1 个组件：

| 组件标识 | 组件名称 | 分类 | 配置字段数 |
|---------|---------|------|-----------|
| echartsankey | 桑基图 | 其他 | 24 |

**数据结构示例:**
```typescript
const data: echartsankeyData = [
  { source: "安徽", target: "江苏", value: 18.68 },
  { source: "广西", target: "广东", value: 30.36 }
];
```

### 5. 树形类数据结构 (name + value + children - 递归)

包含 1 个组件：

| 组件标识 | 组件名称 | 分类 | 配置字段数 |
|---------|---------|------|-----------|
| echarttreemap | 矩形树图 | 其他 | 14 |

**数据结构示例:**
```typescript
const data: echarttreemapData = [
  {
    name: "节点A",
    value: 50,
    children: [
      { name: "节点A-1", value: 10 },
      { name: "节点A-2", value: 10 }
    ]
  },
  { name: "节点B", value: 40 }
];
```

## 文件位置

- **Schema 文件**: `packages/types/src/schemas/components/`
- **组件配置**: `servers/server/src/mastra/vector/component-data/parsed-components/`
- **组件文档**: `servers/server/src/mastra/vector/component-docs/图表/`

## 使用方式

### 数据验证

```typescript
import {
  echartbarDataSchema,
  echartbarOptionSchema,
  type echartbarData,
  type echartbarOption
} from '@your-package/schemas/components';

// 验证数据
const dataResult = echartbarDataSchema.safeParse(yourData);
if (!dataResult.success) {
  console.error('数据验证失败:', dataResult.error);
}

// 验证配置
const optionResult = echartbarOptionSchema.safeParse(yourOption);
if (!optionResult.success) {
  console.error('配置验证失败:', optionResult.error);
}

// 类型注解
const myData: echartbarData = [
  { seriesName: "系列一", name: "A", value: 2024 }
];

const myOption: echartbarOption = {
  refresh: true,
  dataSeriesName: ["系列一"],
  legendShow: true
  // ... 其他配置
};
```

### 批量导入

```typescript
// 导入所有组件类型
import * as ComponentSchemas from '@your-package/schemas/components';

// 使用特定组件
const { echartbarDataSchema, echartpieDataSchema } = ComponentSchemas;
```

## 更新日志

- **2026-04-13**: 
  - 修复所有 data schema，使用 `z.array()` 包装
  - 为所有 32 个 echart 组件添加 OptionSchema
  - 验证所有组件与 template 数据完全匹配
