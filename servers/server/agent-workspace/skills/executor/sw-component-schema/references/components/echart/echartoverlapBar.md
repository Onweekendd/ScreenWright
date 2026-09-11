# echartoverlapBar (堆叠占比图) 配置说明

## dataChart 数据格式

```typescript
interface OverlapBarDataItem {
  name: string;
  value: number;
  [key: string]: any;
}

type dataChart = OverlapBarDataItem[];
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

基于配置文件：`echartoverlapBarGlobal.vue` / `echartoverlapBarSeries.vue`

堆叠占比图使用 `graphOptions` 配置选项：**全局、系列**

该组件支持堆叠显示，展示各部分占总体的百分比。

### 全局配置

通过 `ItemConfigDistance` + `ItemAxisLabel` + `ItemConfigDataLoop` + `ItemxAxisSplitLine` 配置：

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距 |
| `gridTop` | number | 上边距 |
| `gridRight` | number | 右边距 |
| `gridBottom` | number | 下边距 |

**轴标签配置**（通过 ItemAxisLabel）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `nameFontFamily` | string | 轴标签字体的名称 |
| `nameFontStyle` | string | 轴标签字体样式 |
| `nameFontWeight` | string | 轴标签字体粗细 |
| `nameFontSize` | number | 轴标签字号 |
| `nameColor` | string | 轴标签颜色 |
| `nameWidth` | number | 轴标签宽度 |
| `nameLeftPadding` | number | 轴标签左边距 |

**轮播动画配置**（通过 ItemConfigDataLoop）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `dataLoop` | boolean | 轮播动画显示 |
| `dataLoopInterval` | number | 间隔时长(秒) |
| `dataLoopDisplayRows` | number | 显示个数 |
| `dataLoopRollNum` | number | 轮播个数 |

**网格线配置**（通过 ItemxAxisSplitLine）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `splitLineShow` | boolean | 网格线显示 |
| `splitLineColor` | string | 网格线颜色 |
| `splitLineWidth` | number | 网格线宽度 |
| `splitLineType` | string | 网格线类型 |
| `splitLineInterval` | number | 网格线间隔 |

### 系列配置

通过 `echartoverlapBarSeries.vue` + `ItemechartoverlapBarStyle` + `ItemechartoverlapValueLabel` 配置：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesTabsName` | {name,value}[] | 系列标签 |
| `seriesColor` | GradientColor[] | 系列颜色 |
| `seriesOpacity` | number[] | 不透明度 |

---

## 常用配置示例

### 堆叠占比图

```json
{
  "seriesColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#3de3fb"}]},
    {"colors": [{"color": "#ff9500"}]}
  ],
  "dataLoop": true,
  "dataLoopInterval": 3
}
```

### 带网格线的堆叠占比图

```json
{
  "splitLineShow": true,
  "splitLineColor": "#e0e0e0",
  "splitLineType": "dashed",
  "seriesColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#3de3fb"}]}
  ]
}
```
