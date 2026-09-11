# echartradar (雷达图) 配置说明

## dataChart 数据格式

```typescript
interface RadarDataItem {
  name: string;        // 指示器名称（维度名称）
  value: number;       // 该维度的数值
  [key: string]: any;  // 其他业务字段
}

type dataChart = RadarDataItem[];
```

**示例**：
```json
[
  { "name": "销售能力", "value": 85 },
  { "name": "服务态度", "value": 90 },
  { "name": "专业知识", "value": 78 },
  { "name": "响应速度", "value": 92 },
  { "name": "客户满意度", "value": 88 }
]
```

---

## option 完整字段参考

基于配置文件：`echartradarGlobal.vue` / `echartradarSeries.vue` / `echartradarxAxis.vue`

雷达图使用 `defaultOption.slice(0, 3)` 配置选项：**全局、坐标轴（雷达轴）、系列**

### 系列配置

通过 `echartradarSeries.vue` 配置：

| 字段 | 类型 | 说明 |
|------|------|------|
| `dataSeriesName` | string[] | 数据字段名映射 |
| `seriesTabsName` | {name,value}[] | 系列切换标签 |
| `seriesLineColor` | string[] | 折线颜色 |
| `seriesLineWidth` | number[] | 折线粗细 |
| `seriesLineShadowColor` | string[] | 折线阴影颜色 |
| `seriesLineShadowOffsetX` | number[] | 阴影X偏移 |
| `seriesLineShadowOffsetY` | number[] | 阴影Y偏移 |
| `seriesLineShadowBlur` | number[] | 阴影模糊度 |
| `seriesSymbol` | string[] | 数据标记图形（circle/rect/triangle等） |
| `seriesSymbolImage` | string[] | 自定义标记图片URL |
| `seriesSymbolWidth` | number[] | 标记宽度 |
| `seriesSymbolHeight` | number[] | 标记高度 |
| `seriesItemColor` | string[] | 标记颜色 |
| `seriesItemBorderWidth` | number[] | 标记边框宽度 |
| `seriesItemBorderColor` | string[] | 标记边框颜色 |
| `seriesAreaColor` | string[] | 填充区域颜色 |
| `seriesLabelShow` | boolean | 数值标签显示 |

**数值标签配置**（通过 ItemPieRoseNumber）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLabelFontFamily` | string | 标签字体的名称 |
| `seriesLabelFontStyle` | string | 标签字体样式 |
| `seriesLabelFontWeight` | string | 标签字体粗细 |
| `seriesLabelFontSize` | number | 标签字号 |
| `seriesLabelColor` | string | 标签颜色 |

### 雷达轴配置

通过 `echartradarxAxis.vue` 配置（雷达图的径向轴）：

**基本配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `radarShape` | string | 绘制类型（polygon/circle） |
| `radarMin` | number | 数值范围最小值 |
| `radarMax` | number | 数值范围最大值 |

**轴线配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `radarLineShow` | boolean | 轴线显示 |
| `radarLineColor` | string | 轴线颜色 |
| `radarLineWidth` | number | 轴线粗细 |

**刻度配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `radarTickShow` | boolean | 刻度显示 |
| `radarTickColor` | string | 刻度颜色 |
| `radarTickWidth` | number | 刻度粗细 |
| `radarTickLength` | number | 刻度长度 |

**刻度标签配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `radarLabelShow` | boolean | 刻度标签显示 |
| `radarLabelMinShow` | boolean | 最小刻度显示 |
| `radarLabelMaxShow` | boolean | 最大刻度显示 |
| `radarLabelMargin` | number | 刻度标签间距 |
| `radarLabelFontFamily` | string | 刻度标签字体 |
| `radarLabelFontSize` | number | 刻度标签字号 |
| `radarLabelColor` | string | 刻度标签颜色 |
| `radarLabelFontStyle` | string | 刻度标签样式 |
| `radarLabelFontWeight` | string | 刻度标签加粗 |

**指示器名称配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `radarNameShow` | boolean | 指示器名称显示 |
| `radarNameGap` | number | 指示器名称间距 |
| `radarNameFontFamily` | string | 指示器名称字体 |
| `radarNameFontSize` | number | 指示器名称字号 |
| `radarNameColor` | string | 指示器名称颜色 |
| `radarNameFontStyle` | string | 指示器名称样式 |
| `radarNameFontWeight` | string | 指示器名称加粗 |

**分隔线配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `radarSplitLineShow` | boolean | 分隔线显示 |
| `radarSplitLineColor` | string | 分隔线颜色 |
| `radarSplitLineWidth` | number | 分隔线粗细 |

**分隔区域配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `radarSplitAreaTabsName` | string[] | 区域标签名 |
| `radarSplitAreaColor` | string[] | 区域颜色 |
| `radarSplitNumber` | number | 等分值 |

### 全局配置

通过 `configPieStyle` + `ItemConfigLegend` 配置：

**雷达图样式**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `radarCenterX` | number | 圆心X位置 |
| `radarCenterY` | number | 圆心Y位置 |
| `radarRadiusMax` | number | 外半径 |
| `radarRadiusMin` | number | 内半径 |

**图例配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `legendShow` | boolean | 图例显示 |
| `legendFontFamily` | string | 图例字体 |
| `legendFontStyle` | string | 图例样式 |
| `legendFontWeight` | string | 图例粗细 |
| `legendFontSize` | number | 图例字号 |
| `legendColor` | string | 图例颜色 |
| `legendItemWidth` | number | 图例图标宽度 |
| `legendItemHeight` | number | 图例图标高度 |
| `legendItemGap` | number | 图例间距 |
| `legendSelectedMode` | boolean | 图例点击交互 |

---

## 常用配置示例

### 标准雷达图

```json
{
  "radarShape": "polygon",
  "radarMin": 0,
  "radarMax": 100,
  "radarCenterX": "50%",
  "radarCenterY": "50%",
  "radarRadiusMax": "70%",
  "seriesLineColor": ["#3e43f4"],
  "seriesAreaColor": ["rgba(62, 67, 244, 0.3)"]
}
```

### 圆形雷达图

```json
{
  "radarShape": "circle",
  "radarSplitLineShow": true,
  "radarSplitLineColor": "#e0e0e0",
  "seriesLineColor": ["#ff9500"],
  "seriesSymbol": "circle"
}
```

### 多系列对比雷达图

```json
{
  "radarShape": "polygon",
  "seriesLineColor": ["#3e43f4", "#ff9500"],
  "seriesAreaColor": ["rgba(62, 67, 244, 0.3)", "rgba(255, 149, 0, 0.3)"],
  "legendShow": true,
  "seriesLabelShow": true
}
```
