# echartrankBar (排名图) 配置说明

## dataChart 数据格式

```typescript
interface RankBarDataItem {
  name: string;
  value: number;
  [key: string]: any;
}

type dataChart = RankBarDataItem[];
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

基于配置文件：`echartrankBarGlobal.vue`

排名图使用 `defaultOption.slice(0, 1)` 配置选项：**全局**

### 全局配置

通过 `ItemConfigDistance` + `ItemBarStyle` + `ItemechartmultiplyRankBarValueLabel` + `ItemechartmultiplyRankBarAxisLabel` + `ItemConfigDataLoop` 配置：

**边距配置**（通过 ItemConfigDistance）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距(px) |
| `gridTop` | number | 上边距(px) |
| `gridRight` | number | 右边距(px) |
| `gridBottom` | number | 下边距(px) |

**柱体样式配置**（通过 ItemBarStyle）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesWidth` | number | 柱体宽度 |
| `seriesColor` | GradientColor[] | 柱体颜色列表 |
| `seriesOpacity` | number | 不透明度 |

**数值标签配置**（通过 ItemechartmultiplyRankBarValueLabel）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `valueFontFamily` | string | 数值字体的名称 |
| `valueFontStyle` | string | 数值字体样式 |
| `valueFontWeight` | string | 数值字体粗细 |
| `valueFontSize` | number | 数值字号 |
| `valueColor` | string | 数值颜色 |
| `valueOffSetX` | number | 数值X偏移(px) |
| `valueOffSetY` | number | 数值Y偏移(px) |

**轴标签配置**（通过 ItemechartmultiplyRankBarAxisLabel）：
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

---

## 常用配置示例

### 标准排名图

```json
{
  "seriesWidth": 30,
  "seriesColor": [{"colors": [{"color": "#3e43f4"}]}],
  "valueFontSize": 14,
  "valueColor": "#333333",
  "nameFontSize": 12,
  "nameColor": "#666666"
}
```

### 带轮播的排名图

```json
{
  "seriesWidth": 25,
  "dataLoop": true,
  "dataLoopInterval": 3,
  "dataLoopDisplayRows": 5,
  "dataLoopRollNum": 1
}
```

### 自定义标签偏移排名图

```json
{
  "seriesWidth": 35,
  "valueOffSetX": 10,
  "valueOffSetY": -5,
  "nameLeftPadding": 10,
  "gridLeft": 80
}
```
