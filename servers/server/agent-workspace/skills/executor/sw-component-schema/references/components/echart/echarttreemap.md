# echarttreemap (矩形树图) 配置说明

## dataChart 数据格式

```typescript
interface TreemapDataItem {
  name: string;        // 节点名称
  value: number;       // 数值（决定矩形面积）
  children?: TreemapDataItem[];  // 子节点（层级数据）
  [key: string]: any;
}

type dataChart = TreemapDataItem[];
```

**示例**：
```json
[
  {
    "name": "电子产品",
    "value": 3000,
    "children": [
      { "name": "手机", "value": 1500 },
      { "name": "电脑", "value": 1000 },
      { "name": "配件", "value": 500 }
    ]
  },
  {
    "name": "服装",
    "value": 2000,
    "children": [
      { "name": "男装", "value": 1200 },
      { "name": "女装", "value": 800 }
    ]
  }
]
```

---

## option 完整字段参考

基于配置文件：`echarttreemapGlobal.vue` / `echarttreemapSeries.vue`

矩形树图使用 `graphOptions` 配置选项：**全局、系列**

### 系列配置

通过 `echarttreemapSeries.vue` 配置：

| 字段 | 类型 | 说明 |
|------|------|------|
| `dataSeriesName` | string[] | 数据字段名映射 |
| `seriesTabsName` | string[] | 系列标签名称 |
| `seriesColor` | string[] | 系列颜色列表 |

### 全局配置

通过 `ItemDistanceConfig` (parent + children) + `ItemGraphStyle` 配置：

**主项间隔边框配置**（TypeAttrs.parent）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesBorderColor` | string | 主项边框颜色 |
| `seriesBorderWidth` | number | 主项边框宽度 |

**子项间隔边框配置**（TypeAttrs.children）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesChildBorderColor` | string | 子项边框颜色 |
| `seriesChildBorderWidth` | number | 子项边框宽度 |

**数值标签配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLabelShow` | boolean | 数值标签显示 |
| `seriesLabelFontFamily` | string | 标签字体的名称 |
| `seriesLabelFontStyle` | string | 标签字体样式 |
| `seriesLabelFontWeight` | string | 标签字体粗细 |
| `seriesLabelFontSize` | number | 标签字号 |
| `seriesLabelColor` | string | 标签颜色 |

---

## 常用配置示例

### 标准矩形树图

```json
{
  "seriesBorderColor": "#ffffff",
  "seriesBorderWidth": 2,
  "seriesChildBorderColor": "#ffffff",
  "seriesChildBorderWidth": 1,
  "seriesLabelShow": true,
  "seriesColor": ["#3e43f4", "#3de3fb", "#ff9500"]
}
```

### 深色边框树图

```json
{
  "seriesBorderColor": "#333333",
  "seriesBorderWidth": 3,
  "seriesChildBorderColor": "#666666",
  "seriesChildBorderWidth": 1,
  "seriesLabelShow": true,
  "seriesLabelColor": "#ffffff"
}
```

### 无边框简洁树图

```json
{
  "seriesBorderWidth": 0,
  "seriesChildBorderWidth": 0,
  "seriesLabelShow": true,
  "seriesLabelFontSize": 14,
  "seriesColor": ["#3e43f4", "#3de3fb", "#ff9500", "#ff6b6b"]
}
```
