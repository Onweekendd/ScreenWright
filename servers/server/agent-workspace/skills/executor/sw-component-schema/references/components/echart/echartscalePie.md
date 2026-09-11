# echartscalePie (刻度饼图) 配置说明

## dataChart 数据格式

```typescript
interface ScalePieDataItem {
  name: string;
  value: number;
  [key: string]: any;
}

type dataChart = ScalePieDataItem[];
```

**示例**：
```json
[
  { "name": "产品A", "value": 2024 },
  { "name": "产品B", "value": 2378 },
  { "name": "产品C", "value": 1423 }
]
```

---

## option 完整字段参考

基于配置文件：`echartscalePieGlobal.vue` / `echartscalePieSeries.vue`

刻度饼图使用 `graphOptions` 配置选项：**全局、系列**

### 系列配置

通过 `echartscalePieSeries.vue` + `ItemSeries` 配置：

| 字段 | 类型 | 说明 |
|------|------|------|
| `dataSeriesName` | string[] | 数据字段名 |
| `seriesTabsName` | {name,value}[] | 系列标签 |
| `seriesColor` | GradientColor[] | 扇区颜色列表 |
| `seriesOpacity` | number[] | 不透明度 |

### 全局配置

通过 `ItemScalePieStyle` + `ItemScaleStyle` + `ItemPieConfigNumber` + `ItemScalePieLegend` 配置：

**刻度饼图样式**（通过 ItemScalePieStyle，引用 configPieStyle）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `pieCenterX` | number | 圆心X位置(%) |
| `pieCenterY` | number | 圆心Y位置(%) |
| `pieRadiusMax` | number | 外半径(%) |
| `pieRadiusMin` | number | 内半径(%) |
| `pieRadiusGap` | number | 半径间隙 |

**刻度样式配置**（通过 ItemScaleStyle）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gaugeCenterX` | number | 刻度圆心X位置(%) |
| `gaugeCenterY` | number | 刻度圆心Y位置(%) |
| `gaugeRadius` | number | 刻度半径 |
| `gaugeLength` | number | 刻度长度 |
| `gaugeColor` | string | 刻度颜色 |

**数值标签配置**（通过 ItemPieConfigNumber）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLabelShow` | boolean | 数值标签显示 |
| `seriesLabelFontFamily` | string | 标签字体的名称 |
| `seriesLabelFontStyle` | string | 标签字体样式 |
| `seriesLabelFontWeight` | string | 标签字体粗细 |
| `seriesLabelFontSize` | number | 标签字号 |
| `seriesLabelColor` | string | 标签颜色 |

**图例配置**（通过 ItemScalePieLegend）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `legendShow` | boolean | 图例显示 |
| `legendItemWidthAndHeight` | number | 图标尺寸(px) |
| `legendTextLeftPadding` | number | 间距(px) |
| `legendFontFamily` | string | 图例字体的名称 |
| `legendFontStyle` | string | 图例字体样式 |
| `legendFontWeight` | string | 图例字体粗细 |
| `legendFontSize` | number | 图例字号 |
| `legendColor` | string | 图例颜色 |
| `legendOrient` | string | 图例方向 |

---

## 常用配置示例

### 标准刻度饼图

```json
{
  "pieCenterX": 50,
  "pieCenterY": 50,
  "pieRadiusMax": 70,
  "pieRadiusMin": 30,
  "gaugeCenterX": 50,
  "gaugeCenterY": 50,
  "gaugeRadius": 80,
  "gaugeLength": 10,
  "gaugeColor": "#999999"
}
```

### 自定义刻度样式

```json
{
  "gaugeColor": "#3e43f4",
  "gaugeLength": 15,
  "gaugeRadius": 85,
  "seriesLabelShow": true,
  "legendShow": true
}
```

### 调整圆心位置

```json
{
  "pieCenterX": 60,
  "pieCenterY": 55,
  "gaugeCenterX": 60,
  "gaugeCenterY": 55,
  "pieRadiusMax": 65
}
```
