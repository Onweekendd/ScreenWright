# echartthreeQuartersPie (环形饼图) 配置说明

## dataChart 数据格式

```typescript
interface ThreeQuartersPieDataItem {
  name: string;
  value: number;
  [key: string]: any;
}

type dataChart = ThreeQuartersPieDataItem[];
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

基于配置文件：`echartthreeQuartersPieGlobal.vue` / `echartthreeQuartersPieSeries.vue`

环形饼图使用 `graphOptions` 配置选项：**全局、系列**

### 系列配置

通过 `echartthreeQuartersPieSeries.vue` 配置：

| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesOrder` | string | 排序方式（default/desc/asc） |
| `dataSeriesName` | string[] | 数据字段名 |
| `seriesTabsName` | {name,value}[] | 系列标签 |
| `seriesColor` | GradientColor[] | 扇区颜色列表 |
| `seriesOpacity` | number[] | 不透明度 |

### 全局配置

通过 `ItemechartthreeQuartersPiePieStyle` + `ItemPieRoseNumber` + `ItemechartthreeQuartersPieLegend` 配置：

**环形图样式配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesRemainColor` | string | 剩余颜色 |
| `seriesBottomColor` | string | 底部颜色 |
| `seriesOffsetX` | number | X偏移(%) |
| `seriesOffsetY` | number | Y偏移(%) |
| `pieRadiusOuter` | number | 外半径(%) |

**数值标签配置**（通过 ItemPieRoseNumber）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLabelShow` | boolean | 数值标签显示 |
| `seriesLabelFontFamily` | string | 标签字体的名称 |
| `seriesLabelFontStyle` | string | 标签字体样式 |
| `seriesLabelFontWeight` | string | 标签字体粗细 |
| `seriesLabelFontSize` | number | 标签字号 |
| `seriesLabelColor` | string | 标签颜色 |
| `seriesLabel.padding` | number[] | 内边距 |
| `seriesLabel.align` | string | 水平对齐 |
| `seriesLabel.verticalAlign` | string | 垂直对齐 |
| `seriesLabel.position` | string | 标签位置 |

**图例配置**（通过 ItemechartthreeQuartersPieLegend）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `legendShow` | boolean | 图例显示 |
| `legendItemWidthHeight` | number | 图标尺寸 |
| `legendSeriesShow` | boolean | 类目标签显示 |
| `legendSeriesFontFamily` | string | 类目字体的名称 |
| `legendSeriesFontStyle` | string | 类目字体样式 |
| `legendSeriesFontWeight` | string | 类目字体粗细 |
| `legendSeriesFontSize` | number | 类目字号 |
| `legendSeriesColor` | string | 类目颜色 |
| `legendUnderlineShow` | boolean | 分隔线显示 |
| `legendUnderlineWidth` | number | 分隔线宽度 |
| `legendUnderlineInterval` | number | 分隔线间距 |
| `legendUnderlineOffsetX` | number | 分隔线X偏移(%) |
| `legendUnderlineOffsetY` | number | 分隔线Y偏移(%) |
| `legendItemGap` | number | 图例间距(%) |
| `legendOffsetX` | number | 图例X偏移(%) |
| `legendOffsetY` | number | 图例Y偏移(%) |

---

## 常用配置示例

### 标准环形饼图

```json
{
  "seriesOrder": "desc",
  "pieRadiusOuter": 70,
  "seriesColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#3de3fb"}]},
    {"colors": [{"color": "#ff9500"}]}
  ],
  "seriesLabelShow": true,
  "legendShow": true
}
```

### 带剩余色的环形饼图

```json
{
  "seriesOrder": "desc",
  "seriesRemainColor": "#f0f0f0",
  "seriesBottomColor": "#e0e0e0",
  "pieRadiusOuter": 60,
  "seriesLabelShow": true
}
```

### 自定义偏移环形饼图

```json
{
  "seriesOffsetX": 10,
  "seriesOffsetY": 10,
  "pieRadiusOuter": 75,
  "legendItemGap": 15,
  "legendOffsetY": 10
}
```
