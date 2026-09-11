# echartsankey (桑基图) 配置说明

## dataChart 数据格式

```typescript
interface SankeyLinkItem {
  source: string;    // 源节点名称
  target: string;    // 目标节点名称
  value: number;     // 流量值（决定线条粗细）
  [key: string]: any;
}

type dataChart = SankeyLinkItem[];
```

**示例**：
```json
[
  { "source": "访问", "target": "浏览", "value": 100 },
  { "source": "浏览", "target": "加购", "value": 60 },
  { "source": "加购", "target": "下单", "value": 40 },
  { "source": "下单", "target": "支付", "value": 30 }
]
```

---

## option 完整字段参考

基于配置文件：`echartsankeyGlobal.vue` / `echartsankeySeries.vue`

桑基图使用 `graphOptions` 配置选项：**全局、系列**

### 系列配置

通过 `echartsankeySeries.vue` 配置节点颜色：

| 字段 | 类型 | 说明 |
|------|------|------|
| `pointColor` | string[] | 节点颜色列表（按节点顺序） |

### 全局配置

通过 `ItemechartsankeyGlobal` + `ItemechartsankeyLine` + `ItemEchartsankeyNumber` + `ItemEchartsankeyToolTip` 配置：

**全局样式**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLabelShow` | boolean | 数值标签显示 |
| `seriesLabel.nodeWidth` | number | 节点宽度 |
| `series.nodeGap` | number | 节点间隔 |
| `series.draggable` | boolean | 节点可拖拽 |

**线样式配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `series.lineStyle.color` | string | 取色方式（source/target/自定义） |
| `series.lineStyle.customColor` | string | 自定义连线颜色 |
| `series.lineStyle.opacity` | number | 连线透明度（0-1） |
| `series.lineStyle.curveness` | number | 连线曲度（0-1） |

**数值标签配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLabel.padding` | number[] | 内边距[top,right,bottom,left] |
| `seriesLabelFontFamily` | string | 标签字体的名称 |
| `seriesLabelFontStyle` | string | 标签字体样式 |
| `seriesLabelFontWeight` | string | 标签字体粗细 |
| `seriesLabelFontSize` | number | 标签字号 |
| `seriesLabelColor` | string | 标签颜色 |
| `seriesLabel.align` | string | 水平对齐（center/left/right） |
| `seriesLabel.verticalAlign` | string | 垂直对齐（top/middle/bottom） |
| `seriesLabel.position` | string | 标签位置（通过偏移组件） |

**提示框配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `tooltip.show` | boolean | 提示框显示 |
| `tooltip.backgroundColor` | string | 提示框背景色 |
| `tooltip.color` | string | 提示框文字颜色 |

---

## 常用配置示例

### 标准桑基图

```json
{
  "seriesLabelShow": true,
  "seriesLabel": {
    "nodeWidth": 20,
    "padding": [5, 10, 5, 10]
  },
  "series": {
    "nodeGap": 8,
    "lineStyle": {
      "color": "source",
      "opacity": 0.3,
      "curveness": 0.5
    }
  }
}
```

### 自定义颜色桑基图

```json
{
  "pointColor": ["#3e43f4", "#3de3fb", "#ff9500"],
  "series": {
    "lineStyle": {
      "color": "自定义",
      "customColor": "#ff6b6b",
      "opacity": 0.5,
      "curveness": 0.3
    }
  }
}
```

### 可拖拽节点桑基图

```json
{
  "seriesLabelShow": true,
  "series": {
    "nodeWidth": 15,
    "nodeGap": 10,
    "draggable": true,
    "lineStyle": {
      "curveness": 0.6
    }
  },
  "tooltip": {
    "show": true
  }
}
```
