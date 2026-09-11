# echartmultiplyRankBar (总数排名图) 配置说明

## dataChart 数据格式

```typescript
interface MultiplyRankBarDataItem {
  name: string;
  value: number;
  [key: string]: any;
}

type dataChart = MultiplyRankBarDataItem[];
```

**示例**：
```json
[
  { "name": "产品A", "value": 2024 },
  { "name": "产品B", "value": 2378 }
]
```

---

## option 完整字段参考

基于配置文件：`echartmultiplyRankBarGlobal.vue` / `echartmultiplyRankBarSeries.vue`

总数排名图使用 `graphOptions` 配置选项：**全局、系列**

### 系列配置

通过 `echartmultiplyRankBarSeries.vue` + `ItemSeries` 配置：

| 字段 | 类型 | 说明 |
|------|------|------|
| `dataSeriesName` | string[] | 数据字段名 |
| `seriesTabsName` | {name,value}[] | 系列标签 |
| `seriesColor` | GradientColor[] | 系列颜色列表 |
| `seriesOpacity` | number[] | 不透明度 |

### 全局配置

通过 `ItemConfigDistance` + `ItemBarStyle` + `ItemechartmultiplyRankBarValueLabel` + `ItemConfigLegend` + `ItemechartmultiplyRankBarAxisLabel` + `ItemConfigDataLoop` 配置：

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距 |
| `gridTop` | number | 上边距 |
| `gridRight` | number | 右边距 |
| `gridBottom` | number | 下边距 |

**柱体样式**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesWidth` | number | 柱体宽度 |
| `seriesColor` | GradientColor[] | 柱体颜色 |
| `seriesOpacity` | number | 不透明度 |

**数值标签配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `valueFontFamily` | string | 数值字体的名称 |
| `valueFontStyle` | string | 数值字体样式 |
| `valueFontWeight` | string | 数值字体粗细 |
| `valueFontSize` | number | 数值字号 |
| `valueColor` | string | 数值颜色 |
| `valueOffSetX` | number | 数值X偏移 |
| `valueOffSetY` | number | 数值Y偏移 |

**图例配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `legendShow` | boolean | 图例显示 |
| `legendFontFamily` | string | 图例字体 |
| `legendFontStyle` | string | 图例样式 |
| `legendFontWeight` | string | 图例粗细 |
| `legendFontSize` | number | 图例字号 |
| `legendColor` | string | 图例颜色 |
| `legendOrient` | string | 图例方向 |

**轴标签配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `nameFontFamily` | string | 轴标签字体的名称 |
| `nameFontStyle` | string | 轴标签字体样式 |
| `nameFontWeight` | string | 轴标签字体粗细 |
| `nameFontSize` | number | 轴标签字号 |
| `nameColor` | string | 轴标签颜色 |
| `nameWidth` | number | 轴标签宽度 |
| `nameLeftPadding` | number | 轴标签左边距 |

**轮播动画配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `dataLoop` | boolean | 轮播动画显示 |
| `dataLoopInterval` | number | 间隔时长(秒) |
| `dataLoopDisplayRows` | number | 显示个数 |
| `dataLoopRollNum` | number | 轮播个数 |

---

## 常用配置示例

### 多系列对比排名图

```json
{
  "seriesColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#3de3fb"}]}
  ],
  "seriesWidth": 25,
  "legendShow": true,
  "dataLoop": true
}
```

### 带数值标签的排名图

```json
{
  "valueFontSize": 14,
  "valueColor": "#333333",
  "nameFontSize": 12,
  "seriesWidth": 30
}
```
