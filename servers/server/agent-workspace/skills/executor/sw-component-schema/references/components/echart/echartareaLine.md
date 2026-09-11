# echartareaLine (面积折线图) 配置说明

## dataChart 数据格式

```typescript
interface AreaLineDataItem {
  seriesName: string;  // 系列标识（同名数据为一个系列）
  name: string;        // X轴分类名称
  value: number;       // 数据值
  [key: string]: any;  // 其他业务字段
}

type dataChart = AreaLineDataItem[];
```

**示例**：
```json
[
  { "seriesName": "访问量", "name": "1月", "value": 2024 },
  { "seriesName": "访问量", "name": "2月", "value": 2378 },
  { "seriesName": "用户数", "name": "1月", "value": 1900 }
]
```

---

## option 完整字段参考

基于配置文件：`echartareaLineGlobal.vue` / `echartareaLineSeries.vue` / `echartareaLinexAxis.vue` / `echartsTooltip.vue`

### 系列配置 (31字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `dataSeriesName` | string[] | 数据中的系列名列表 |
| `seriesName` | string[] | 图例显示的系列名 |
| `seriesTabsName` | {name,value}[] | 系列切换标签 |
| `seriesColor` | GradientColor[] | 系列颜色（支持渐变） |
| `seriesColorpicker` | string[] | 系列颜色预览值 |
| `seriesOpacity` | number[] | 系列不透明度 |
| `seriesLineColor` | string[] | 线条颜色 |
| `seriesLineWidth` | number[] | 线条宽度(px) |
| `seriesLineOpacity` | number[] | 线条不透明度 |
| `seriesSmooth` | number[] | 曲线张力(0-1)：值越大曲线越直，值越小曲线越圆滑 |
| `seriesSmoothShow` | boolean[] | 是否启用曲线（开启后才生效 seriesSmooth） |
| `seriesSymbol` | string[] | 数据点形状 |
| `seriesSymbolShow` | boolean[] | 是否显示数据点 |
| `seriesSymbolWidth` | number[] | 数据点宽度 |
| `seriesSymbolHeight` | number[] | 数据点高度 |
| `seriesSymbolImage` | string[] | 数据点自定义图片 |
| `seriesItemColor` | string[] | 数据点颜色 |
| `seriesItemBorderColor` | string[] | 数据点边框颜色 |
| `seriesItemBorderWidth` | number[] | 数据点边框宽度 |
| `seriesLabelShow` | boolean[] | 是否显示数据标签 |
| `seriesLabelColor` | string[] | 标签颜色 |
| `seriesLabelFontSize` | number[] | 标签字号 |
| `seriesLabelFontFamily` | string[] | 标签字体 |
| `seriesLabelFontStyle` | string[] | 标签风格 |
| `seriesLabelFontWeight` | string[] | 标签粗细 |
| `seriesLabelOffsetX` | number[] | 标签X偏移 |
| `seriesLabelOffsetY` | number[] | 标签Y偏移 |
| `seriesAreaColor` | GradientColor[] | 面积填充颜色（关键字段）|
| `seriesAreaOpacity` | number[] | 面积不透明度（关键字段）|
| `seriesConnectNulls` | boolean[] | 是否连接null值 |
| `tooltipUnit` | string[] | 数值单位 |

### 全局配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距(px) |
| `gridTop` | number | 上边距(px) |
| `gridRight` | number | 右边距(px) |
| `gridBottom` | number | 下边距(px) |
| `boundaryGap` | boolean | 是否留白 |
| `legendShow` | boolean | 是否显示图例 |
| `legendOrient` | string | 图例方向:"horizontal"/"vertical" |
| `legendOffsetX` | number | 图例X偏移 |
| `legendOffsetY` | number | 图例Y偏移 |
| `dataLoopInterval` | number | 数据轮播间隔(s) |

### 坐标轴配置 (50+字段)

通过 xAxisConfigTab 配置，包括：

**X轴配置** (16字段)：
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `xAxisShow` | boolean | true | 是否显示X轴 |
| `xAxisType` | string | category | 轴类型 |
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

**Y轴配置** (18字段)：
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

**轴线配置** (12字段)：
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

**分割线配置** (10字段)：
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
| `yAxisSplitLineOpacity` | number | 分割线不透明度 |

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
| `tooltipTriggerMode` | string | item | 触发模式:"item"/"axis" |
| `tooltipBackgroundOpacity` | number | 0.8 | 背景透明度 |

---

## 常用配置示例

### 堆叠面积图（多系列累积）

```json
{
  "seriesAreaColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#3de3fb"}]}
  ],
  "seriesAreaOpacity": [0.6, 0.6],
  "seriesLineWidth": [2, 2],
  "seriesSmoothShow": [true, true],
  "seriesSmooth": [0.3, 0.3]
}
```

### 高透明度面积（强调趋势）

```json
{
  "seriesAreaColor": [{"colors": [{"color": "#ff9500"}]}],
  "seriesAreaOpacity": [0.2],
  "seriesLineWidth": [3],
  "seriesLineColor": ["#ff9500"]
}
```

### 平滑渐变面积

```json
{
  "seriesSmoothShow": [true],
  "seriesSmooth": [0.2],
  "seriesAreaColor": [{"colors": [{"color": "#3e43f4", "offset": 0}, {"color": "#3de3fb", "offset": 1}]}],
  "seriesAreaOpacity": [0.4]
}
```

> 注：`seriesSmooth` 越小曲线越圆滑，越大则越接近直线。
