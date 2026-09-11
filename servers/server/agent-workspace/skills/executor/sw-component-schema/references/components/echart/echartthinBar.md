# echartthinBar (细长柱状图) 配置说明

## dataChart 数据格式

```typescript
interface ThinBarDataItem {
  name: string;        // 分类名称
  value: number;       // 数值
  [key: string]: any;
}

type dataChart = ThinBarDataItem[];
```

**示例**：
```json
[
  { "name": "1月", "value": 2024 },
  { "name": "2月", "value": 2378 },
  { "name": "3月", "value": 1423 }
]
```

---

## option 完整字段参考

基于配置文件：`echartthinBarGlobal.vue` / `echartthinBarxAxis.vue` / `echartthinBarTooltip.vue`

细长柱状图使用 `echartthinBarOptions` 配置选项：**全局、坐标轴、提示框**

### 全局配置

通过 `ItemConfigDistance` + `ItemIsSort` + `ItemIsHighLight` + `ItemechartthinBarBarStyle` 配置：

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距(px) |
| `gridTop` | number | 上边距(px) |
| `gridRight` | number | 右边距(px) |
| `gridBottom` | number | 下边距(px) |

**排序和高亮配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `isSort` | boolean | 是否排序 |
| `isHover` | boolean | 是否高亮 |
| `hoverColor` | string | 高亮颜色 |
| `seriesOpacity` | number | 透明度 |

**柱体样式配置**（通过 ItemechartthinBarBarStyle）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesWidth` | number | 柱体宽度 |
| `seriesColor` | GradientColor[] | 柱体颜色列表 |
| `seriesOpacity` | number | 不透明度 |

### 坐标轴配置

通过 `xAxisConfigTab` 组件配置 X/Y 轴：

**X轴配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `xAxisShow` | boolean | X轴显示 |
| `xAxisType` | string | X轴类型 |
| `xAxisName` | string | X轴名称 |
| `xAxisNameShow` | boolean | X轴名称显示 |
| `xAxisNamePosition` | string | X轴名称位置 |
| `xAxisNamePaddingTop` | number | X轴名称上边距 |
| `xAxisNamePaddingBottom` | number | X轴名称下边距 |
| `xAxisNamePaddingLeft` | number | X轴名称左边距 |
| `xAxisNamePaddingRight` | number | X轴名称右边距 |
| `xAxisInverse` | boolean | X轴反转 |
| `xAxisMin` | number | X轴最小值 |
| `xAxisMax` | number | X轴最大值 |
| `xAxisLabelShow` | boolean | X轴标签显示 |
| `xAxisLabelRotate` | number | X轴标签旋转角度 |
| `xAxisLabelUtil` | string | X轴标签格式化 |
| `xAxisLabelLimit` | boolean | X轴标签限制 |
| `xAxisLabelLimitNum` | number | X轴标签限制数量 |
| `xAxisLabelHover` | boolean | X轴标签悬停高亮 |
| `xAxisLabelHoverColor` | string | X轴标签悬停颜色 |
| `xAxisLineShow` | boolean | X轴轴线显示 |
| `xAxisLineColor` | string | X轴轴线颜色 |
| `xAxisLineWidth` | number | X轴轴线宽度 |
| `xAxisTickShow` | boolean | X轴刻度显示 |
| `xAxisTickColor` | string | X轴刻度颜色 |
| `xAxisTickWidth` | number | X轴刻度宽度 |
| `xAxisTickLength` | number | X轴刻度长度 |
| `xAxisSplitLineShow` | boolean | X轴分隔线显示 |
| `xAxisSplitLineType` | string | X轴分隔线类型（solid/dashed/dotted） |
| `xAxisSplitLineColor` | string | X轴分隔线颜色 |
| `xAxisSplitLineWidth` | number | X轴分隔线宽度 |
| `xAxisSplitLineInterval` | number | X轴分隔线间隔 |
| `xAxisInterval` | number | X轴间隔 |
| `xAxisRotate` | number | X轴旋转角度 |
| `xAxisMargin` | number | X轴边距 |

**Y轴配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `yAxisShow` | boolean | Y轴显示 |
| `yAxisType` | string | Y轴类型 |
| `yAxisName` | string | Y轴名称 |
| `yAxisNameShow` | boolean | Y轴名称显示 |
| `yAxisNamePosition` | string | Y轴名称位置 |
| `yAxisNamePaddingTop` | number | Y轴名称上边距 |
| `yAxisNamePaddingBottom` | number | Y轴名称下边距 |
| `yAxisNamePaddingLeft` | number | Y轴名称左边距 |
| `yAxisNamePaddingRight` | number | Y轴名称右边距 |
| `yAxisInverse` | boolean | Y轴反转 |
| `yAxisMin` | number | Y轴最小值 |
| `yAxisMax` | number | Y轴最大值 |
| `yAxisLabelShow` | boolean | Y轴标签显示 |
| `yAxisLabelUtil` | string | Y轴标签格式化 |
| `yAxisLabelLimit` | boolean | Y轴标签限制 |
| `yAxisLabelLimitNum` | number | Y轴标签限制数量 |
| `yAxisLineShow` | boolean | Y轴轴线显示 |
| `yAxisLineColor` | string | Y轴轴线颜色 |
| `yAxisLineWidth` | number | Y轴轴线宽度 |
| `yAxisTickShow` | boolean | Y轴刻度显示 |
| `yAxisTickColor` | string | Y轴刻度颜色 |
| `yAxisTickWidth` | number | Y轴刻度宽度 |
| `yAxisTickLength` | number | Y轴刻度长度 |
| `yAxisSplitLineShow` | boolean | Y轴分隔线显示 |
| `yAxisSplitLineType` | string | Y轴分隔线类型 |
| `yAxisSplitLineColor` | string | Y轴分隔线颜色 |
| `yAxisSplitLineWidth` | number | Y轴分隔线宽度 |
| `yAxisSplitLineInterval` | number | Y轴分隔线间隔 |
| `yAxisInterval` | number | Y轴间隔 |

### 提示框配置

通过 `ItemBarToolTip` 组件配置：
| 字段 | 类型 | 说明 |
|------|------|------|
| `tooltip.show` | boolean | 提示框显示 |
| `tooltip.trigger` | string | 触发类型 |
| `tooltip.axisPointer` | object | 指示器配置 |

---

## 常用配置示例

### 标准细长柱状图

```json
{
  "seriesWidth": 10,
  "isSort": true,
  "seriesColor": [{"colors": [{"color": "#3e43f4"}]}]
}
```

### 排序高亮细长柱状图

```json
{
  "seriesWidth": 8,
  "isSort": true,
  "isHover": true,
  "hoverColor": "#ff9500",
  "seriesOpacity": 0.7
}
```

### 大数据量细长柱状图

```json
{
  "seriesWidth": 5,
  "gridLeft": 40,
  "gridRight": 20,
  "isSort": false
}
```

### 自定义坐标轴样式

```json
{
  "seriesWidth": 8,
  "xAxisLabelShow": true,
  "xAxisLabelRotate": 45,
  "xAxisSplitLineShow": false,
  "yAxisSplitLineShow": true,
  "yAxisSplitLineColor": "#f0f0f0"
}
```
