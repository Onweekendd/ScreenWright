# echartthreedBar (3D柱状图) 配置说明

## dataChart 数据格式

```typescript
interface ThreeDBarDataItem {
  seriesName: string;  // 系列标识
  name: string;        // X轴分类名称
  value: number;       // 柱子高度值
  [key: string]: any;  // 其他业务字段
}

type dataChart = ThreeDBarDataItem[];
```

**示例**：
```json
[
  { "seriesName": "2024年", "name": "1月", "value": 2024 },
  { "seriesName": "2024年", "name": "2月", "value": 2378 }
]
```

---

## option 完整字段参考

基于配置文件：`echartthreedBarGlobal.vue` / `echartthreedBarxAxis.vue` / `echartthreedBarTooltip.vue`

**注意**：echartthreedBar 使用 `echartthinBarOptions` 配置选项，**没有独立的 Series 配置面板**，所有系列字段直接在 Global 中定义。

### 全局配置（包含系列字段）

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距(px) |
| `gridTop` | number | 上边距(px) |
| `gridRight` | number | 右边距(px) |
| `gridBottom` | number | 下边距(px) |

**3D柱状系列字段**（直接在 Global 中配置）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesWidth` | number | 柱体宽度(1-40px) |
| `seriesColor` | GradientColor[] | 柱体颜色（支持渐变） |
| `seriesOpacity` | number | 柱体不透明度 |
| `seriesTopColor` | string | 柱体顶部/头部颜色 |
| `seriesBottomColor` | string | 柱体底部颜色 |

### 坐标轴配置

通过 xAxisConfigTab 配置（type=column，纵向轴），包括轴标签、轴线、刻度、网格线等标准字段。

### 提示框配置

通过 Tooltip 配置面板，包含 tooltipTriggerOn 等字段。

---

## 常用配置示例

### 标准3D柱状图

```json
{
  "seriesWidth": 20,
  "seriesColor": [{"colors": [{"color": "#3e43f4"}]}],
  "seriesOpacity": 1,
  "seriesTopColor": "#4a50ff",
  "seriesBottomColor": "#2d32a8"
}
```

### 渐变色3D效果

```json
{
  "seriesWidth": 25,
  "seriesColor": [{
    "type": "linear-gradient",
    "angle": "90",
    "colors": [
      {"color": "#3e43f4", "offset": 0},
      {"color": "#3de3fb", "offset": 1}
    ]
  }]
}
```

### 细长3D柱子

```json
{
  "seriesWidth": 10,
  "seriesColor": [{"colors": [{"color": "#ff9500"}]}],
  "seriesTopColor": "#ffb84d",
  "seriesBottomColor": "#cc7700"
}
```
