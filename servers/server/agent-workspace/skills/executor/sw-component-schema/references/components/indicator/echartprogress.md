# 进度条 (echartprogress) 配置说明

## dataChart 数据格式

```typescript
interface ProgressDataItem {
  value: number;  // 当前进度值
  max: number;    // 最大值
  min: number;    // 最小值
}

type dataChart = ProgressDataItem[];
```

**示例**：
```json
[
  { "value": 75, "max": 100, "min": 0 }
]
```

---

## option 完整字段参考

### 基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `refresh` | boolean | true | 是否启用刷新 |

### 网格配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gridTop` | number | 50 | 网格上边距 |
| `gridBottom` | number | 50 | 网格下边距 |
| `gridLeft` | number | 30 | 网格左边距 |
| `gridRight` | number | 30 | 网格右边距 |

### 系列颜色配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesColor` | object | 见下方 | 渐变颜色配置 |
| `seriesColor.type` | string | "linear-gradient" | 渐变类型 |
| `seriesColor.angle` | string | "90" | 渐变角度 |
| `seriesColor.colors` | array | [{color:"rgba(0,127,247,1)",per:0},{color:"rgba(0,183,226,1)",per:100}] | 渐变色标列表 |
| `seriesOpacity` | number | 100 | 进度条不透明度 |

### 柱条配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `barBackgroundColor` | string | "rgba(180,180,180,0.2)" | 进度条背景颜色 |
| `barBorderRadius` | number | 12 | 进度条圆角 |

### 动画配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `animationShow` | boolean | true | 是否启用动画 |
| `animationDuration` | number | 1 | 动画时长（秒） |

### 系列标签配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesLabelShow` | boolean | true | 是否显示系列标签 |
| `seriesLabelPercentValue` | number | 0 | 百分比小数位数 |
| `seriesBarWidth` | number | 24 | 进度条宽度 |
| `seriesLabelColor` | string | "rgba(0,183,226,1)" | 标签颜色 |
| `seriesLabelType` | string | "percent" | 标签类型 |
| `seriesLabelFontFamily` | string | "siayuan-normal" | 标签字体 |
| `seriesLabelFontSize` | number | 16 | 标签字号 |
| `seriesLabelFontWeight` | string | "normal" | 标签粗细 |
| `seriesLabelFontStyle` | string | "normal" | 标签样式 |
| `seriesLabelOffsetX` | number | 50 | 标签X偏移 |
| `seriesLabelOffsetY` | number | -40 | 标签Y偏移 |

### 标签前缀配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesLabelPrefixShow` | boolean | false | 是否显示前缀 |
| `seriesLabelPrefix` | string | "占比" | 前缀文本 |
| `seriesLabelPrefixColor` | string | "rgba(255,255,255,1)" | 前缀颜色 |
| `seriesLabelPrefixType` | string | "value" | 前缀类型 |
| `seriesLabelPrefixFontFamily` | string | "siayuan-normal" | 前缀字体 |
| `seriesLabelPrefixFontSize` | number | 18 | 前缀字号 |
| `seriesLabelPrefixFontWeight` | string | "normal" | 前缀粗细 |
| `seriesLabelPrefixFontStyle` | string | "normal" | 前缀样式 |
| `seriesLabelPrefixPadding` | number | 10 | 前缀内边距 |
| `seriesLabelPrefixColorFollow` | boolean | false | 前缀颜色是否跟随主色 |

### 标签单位配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesLabelUnitShow` | boolean | true | 是否显示单位 |
| `seriesLabelUnit` | string | "%" | 单位文本 |
| `seriesLabelUnitColor` | string | "rgba(255,255,255,1)" | 单位颜色 |
| `seriesLabelUnitType` | string | "value" | 单位类型 |
| `seriesLabelUnitFontFamily` | string | "siayuan-normal" | 单位字体 |
| `seriesLabelUnitFontSize` | number | 12 | 单位字号 |
| `seriesLabelUnitFontWeight` | string | "normal" | 单位粗细 |
| `seriesLabelUnitFontStyle` | string | "normal" | 单位样式 |
| `seriesLabelUnitPadding` | number | 10 | 单位内边距 |
| `seriesLabelUnitColorFollow` | boolean | false | 单位颜色是否跟随主色 |

### 头部图片配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `headImgShow` | boolean | false | 是否显示头部图片 |
| `headImg` | string | "" | 头部图片地址 |
| `headImgWidth` | number | 20 | 头部图片宽度 |
| `headImgHeight` | number | 20 | 头部图片高度 |
| `headImgOffsetX` | number | 0 | 头部图片X偏移 |
| `headImgOffsetY` | number | 0 | 头部图片Y偏移 |

### X轴配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `xAxisInverse` | boolean | false | X轴是否反向 |
| `xAxisShow` | boolean | true | 是否显示X轴 |
| `xAxisLabelShow` | boolean | true | 是否显示X轴标签 |
| `xAxisMin` | string | "0" | X轴最小值 |
| `xAxisMax` | string | "" | X轴最大值 |
| `xAxisMargin` | number | 8 | X轴标签边距 |
| `xAxisFontFamily` | string | "siayuan-normal" | X轴标签字体 |
| `xAxisFontSize` | number | 12 | X轴标签字号 |
| `xAxisColor` | string | "rgba(209, 209, 209, 1)" | X轴标签颜色 |
| `xAxisFontStyle` | string | "normal" | X轴标签样式 |
| `xAxisFontWeight` | string | "normal" | X轴标签粗细 |

### X轴名称配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `xAxisNameShow` | boolean | false | 是否显示X轴名称 |
| `xAxisName` | string | "单位" | X轴名称文本 |
| `xAxisNameFontFamily` | string | "siayuan-normal" | X轴名称字体 |
| `xAxisNameFontSize` | number | 14 | X轴名称字号 |
| `xAxisNameColor` | string | "rgba(209, 209, 209, 1)" | X轴名称颜色 |
| `xAxisNameFontStyle` | string | "normal" | X轴名称样式 |
| `xAxisNameFontWeight` | string | "normal" | X轴名称粗细 |
| `xAxisSplitNumber` | number | 5 | X轴分割段数 |
| `xAxisNamePaddingTop` | number | 0 | X轴名称顶部内边距 |
| `xAxisNamePaddingBottom` | number | 0 | X轴名称底部内边距 |
| `xAxisNamePaddingLeft` | number | 0 | X轴名称左侧内边距 |
| `xAxisNamePaddingRight` | number | 40 | X轴名称右侧内边距 |

### X轴分割线配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `xAxisSplitLineShow` | boolean | true | 是否显示X轴分割线 |
| `xAxisSplitLineWidth` | number | 1 | X轴分割线宽度 |
| `xAxisSplitLineColor` | string | "#383d47" | X轴分割线颜色 |

---

## 常用配置示例

### 基础进度条（带百分比标签）

```json
{
  "seriesLabelShow": true,
  "seriesLabelType": "percent",
  "seriesLabelPercentValue": 0,
  "barBorderRadius": 12,
  "seriesColor": {
    "type": "linear-gradient",
    "angle": "90",
    "colors": [
      { "color": "rgba(0,127,247,1)", "per": 0 },
      { "color": "rgba(0,183,226,1)", "per": 100 }
    ]
  }
}
```

### 带前缀和单位的进度条

```json
{
  "seriesLabelPrefixShow": true,
  "seriesLabelPrefix": "完成率",
  "seriesLabelUnitShow": true,
  "seriesLabelUnit": "%",
  "seriesLabelShow": true,
  "seriesLabelType": "percent"
}
```

### 带X轴刻度和头部图片

```json
{
  "xAxisShow": true,
  "xAxisLabelShow": true,
  "xAxisSplitNumber": 5,
  "headImgShow": true,
  "headImg": "/assets/indicator-icon.png",
  "headImgWidth": 24,
  "headImgHeight": 24
}
```
