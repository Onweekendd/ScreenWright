# echartgraph (关系图) 配置说明

## dataChart 数据格式

```typescript
interface GraphNodeItem {
  name: string;        // 节点名称
  value: number;       // 节点大小基数
  [key: string]: any;
}

type dataChart = GraphNodeItem[];
```

**说明**：关系图的节点通过 dataChart 定义，连线通过 option.links 配置

**示例**：
```json
[
  { "name": "用户A", "value": 100 },
  { "name": "用户B", "value": 80 },
  { "name": "用户C", "value": 60 },
  { "name": "用户D", "value": 40 }
]
```

---

## option 完整字段参考

基于配置文件：`echartgraphGlobal.vue` / `echartgraphSeries.vue`

关系图使用 `graphOptions` 配置选项：**全局、系列**

### 系列配置

通过 `echartgraphSeries.vue` 配置基础系列字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `dataSeriesName` | string[] | 数据字段名映射 |
| `seriesTabsName` | string[] | 系列标签名称 |
| `seriesColor` | string[] | 系列颜色列表 |

**节点配置**（通过 ItemechartgraphSeriesDataPointer）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `points` | string[] | 节点标签列表 |
| `pointsSymbol` | string[] | 节点图形（circle/rect/triangle/image等） |
| `pointsSymbolImage` | string[] | 自定义节点图片URL |
| `pointColor` | string[] | 节点颜色 |
| `labelPosition` | string[] | 标签位置 |
| `seriesLabelAlign` | string[] | 水平对齐 |
| `seriesLabelVerticalAlign` | string[] | 垂直对齐 |

**节点标签配置**（每个节点独立配置）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLabelNameShow` | boolean[] | 类目标签显示 |
| `seriesLabelNameFontFamily` | string[] | 类目标签字体的名称 |
| `seriesLabelNameColor` | string[] | 类目标签颜色 |
| `seriesLabelNameFontSize` | number[] | 类目标签字号 |
| `seriesLabelNameFontStyle` | string[] | 类目标签样式 |
| `seriesLabelNameFontWeight` | string[] | 类目标签粗细 |
| `seriesLabelValueShow` | boolean[] | 数值标签显示 |
| `seriesLabelValueFontFamily` | string[] | 数值标签字体的名称 |
| `seriesLabelValueColor` | string[] | 数值标签颜色 |
| `seriesLabelValueFontSize` | number[] | 数值标签字号 |
| `seriesLabelValueFontStyle` | string[] | 数值标签样式 |
| `seriesLabelValueFontWeight` | string[] | 数值标签粗细 |

**连线配置**（通过 ItemechartgraphSeriesDataWay）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `linkName` | string[] | 连线标签名列表 |
| `links` | {source,target,value,color}[] | 连线数组 |
| `seriesLinksLineType` | string[] | 路线类型 |

每条连线包含：
- `source`: 源节点名称
- `target`: 目标节点名称
- `value`: 连线宽度值
- `color`: 颜色类型

### 全局配置

通过 `ItemDataNode` + `ItemDataLine` 配置：

**数据节点配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLinksSymbolSize` | number | 节点大小基数 |

**数据路线配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLinksLineWidth` | number | 连线宽度基数 |

---

## 常用配置示例

### 标准关系图

```json
{
  "seriesLinksSymbolSize": 20,
  "seriesLinksLineWidth": 2,
  "seriesColor": ["#3e43f4", "#3de3fb", "#ff9500"],
  "pointColor": ["#3e43f4", "#3de3fb", "#ff9500", "#ff6b6b"],
  "pointsSymbol": ["circle", "circle", "circle", "circle"],
  "links": [
    { "source": "用户A", "target": "用户B", "value": 2, "color": "source" },
    { "source": "用户B", "target": "用户C", "value": 1, "color": "source" }
  ]
}
```

### 不同节点样式

```json
{
  "seriesLinksSymbolSize": 30,
  "pointsSymbol": ["circle", "rect", "triangle", "diamond"],
  "pointColor": ["#3e43f4", "#3de3fb", "#ff9500", "#ff6b6b"],
  "labelPosition": ["top", "right", "bottom", "left"],
  "seriesLinksLineType": ["solid", "solid", "dashed", "dotted"]
}
```

### 带标签的关系图

```json
{
  "seriesLinksSymbolSize": 25,
  "seriesLabelNameShow": [true, true, true, true],
  "seriesLabelValueShow": [true, true, true, true],
  "seriesLabelNameFontSize": [14, 14, 14, 14],
  "seriesLabelValueFontSize": [12, 12, 12, 12]
}
```
