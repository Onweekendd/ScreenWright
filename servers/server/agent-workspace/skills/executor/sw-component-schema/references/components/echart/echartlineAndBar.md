# echartlineAndBar (折线柱形图) 配置说明

## dataChart 数据格式

```typescript
interface LineAndBarDataItem {
  seriesName: string;  // 系列标识
  name: string;        // X轴分类名称
  value: number;       // 数值
  [key: string]: any;  // 其他业务字段
}

type dataChart = LineAndBarDataItem[];
```

**示例**：
```json
[
  { "seriesName": "销售额", "name": "1月", "value": 2024 },
  { "seriesName": "销售额", "name": "2月", "value": 2378 },
  { "seriesName": "增长率", "name": "1月", "value": 15 },
  { "seriesName": "增长率", "name": "2月", "value": 25 }
]
```

---

## option 完整字段参考

基于配置文件：`echartlineAndBarGlobal.vue` / `echartlineAndBarSeries.vue`（引用 echartzebraBarAndLineSeries.vue） / `echartlineAndBarxAxis.vue` / `echartlineAndBarTooltip.vue`

### 系列配置 (30字段)

每个系列通过 seriesType 指定为 bar（柱状）或 line（折线）：

**通用字段**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `dataSeriesName` | string[] | 数据中的系列名列表 |
| `seriesTabsName` | {name,value}[] | 系列切换标签 |
| `seriesType` | string[] | 系列类型:"bar"/"line" |
| `yAxisIndex` | number[] | Y轴索引:0=左轴,1=右轴 |

**折线系列字段**（seriesType="line"时）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLineColor` | string[] | 线条颜色 |
| `seriesLineOpacity` | number[] | 线条不透明度 |
| `seriesLineWidth` | number[] | 线条宽度(px) |
| `seriesSmooth` | boolean[] | 是否平滑曲线 |
| `seriesSmoothShow` | boolean[] | 平滑显示开关 |
| `seriesSymbolShow` | boolean[] | 是否显示数据点 |
| `seriesSymbol` | string[] | 数据点形状 |
| `seriesSymbolImage` | string[] | 数据点自定义图片 |
| `seriesSymbolWidth` | number[] | 数据点宽度 |
| `seriesSymbolHeight` | number[] | 数据点高度 |
| `seriesAreaOpacity` | number[] | 面积不透明度 |
| `seriesItemColor` | string[] | 数据点颜色 |

**柱状系列字段**（seriesType="bar"时）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesWidth` | number[] | 柱子宽度(px) |
| `seriesBarColor` | string[] | 柱子颜色 |
| `seriesBarOpacity` | number[] | 柱子不透明度 |
| `intervalColor` | string[] | 柱子间隔颜色 |
| `seriesItemBorderWidth` | number[] | 边框宽度 |
| `seriesItemBorderColor` | string[] | 边框颜色 |

**数值标签**（通用）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLabelShow` | boolean[] | 是否显示数值标签 |
| `seriesLabelColor` | string[] | 标签颜色 |
| `seriesLabelFontFamily` | string[] | 标签字体 |
| `seriesLabelFontSize` | number[] | 标签字号 |
| `seriesLabelFontWeight` | string[] | 标签粗细 |
| `seriesLabelFontStyle` | string[] | 标签风格 |
| `seriesLabelOffsetX` | number[] | 标签X偏移 |
| `seriesLabelOffsetY` | number[] | 标签Y偏移 |

### 全局配置

通过 Global 配置面板，包含：边距（gridLeft/Top/Right/Bottom）、留白、图例、轮播动画等。

### 坐标轴配置

支持双 Y 轴（左轴+右轴），通过 xAxisConfigTab 配置。

### 提示框配置

通过 Tooltip 配置面板，包含 tooltipTriggerOn、ItemZebra2Tooltip、ItemZebra2Pointer 等。

---

## 常用配置示例

### 柱状+折线混合

```json
{
  "seriesType": ["bar", "line"],
  "seriesBarColor": [{"colors": [{"color": "#3e43f4"}]}],
  "seriesLineColor": [{"colors": [{"color": "#ff9500"}]}],
  "yAxisIndex": [0, 1]
}
```

### 双Y轴对比（左轴柱状，右轴折线）

```json
{
  "seriesType": ["bar", "line"],
  "seriesWidth": [30],
  "seriesLineWidth": [2],
  "yAxisIndex": [0, 1],
  "legendShow": true
}
```

### 平滑折线+柱状

```json
{
  "seriesType": ["bar", "line"],
  "seriesSmooth": [false, true],
  "seriesAreaOpacity": [0, 0.3]
}
```
