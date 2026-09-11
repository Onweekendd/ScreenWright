# echartloopRingPie (轮播环形饼图) 配置说明

## dataChart 数据格式

```typescript
interface LoopRingPieDataItem {
  name: string;        // 扇区分类名称
  value: number;       // 扇区数值
  [key: string]: any;  // 其他业务字段
}

type dataChart = LoopRingPieDataItem[];
```

**示例**：
```json
[
  { "name": "产品A", "value": 2024 },
  { "name": "产品B", "value": 2378 },
  { "name": "产品C", "value": 1423 },
  { "name": "产品D", "value": 1532 }
]
```

---

## option 完整字段参考

基于配置文件：`echartloopRingPieGlobal.vue` / `echartloopRingPieSeries.vue`（引用 echartthreeQuartersPieSeries.vue） / `echartloopRingPieLoopAnimation.vue` / `echartloopRingPieAttrs.vue`

轮播环形饼图是环形饼图带自动轮播展示功能的版本。

### 系列配置 (7字段)

通过 echartthreeQuartersPieSeries 配置：

| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesOrder` | string | 排序方式:"default"/"desc"/"asc" |
| `seriesTabsName` | {name,value}[] | 系列切换标签 |
| `seriesColor` | GradientColor[] | 扇区颜色列表 |
| `seriesColorpicker` | string[] | 颜色预览值 |
| `seriesOpacity` | number[] | 不透明度 |

**数值标签配置**（通过 configPieNumber）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLabelShow` | boolean | 是否显示数值标签 |
| `seriesLabelColor` | string | 标签颜色 |
| `seriesLabelFontSize` | number | 标签字号 |
| ... | ... | 其他标签字体/偏移字段 |

### 全局配置

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距(px) |
| `gridTop` | number | 上边距(px) |
| `gridRight` | number | 右边距(px) |
| `gridBottom` | number | 下边距(px) |

**环形图属性**（radius/center）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `radius` | string/number | 外半径 |
| `innerRadius` | string/number | 内半径（环形） |
| `centerX` | string/number | 圆心X位置 |
| `centerY` | string/number | 圆心Y位置 |

### 轮播动画配置（关键字段）

通过 echartloopRingPieLoopAnimation 配置：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loopShow` | boolean | true | 是否启用轮播 |
| `loopInterval` | number | 3000 | 轮播间隔(ms) |
| `loopType` | string | - | 轮播类型 |
| `loopDirection` | string | clockwise | 轮播方向:"clockwise"/"counterclockwise" |

### 图例配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `legendShow` | boolean | 是否显示图例 |
| `legendOrient` | string | 图例方向 |
| `legendOffsetX` | number | 图例X偏移 |
| `legendOffsetY` | number | 图例Y偏移 |

---

## 常用配置示例

### 标准轮播环形图

```json
{
  "loopShow": true,
  "loopInterval": 3000,
  "seriesOrder": "desc",
  "seriesColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#3de3fb"}]},
    {"colors": [{"color": "#ff9500"}]}
  ]
}
```

### 快速轮播（1秒间隔）

```json
{
  "loopShow": true,
  "loopInterval": 1000,
  "loopDirection": "clockwise",
  "legendShow": true
}
```

### 逆时针轮播

```json
{
  "loopShow": true,
  "loopInterval": 2000,
  "loopDirection": "counterclockwise",
  "seriesOrder": "asc"
}
```
