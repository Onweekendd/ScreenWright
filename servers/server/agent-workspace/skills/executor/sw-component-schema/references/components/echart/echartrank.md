# echartrank (排名图) 配置说明

## dataChart 数据格式

```typescript
interface RankDataItem {
  seriesName: string;  // 系列标识（通常为空或固定）
  name: string;        // 排名项名称
  value: number;       // 排名值
  [key: string]: any;  // 其他业务字段
}

type dataChart = RankDataItem[];
```

**示例**：
```json
[
  { "seriesName": "排名", "name": "产品A", "value": 2024 },
  { "seriesName": "排名", "name": "产品B", "value": 2378 },
  { "seriesName": "排名", "name": "产品C", "value": 1423 }
]
```

---

## option 完整字段参考

基于配置文件：`echartrankGlobal.vue` / `echartrankSeries.vue` / `echartrankxAxis.vue` / `echartrankTooltip.vue`

排名图是简化的柱状图，专用于展示 Top N 排名数据。

### 系列配置 (4字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesTabsName` | {name,value}[] | 系列切换标签（通常为"排名1"） |
| `seriesColor` | GradientColor[] | 排名柱子颜色（支持渐变） |
| `seriesOpacity` | number[] | 不透明度（固定为1） |
| `seriesLabelBackground` | string[] | 排名标签背景图片URL |

### 全局配置 (8组配置)

**排序类型**：
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sortType` | string | desc | 排序方式:"desc"降序/"asc"升序 |

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距(px) |
| `gridTop` | number | 上边距(px) |
| `gridRight` | number | 右边距(px) |
| `gridBottom` | number | 下边距(px) |

**条形样式**（ItemConfigStripStyle）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `barGap` | number | 柱子间距(%) |
| `barCategoryGap` | number | 分类间距(%) |
| `barBorderRadius` | string | 柱子圆角 |
| `barBackgroundColor` | string | 柱子背景颜色 |

**三种标签配置**（itemConfigNumIndexLabel）：
- **排名标签**（index=0）: seriesLabelShow[0], defaultSeriesLabelBackground, 以及标签字体/颜色/偏移
- **类目标签**（index=1）: seriesLabelShow[1], 以及标签字体/颜色/偏移
- **数值标签**（index=2）: seriesLabelShow[2], 以及标签字体/颜色/偏移/后缀

**轮播动画**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `dataLoopInterval` | number | 轮播间隔(s) |

**滚动条**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `dataZoomShow` | boolean | 显示缩放条 |
| `dataZoomBottom` | number | 缩放条距离底部 |

### 坐标轴配置

通过 xAxisConfigTab 配置（type=column，纵向轴）。

### 提示框配置

通过 Tooltip 配置面板，包含 tooltipTriggerOn 等。

---

## 常用配置示例

### 标准排名图

```json
{
  "seriesColor": [{
    "type": "linear-gradient",
    "angle": "90",
    "colors": [
      {"color": "rgba(62,67,244,1)", "per": 0},
      {"color": "rgba(137,181,252,1)", "per": 100}
    ]
  }],
  "seriesLabelBackground": [""],
  "seriesOpacity": [1]
}
```

### 自定义排名标签背景

```json
{
  "seriesColor": [{"colors": [{"color": "#3e43f4"}]}],
  "seriesLabelBackground": ["./rank-bg-1.png"],
  "legendShow": false
}
```

### Top 5 排名显示

```json
{
  "seriesColor": [{
    "type": "linear-gradient",
    "angle": "90",
    "colors": [
      {"color": "#ff6b6b", "per": 0},
      {"color": "#ffd93d", "per": 100}
    ]
  }],
  "seriesLabelBackground": ["./top5-bg.png"]
}
```
