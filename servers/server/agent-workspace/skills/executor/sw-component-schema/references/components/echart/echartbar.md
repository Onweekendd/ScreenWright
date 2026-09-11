# echartbar (柱状图) 配置说明

## dataChart 数据格式

```typescript
interface BarDataItem {
  seriesName: string;  // 系列标识（同名数据为一个系列）
  name: string;        // X轴分类名称
  value: number;       // 柱子高度值
  [key: string]: any;  // 其他业务字段
}

type dataChart = BarDataItem[];
```

**示例**：
```json
[
  { "seriesName": "2024年", "name": "1月", "value": 2024 },
  { "seriesName": "2024年", "name": "2月", "value": 2378 }
]
```

---

## option 完整字段参考

总计 **187 个配置字段**，分组如下：

### 数据配置 (5字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `refresh` | boolean | true | 数据更新时重绘图表 |
| `stack` | boolean | false | 是否堆叠柱子 |
| `dataSeriesName` | string[] | - | 数据中的系列名列表 |
| `seriesName` | string[] | - | 图例显示的系列名 |
| `seriesTabsName` | {name,value}[] | - | 系列切换标签 |

### 柱子样式 (4字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `barGap` | number | 70 | 柱子间距(%) |
| `barCategoryGap` | number | 60 | 分类间距(%) |
| `barBorderRadius` | string | default | 柱子圆角:"default"/"radius" |
| `barBackgroundColor` | string | rgba(255,255,255,0) | 柱子背景颜色 |

### 颜色与不透明度 (8字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesColor` | GradientColor[] | 系列颜色（支持渐变） |
| `seriesColorpicker` | string[] | 系列颜色预览值 |
| `seriesOpacity` | number[] | 系列不透明度 |
| `extremeShow` | boolean[] | 是否显示极值标记 |
| `extremeType` | string[] | 极值类型:"max"/"min" |
| `extremeColor` | GradientColor[] | 极值颜色 |
| `extremeColorpicker` | string[] | 极值颜色预览值 |
| `extremeOpacity` | number[] | 极值不透明度 |

### 网格和边距 (4字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gridLeft` | number | 45 | 左边距(px) |
| `gridTop` | number | 30 | 上边距(px) |
| `gridRight` | number | 25 | 右边距(px) |
| `gridBottom` | number | 25 | 下边距(px) |

### X轴配置 (16字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `xAxisShow` | boolean | true | 是否显示X轴 |
| `xAxisType` | string | category | 轴类型（固定类别轴） |
| `xAxisInverse` | boolean | false | 反向显示 |
| `xAxisLabelShow` | boolean | true | 是否显示标签 |
| `xAxisLabelLimit` | boolean | false | 是否限制标签数 |
| `xAxisLabelLimitNum` | number | 1 | 显示的标签数 |
| `xAxisInterval` | number | 0 | 标签间隔 |
| `xAxisRotate` | number | 0 | 标签旋转角度 |
| `xAxisMargin` | number | 8 | 标签边距 |
| `xAxisFontSize` | number | 12 | 标签字号 |
| `xAxisFontFamily` | string | siayuan-normal | 字体 |
| `xAxisFontStyle` | string | normal | 字体风格 |
| `xAxisFontWeight` | string | normal | 字体粗细 |
| `xAxisColor` | string | rgba(209,209,209,1) | 标签颜色 |
| `xNameFontSize` | number | 16 | 轴标题字号 |
| `xAxisTickShow` | boolean | true | 显示刻度 |

### Y轴配置 (18字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `yAxisShow` | boolean | true | 是否显示Y轴 |
| `yAxisInverse` | boolean | false | 反向显示 |
| `yAxisMin` | string | "0" | 最小值 |
| `yAxisMax` | string | "" | 最大值(空=自动) |
| `yAxisLabelShow` | boolean | true | 是否显示标签 |
| `yAxisMargin` | number | 8 | 标签边距 |
| `yAxisFontSize` | number | 12 | 标签字号 |
| `yAxisFontFamily` | string | siayuan-normal | 字体 |
| `yAxisFontStyle` | string | normal | 字体风格 |
| `yAxisFontWeight` | string | normal | 字体粗细 |
| `yAxisColor` | string | rgba(209,209,209,1) | 标签颜色 |
| `yAxisName` | string | 单位 | 轴标题 |
| `yAxisNameShow` | boolean | true | 显示轴标题 |
| `yAxisNameFontSize` | number | 12 | 标题字号 |
| `yAxisNameColor` | string | rgba(209,209,209,1) | 标题颜色 |
| `yAxisNameFontFamily` | string | siayuan-normal | 标题字体 |
| `yAxisNameFontStyle` | string | normal | 标题风格 |
| `yAxisNameFontWeight` | string | normal | 标题粗细 |

### 轴线配置 (12字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `xAxisLineShow` | boolean | 显示X轴线 |
| `xAxisLineColor` | string | X轴线颜色 |
| `xAxisLineWidth` | number | X轴线宽 |
| `xAxisLineOpacity` | number | X轴线不透明度 |
| `yAxisLineShow` | boolean | 显示Y轴线 |
| `yAxisLineColor` | string | Y轴线颜色 |
| `yAxisLineWidth` | number | Y轴线宽 |
| `yAxisLineOpacity` | number | Y轴线不透明度 |
| `xAxisTickShow` | boolean | 显示X轴刻度 |
| `xAxisTickColor` | string | 刻度颜色 |
| `yAxisTickShow` | boolean | 显示Y轴刻度 |
| `yAxisTickColor` | string | 刻度颜色 |

### 分割线配置 (10字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `xAxisSplitLineShow` | boolean | 显示X分割线 |
| `xAxisSplitLineType` | string | 线类型:"solid"/"dashed" |
| `xAxisSplitLineColor` | string | 分割线颜色 |
| `xAxisSplitLineWidth` | number | 分割线宽 |
| `xAxisSplitLineInterval` | number | 分割线间隔 |
| `yAxisSplitLineShow` | boolean | 显示Y分割线 |
| `yAxisSplitLineType` | string | 线类型:"solid"/"dashed" |
| `yAxisSplitLineColor` | string | 分割线颜色 |
| `yAxisSplitLineWidth` | number | 分割线宽 |

### 图例配置 (13字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `legendShow` | boolean | true | 是否显示 |
| `legendOrient` | string | horizontal | 方向:"horizontal"/"vertical" |
| `legendSelectedMode` | boolean | true | 可交互选择 |
| `legendGrid` | {top,left} | - | 位置配置 |
| `legendOffsetX` | number | 0 | X偏移 |
| `legendOffsetY` | number | 0 | Y偏移 |
| `legendFontSize` | number | 12 | 字号 |
| `legendFontFamily` | string | siayuan-normal | 字体 |
| `legendFontStyle` | string | normal | 字体风格 |
| `legendFontWeight` | string | normal | 字体粗细 |
| `legendColor` | string | rgba(255,255,255,1) | 文字颜色 |
| `legendTextLeftPadding` | number | 5 | 文字左边距 |

### 数值标签配置 (8字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesLabelShow` | boolean | false | 显示柱子上的数值 |
| `seriesLabelColor` | string | rgba(255,255,255,1) | 标签颜色 |
| `seriesLabelFontSize` | number | 14 | 字号 |
| `seriesLabelFontFamily` | string | siayuan-normal | 字体 |
| `seriesLabelFontStyle` | string | normal | 字体风格 |
| `seriesLabelFontWeight` | string | normal | 字体粗细 |
| `seriesLabelOffsetX` | number | 0 | X偏移 |
| `seriesLabelOffsetY` | number | 0 | Y偏移 |

### 提示框配置 (19字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tooltipTriggerOn` | boolean | true | 是否启用 |
| `tooltipLoop` | boolean | false | 是否自动循环显示 |
| `tooltipLoopInterval` | number | 3 | 循环间隔(s) |
| `tooltipOffsetX` | number | 0 | X偏移 |
| `tooltipOffsetY` | number | 0 | Y偏移 |
| `tooltipWidth` | number | 200 | 宽度 |
| `tooltipHeight` | number | 100 | 高度 |
| `tooltipBackground` | string | "" | 背景 |
| `tooltipAlign` | string | left | 对齐方式 |
| `tooltipPaddingTop` | number | 0 | 内边距T |
| `tooltipPaddingBottom` | number | 0 | 内边距B |
| `tooltipPaddingLeft` | number | 0 | 内边距L |
| `tooltipPaddingRight` | number | 0 | 内边距R |
| `tooltipMarkerSize` | number | 10 | 标记大小 |
| `tooltipAxisPointerWidth` | number | 1 | 指针宽 |
| `tooltipAxisPointerColor` | string | rgba(255,255,255,1) | 指针颜色 |
| `tooltipUnit` | string[] | ["",""] | 数值单位 |

### 提示框文本配置 (12字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `tooltipNameFontSize` | number | 标题字号 |
| `tooltipNameFontFamily` | string | 标题字体 |
| `tooltipNameFontStyle` | string | 标题风格 |
| `tooltipNameFontWeight` | string | 标题粗细 |
| `tooltipNameColor` | string | 标题颜色 |
| `tooltipValueFontSize` | number | 数值字号 |
| `tooltipValueFontFamily` | string | 数值字体 |
| `tooltipValueFontStyle` | string | 数值风格 |
| `tooltipValueFontWeight` | string | 数值粗细 |
| `tooltipValueColor` | string | 数值颜色 |
| `tooltipUnitFontSize` | number | 单位字号 |
| `tooltipUnitColor` | string | 单位颜色 |

### Mark Line 配置 (27字段)

平均线、目标线等参考线，每条线可独立配置。

| 字段 | 类型 | 说明 |
|------|------|------|
| `markLineShow` | boolean[] | 是否显示 |
| `markLineDataType` | string[] | 类型:"average"/"max"/"min" |
| `markLineData` | number[] | 线的值 |
| `markLineLineColor` | string[] | 线颜色 |
| `markLineLineWidth` | number[] | 线宽 |
| `markLineLineType` | string[] | 线类型:"solid"/"dashed" |
| `markLineSymbolStart` | string[] | 起始符号:"circle"/"arrow" |
| `markLineSymbolStartImage` | string[] | 起始自定义图片 |
| `markLineSymbolEnd` | string[] | 结束符号:"circle"/"arrow" |
| `markLineSymbolEndImage` | string[] | 结束自定义图片 |
| `markLineSymbolWidth` | number[] | 符号宽 |
| `markLineSymbolHeight` | number[] | 符号高 |
| `markLineLabelShow` | boolean[] | 显示标签 |
| `markLineLabelPosition` | string[] | 标签位置 |
| `markLineLabelDistance` | number[] | 标签距离 |
| `markLineLabelCustom` | string[] | 自定义标签文本 |
| `markLineLabelFontSize` | number[] | 标签字号 |
| `markLineLabelFontFamily` | string[] | 标签字体 |
| `markLineLabelFontStyle` | string[] | 标签风格 |
| `markLineLabelFontWeight` | string[] | 标签粗细 |
| `markLineLabelColor` | string[] | 标签颜色 |

### 数据展示 (11字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dataLoop` | boolean | false | 启用数据循环滚动 |
| `dataLoopInterval` | number | 5 | 循环间隔(s) |
| `dataLoopDisplayRows` | number | 4 | 每次显示行数 |
| `dataLoopRollNum` | number | 1 | 每次滚动行数 |
| `dataZoomShow` | boolean | false | 显示缩放条 |
| `dataZoomBottom` | number | 10 | 缩放条距离底部 |
| `moveHandleSize` | number | 10 | 拖动手柄大小 |
| `moveHandleColor` | string | #d2dbee | 手柄颜色 |
| `moveHandleEmphasisColor` | string | #d2dbee | 手柄高亮色 |
| `dataUnitName` | string[] | - | 系列单位名 |
| `unitTabsName` | {name,value}[] | - | 单位切换标签 |

---

## 常用配置示例

### 堆叠柱状图
```json
{
  "stack": true,
  "barCategoryGap": 50
}
```

### 多系列对比
```json
{
  "barGap": 30,
  "seriesColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#3de3fb"}]}
  ]
}
```

### 简洁模式
```json
{
  "legendShow": true,
  "tooltipTriggerOn": true,
  "seriesLabelShow": false
}
```
