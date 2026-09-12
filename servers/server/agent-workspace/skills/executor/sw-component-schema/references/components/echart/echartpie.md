# echartpie (饼图) 配置说明

## dataChart 数据格式

```typescript
interface PieDataItem {
  seriesName: string;  // 扇区分类名称（即"系列名"）
  value: number;       // 扇区数值
}

type dataChart = PieDataItem[];
```

**示例**：
```json
[
  { "seriesName": "产品A", "value": 2024 },
  { "seriesName": "产品B", "value": 2378 },
  { "seriesName": "产品C", "value": 1423 },
  { "seriesName": "产品D", "value": 1532 }
]
```

---

## ⚠️ 系列与 data 必须一一对应（最常踩的坑）

`dataSeriesName` / `seriesName` / `seriesTabsName` / `seriesColor` 这几个数组**长度必须等于 `data` 里 distinct 的 `seriesName` 个数**，且顺序、取值要和 `data` 逐项对应，不能照抄示例里的占位值（"系列一"/"系列二"/"系列三"）：

- `dataSeriesName` 与 `seriesName`：每一项的字符串**必须**等于 `data` 中对应那个扇区的 `seriesName` 原文（用于图例/tooltip 匹配数据，写成"系列一"这种占位符会导致图例对不上实际扇区、数值显示为空）。
- `seriesTabsName`：`{name, value}[]`，`value` 同样要等于真实的 `seriesName`；`name` 是给这个 tab 起的展示名，可以自定义。
- `seriesColor`：`string[]`，元素个数应 ≥ `data` 项数（少于会导致颜色循环复用/部分扇区透明）。**注意是纯色 hex 字符串数组**，不是渐变对象。

生成饼图时的正确顺序：**先确定 `data`，再让 `dataSeriesName`/`seriesName`/`seriesTabsName.value`/`seriesColor` 按 `data` 的实际扇区数和名称配齐**，而不是先套用一份固定的三系列模板。

---

## option 完整字段参考

### 系列配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `dataSeriesName` | string[] | 数据系列名列表，需与 data 的 seriesName 一一对应（见上方警告） |
| `seriesName` | string[] | 图例显示的系列名，需与 data 的 seriesName 一一对应 |
| `seriesTabsName` | {name,value}[] | 系列切换标签，value 需等于 data 的 seriesName |
| `seriesColor` | string[] | 扇区颜色（纯色 hex），个数应覆盖 data 项数 |
| `seriesOrder` | string | 排序方式:"default"/"ascending"/"descending" |
| `seriesLeft`/`seriesTop`/`seriesRight`/`seriesBottom` | number | 饼图区域边距 |

### 系列标签配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLabelShow` | boolean | 是否显示数值标签 |
| `seriesDistanceToLabelLine` | number | 标签线距离 |
| `seriesLabelLineLength` | number | 标签线长度 |
| `seriesLabelOrient` | string | 标签排列方向:"horizontal"/"vertical"/"radial" |
| `seriesLabelSeriesShow` | boolean | 是否显示系列名称 |
| `seriesLabelSeriesFontFamily`/`FontSize`/`Color`/`FontStyle`/`FontWeight` | - | 系列名称文字样式 |
| `seriesLabelPercentShow` | boolean | 是否显示百分比 |
| `seriesLabelPercentValue` | number | 百分比小数位数 |
| `seriesLabelPercentFontFamily`/`FontSize`/`Color`/`FontStyle`/`FontWeight` | - | 百分比文字样式 |
| `seriesLabelValueShow` | boolean | 是否显示数值 |
| `seriesLabelUnit` | string | 标签单位 |
| `seriesLabelUnitFontSize`/`seriesLabelUnitLeftPadding` | number | 单位样式 |
| `seriesLabelValueLeftPadding`/`FontFamily`/`FontSize`/`Color`/`FontStyle`/`FontWeight` | - | 数值文字样式 |

### 图例配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `legendShow` | boolean | 是否显示图例 |
| `legendOrient` | string | 图例方向:"horizontal"/"vertical" |
| `legendOrder` | string | 图例排序:"default"/"ascending"/"descending" |
| `legendItemWidth`/`legendItemHeight` | number | 图例项尺寸 |
| `legendTextLeftPadding` | number | 图例文字左侧内边距 |
| `legendSeriesShow`/`FontFamily`/`FontSize`/`Color`/`FontStyle`/`FontWeight` | - | 图例系列名样式 |
| `legendPercentShow`/`Percent`/`PercentLeftPadding`/`PercentFontFamily`/`PercentFontSize`/`PercentColor`/`PercentFontStyle`/`PercentFontWeight`/`PercentColorFollow` | - | 图例百分比样式 |
| `legendValueShow`/`Unit`/`UnitFontSize`/`UnitLeftPadding`/`ValueLeftPadding`/`ValueColorFollow`/`ValueFontFamily`/`ValueFontSize`/`ValueColor`/`ValueFontStyle`/`ValueFontWeight` | - | 图例数值样式 |
| `legendWidth`/`legendHeight`/`legendItemGap` | number | 图例整体尺寸/间距 |
| `legendGrid` | {top,left?,right?,bottom?} | 图例位置 |
| `legendOffsetX`/`legendOffsetY` | number | 图例偏移 |
| `legendSeriesWidthType`/`legendSeriesWidth` | - | 图例系列宽度类型/宽度 |

### 饼图特定配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `pieRadiusOuter` | number | 外半径（百分比） |
| `pieRadiusInner` | number | 内半径（百分比，>0 即环形图） |
| `pieRoseType` | boolean | 是否为玫瑰图 |
| `pieStartAngle` | number | 起始角度 |
| `pieClockwise` | boolean | 是否顺时针 |
| `itemBorderWidth`/`itemBorderColor` | - | 扇区边框 |

### Tooltip 配置（均为可选）

| 字段 | 类型 | 说明 |
|------|------|------|
| `tooltipLoop`/`tooltipLoopInterval` | - | 是否循环展示/循环间隔(s) |
| `tooltipTriggerOn` | boolean | 是否触发 |
| `tooltipOffsetX`/`tooltipOffsetY` | number | 偏移 |
| `tooltipBackground`/`tooltipWidth`/`tooltipHeight` | - | 背景/尺寸 |
| `tooltipPaddingTop`/`Bottom`/`Left`/`Right` | number | 内边距 |
| `tooltipNameFontFamily`/`FontSize`/`Color`/`FontWeight`/`FontStyle` | - | 名称文字样式 |
| `tooltipAlign` | string | "left"/"center"/"right" |
| `tooltipSeriesNameFontFamily`/`FontSize`/`Color`/`FontWeight`/`FontStyle` | - | 系列名文字样式 |
| `tooltipValueFontFamily`/`FontSize`/`Color`/`FontWeight`/`FontStyle` | - | 数值文字样式 |
| `tooltipUnit` | string[] | 单位数组 |
| `tooltipUnitFontFamily`/`FontSize`/`Color`/`FontWeight`/`FontStyle`/`OffsetX`/`OffsetY` | - | 单位样式 |
| `tooltipMarkerSize` | number | 标记大小 |
| `tooltipAxisPointerWidth`/`Color` | - | 指示线样式 |

### 全局配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `refresh` | boolean | 是否启用刷新 |
| `seriesEmphasisScale`/`seriesEmphasisScaleSize` | - | 鼠标悬停强调效果（可选） |

---

## 常用配置示例

### 5 个分类的标准饼图（与 data 对齐的写法）

```json
{
  "data": [
    { "seriesName": "已闭环", "value": 486 },
    { "seriesName": "处置中", "value": 213 },
    { "seriesName": "待处置", "value": 132 },
    { "seriesName": "已超期", "value": 47 },
    { "seriesName": "已挂起", "value": 26 }
  ],
  "option": {
    "dataSeriesName": ["已闭环", "处置中", "待处置", "已超期", "已挂起"],
    "seriesName": ["已闭环", "处置中", "待处置", "已超期", "已挂起"],
    "seriesTabsName": [
      { "name": "已闭环", "value": "已闭环" },
      { "name": "处置中", "value": "处置中" },
      { "name": "待处置", "value": "待处置" },
      { "name": "已超期", "value": "已超期" },
      { "name": "已挂起", "value": "已挂起" }
    ],
    "seriesColor": ["#31e0f2", "#2dc0ee", "#3e43f4", "#ff9500", "#ff4d4f"]
  }
}
```

### 从大到小排序

```json
{
  "seriesOrder": "descending",
  "seriesLabelShow": true
}
```

### 简洁模式（内部标签、隐藏图例）

```json
{
  "seriesLabelShow": true,
  "seriesLabelOrient": "radial",
  "legendShow": false
}
```

### 环形样式

```json
{
  "pieRadiusInner": 40,
  "pieRadiusOuter": 70
}
```
