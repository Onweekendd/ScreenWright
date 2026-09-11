# 仪表盘 (echartgauge) 配置说明

## dataChart 数据格式

```typescript
interface GaugeDataItem {
  value: number;       // 当前值
}

type dataChart = GaugeDataItem[];
```

**示例**：
```json
[
  { "value": 33 }
]
```

---

## option 完整字段参考

### 基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `refresh` | boolean | true | 是否启用刷新 |

### 刻度轴标签配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `axisLabelShow` | boolean | true | 是否显示刻度标签 |
| `min` | number | 0 | 最小值 |
| `max` | number | 100 | 最大值 |
| `axisLabelDistance` | number | -30 | 刻度标签与轴线距离 |
| `axisLabelFontFamily` | string | "siayuan-normal" | 刻度标签字体 |
| `axisLabelFontSize` | number | 18 | 刻度标签字体大小 |
| `axisLabelColor` | string | "rgba(209,209,209,1)" | 刻度标签颜色 |
| `axisLabelFontStyle` | string | "normal" | 刻度标签字体样式 |
| `axisLabelFontWeight` | string | "normal" | 刻度标签字体粗细 |
| `splitNumber` | number | 5 | 分割段数 |
| `axisLabelToFixed` | number | 0 | 刻度标签小数位数 |

### 分割线配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `splitLineShow` | boolean | true | 是否显示分割线 |
| `splitLineColor` | string | "rgba(255,255,255,1)" | 分割线颜色 |
| `splitLineWidth` | number | 1 | 分割线宽度 |
| `splitLineLength` | number | 16 | 分割线长度 |
| `splitLineDistance` | number | -18 | 分割线与轴线距离 |

### 指针配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pointerShow` | boolean | true | 是否显示指针 |
| `pointerColor` | string | "rgba(255,255,255,1)" | 指针颜色 |
| `pointerlength` | number | 120 | 指针长度 |

### 圆心锚点配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `anchorShow` | boolean | true | 是否显示圆心锚点 |
| `anchorColor` | string | "rgba(255,255,255,1)" | 锚点颜色 |
| `anchorSize` | number | 30 | 锚点大小 |

### 动画配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `animationShow` | boolean | true | 是否启用动画 |
| `animationDuration` | number | 1 | 动画时长（秒） |

### 详情标签配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesDetailShow` | boolean | true | 是否显示详情标签 |
| `seriesDetailPercentValue` | number | 0 | 详情百分比小数位数 |
| `seriesDetailColor` | string | "rgba(255,255,255,1)" | 详情标签颜色 |
| `seriesDetailType` | string | "percent" | 详情显示类型：percent/value |
| `seriesDetailFontFamily` | string | "siayuan-normal" | 详情标签字体 |
| `seriesDetailFontSize` | number | 32 | 详情标签字体大小 |
| `seriesDetailFontWeight` | string | "normal" | 详情标签字体粗细 |
| `seriesDetailFontStyle` | string | "normal" | 详情标签字体样式 |
| `seriesDetailOffsetX` | number | 0 | 详情标签X轴偏移 |
| `seriesDetailOffsetY` | number | 40 | 详情标签Y轴偏移 |

### 详情前缀配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesDetailPrefixShow` | boolean | false | 是否显示详情前缀 |
| `seriesDetailPrefix` | string | "占比" | 详情前缀文本 |
| `seriesDetailPrefixColor` | string | "rgba(255,255,255,1)" | 详情前缀颜色 |
| `seriesDetailPrefixType` | string | "value" | 详情前缀类型 |
| `seriesDetailPrefixFontFamily` | string | "siayuan-normal" | 详情前缀字体 |
| `seriesDetailPrefixFontSize` | number | 18 | 详情前缀字体大小 |
| `seriesDetailPrefixFontWeight` | string | "normal" | 详情前缀字体粗细 |
| `seriesDetailPrefixFontStyle` | string | "normal" | 详情前缀字体样式 |
| `seriesDetailPrefixPadding` | number | 10 | 详情前缀内边距 |
| `seriesDetailPrefixColorFollow` | boolean | false | 详情前缀颜色是否跟随主色 |

### 详情单位配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesDetailUnitShow` | boolean | true | 是否显示详情单位 |
| `seriesDetailUnit` | string | "%" | 详情单位文本 |
| `seriesDetailUnitColor` | string | "rgba(255,255,255,1)" | 详情单位颜色 |
| `seriesDetailUnitType` | string | "value" | 详情单位类型 |
| `seriesDetailUnitFontFamily` | string | "siayuan-normal" | 详情单位字体 |
| `seriesDetailUnitFontSize` | number | 16 | 详情单位字体大小 |
| `seriesDetailUnitFontWeight` | string | "normal" | 详情单位字体粗细 |
| `seriesDetailUnitFontStyle` | string | "normal" | 详情单位字体样式 |
| `seriesDetailUnitPadding` | number | 10 | 详情单位内边距 |
| `seriesDetailUnitColorFollow` | boolean | false | 详情单位颜色是否跟随主色 |

### 轴线配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `axisLineWidth` | number | 10 | 轴线宽度 |
| `axisLineTabsName` | string[] | ["区间1","区间2","区间3","区间4"] | 轴线区间标签页名称 |
| `axisLineScope` | number[] | [0.2,0.4,0.6,1] | 轴线区间范围 |
| `axisLineColor` | string[] | ["rgba(136,84,233,1)",...] | 轴线区间颜色 |

### 系列颜色与样式

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesColor` | object | (渐变) | 系列颜色配置，支持线性渐变 |
| `seriesColor.type` | string | "linear-gradient" | 渐变类型 |
| `seriesColor.angle` | string | "90" | 渐变角度 |
| `seriesColor.colors` | array | [{color,per}] | 渐变颜色列表 |
| `seriesOpacity` | number | 100 | 系列不透明度（0-100） |
| `barBackgroundColor` | string | "rgba(180,180,180,0.2)" | 柱背景色 |
| `barBorderRadius` | number | 20 | 柱圆角 |

### 头像图片配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `headImgShow` | boolean | false | 是否显示头像图片 |
| `headImg` | string | "" | 头像图片地址 |
| `headImgWidth` | number | 20 | 头像图片宽度 |
| `headImgHeight` | number | 20 | 头像图片高度 |
| `headImgOffsetX` | number | 0 | 头像图片X轴偏移 |
| `headImgOffsetY` | number | 0 | 头像图片Y轴偏移 |

### X轴配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `xAxisInverse` | boolean | false | X轴是否反向 |
| `xAxisShow` | boolean | true | 是否显示X轴 |
| `xAxisLabelShow` | boolean | true | 是否显示X轴标签 |
| `xAxisMargin` | number | 8 | X轴轴线与标签间距 |
| `xAxisNameShow` | boolean | false | 是否显示X轴名称 |
| `xAxisName` | string | "单位" | X轴名称文本 |
| `xAxisNameFontFamily` | string | "siayuan-normal" | X轴名称字体 |
| `xAxisNameFontSize` | number | 14 | X轴名称字体大小 |
| `xAxisNameColor` | string | "rgba(209,209,209,1)" | X轴名称颜色 |
| `xAxisNameFontStyle` | string | "normal" | X轴名称字体样式 |
| `xAxisNameFontWeight` | string | "normal" | X轴名称字体粗细 |
| `xAxisSplitNumber` | number | 5 | X轴分割段数 |
| `xAxisNamePaddingTop` | number | 0 | X轴名称顶部内边距 |
| `xAxisNamePaddingBottom` | number | 0 | X轴名称底部内边距 |
| `xAxisNamePaddingLeft` | number | 0 | X轴名称左侧内边距 |
| `xAxisNamePaddingRight` | number | 40 | X轴名称右侧内边距 |
| `xAxisSplitLineShow` | boolean | true | 是否显示X轴分割线 |
| `xAxisSplitLineWidth` | number | 1 | X轴分割线宽度 |
| `xAxisSplitLineColor` | string | "#383d47" | X轴分割线颜色 |

---

## 常用配置示例

### 默认仪表盘（百分比显示）

```json
{
  "refresh": true,
  "min": 0,
  "max": 100,
  "splitNumber": 5,
  "axisLabelShow": true,
  "pointerShow": true,
  "pointerColor": "rgba(255,255,255,1)",
  "pointerlength": 120,
  "anchorShow": true,
  "seriesDetailShow": true,
  "seriesDetailType": "percent",
  "seriesDetailFontSize": 32,
  "axisLineColor": [
    "rgba(136, 84, 233, 1)",
    "rgba(133, 174, 252, 1)",
    "rgba(140, 227, 255, 1)",
    "rgba(239, 151, 19, 1)"
  ],
  "axisLineScope": [0.2, 0.4, 0.6, 1]
}
```

### 自定义刻度范围 0-200

```json
{
  "min": 0,
  "max": 200,
  "splitNumber": 8,
  "axisLabelFontSize": 14,
  "seriesDetailType": "value",
  "seriesDetailUnit": "km/h",
  "seriesDetailUnitShow": true
}
```

### 隐藏指针和刻度标签

```json
{
  "pointerShow": false,
  "axisLabelShow": false,
  "splitLineShow": false,
  "anchorShow": false,
  "seriesDetailShow": true,
  "seriesDetailFontSize": 48
}
```

### 显示前缀和自定义单位

```json
{
  "seriesDetailPrefixShow": true,
  "seriesDetailPrefix": "完成率",
  "seriesDetailPrefixFontSize": 16,
  "seriesDetailUnitShow": true,
  "seriesDetailUnit": "%",
  "seriesDetailUnitFontSize": 14,
  "seriesDetailOffsetY": 50
}
```
