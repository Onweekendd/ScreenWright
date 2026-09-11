# echartscatter (散点图) 配置说明

## dataChart 数据格式

```typescript
interface ScatterDataItem {
  name: string;        // 数据点标签
  value: [number, number, number?];  // [X轴值, Y轴值, 气泡大小(可选)]
  [key: string]: any;  // 其他业务字段
}

type dataChart = ScatterDataItem[];
```

**示例**：
```json
[
  { "name": "产品A", "value": [100, 150, 30] },
  { "name": "产品B", "value": [200, 180, 45] },
  { "name": "产品C", "value": [150, 200, 35] }
]
```

---

## option 完整字段参考

基于配置文件：`echartscatterGlobal.vue` / `echartscatterSeries.vue` / `echartscatterxAxis.vue` / `echartscatterTooltip.vue`

### 系列配置 (7字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `dataSeriesName` | string[] | 数据中的系列名列表 |
| `seriesTabsName` | {name,value}[] | 系列切换标签 |
| `seriesSymbolSize` | number[] | 数据点大小(px) |
| `seriesColor` | GradientColor[] | 数据点颜色 |
| `seriesItemBorderShow` | boolean[] | 是否显示边框 |
| `seriesItemBorderColor` | string[] | 边框颜色 |
| `seriesItemBorderWidth` | number[] | 边框宽度(px) |

### 全局配置 (10字段)

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

### 坐标轴配置 (15字段)

通过 xAxisConfigTab 配置，包括：

| 字段 | 类型 | 说明 |
|------|------|------|
| `xAxisShow` | boolean | 是否显示X轴 |
| `xAxisLabelShow` | boolean | 是否显示X轴标签 |
| `xAxisRotate` | number | X轴标签旋转角度 |
| `xAxisFontSize` | number | X轴标签字号 |
| `xAxisLineShow` | boolean | 显示X轴线 |
| `xAxisLineColor` | string | X轴线颜色 |
| `xAxisTickShow` | boolean | 显示X轴刻度 |
| `yAxisShow` | boolean | 是否显示Y轴 |
| `yAxisLabelShow` | boolean | 是否显示Y轴标签 |
| `yAxisMin` | string | Y轴最小值 |
| `yAxisMax` | string | Y轴最大值 |
| `yAxisFontSize` | number | Y轴标签字号 |
| `yAxisLineShow` | boolean | 显示Y轴线 |
| `yAxisSplitLineShow` | boolean | 显示Y轴分割线 |
| `yAxisSplitLineColor` | string | 分割线颜色 |

### 提示框配置 (1字段 + 公共组件)

| 字段 | 类型 | 说明 |
|------|------|------|
| `tooltipTriggerOn` | boolean | 是否启用提示框 |

（其他提示框字段通过 ItemZebra2Tooltip 和 ItemZebra2Pointer 公共组件配置）

---

## 常用配置示例

### 基础散点图

```json
{
  "seriesSymbolSize": [8],
  "seriesColor": [{"colors": [{"color": "#3e43f4"}]}],
  "legendShow": true
}
```

### 带边框的散点

```json
{
  "seriesSymbolSize": [10],
  "seriesColor": [{"colors": [{"color": "#3e43f4"}]}],
  "seriesItemBorderShow": [true],
  "seriesItemBorderColor": ["#ffffff"],
  "seriesItemBorderWidth": [2]
}
```

### 多系列散点对比

```json
{
  "seriesSymbolSize": [8],
  "seriesColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#ff9500"}]}
  ],
  "legendShow": true,
  "boundaryGap": true
}
```
