# echartpictorialbar (象形图) 配置说明

## dataChart 数据格式

```typescript
interface PictorialBarDataItem {
  seriesName: string;  // 系列标识（同名数据为一个系列）
  name: string;        // X轴分类名称
  value: number;       // 柱子高度值
  [key: string]: any;  // 其他业务字段
}

type dataChart = PictorialBarDataItem[];
```

**示例**：
```json
[
  { "seriesName": "2024年", "name": "产品A", "value": 2024 },
  { "seriesName": "2024年", "name": "产品B", "value": 2378 }
]
```

---

## option 完整字段参考

基于配置文件：`echartpictorialbarGlobal.vue` / `echartpictorialbarSeries.vue`（引用 echartbarSeries.vue）

象形图复用了柱状图（echartbar）的完整配置结构，关键区别在于可以使用自定义符号（symbol）来替代标准柱子形状。

### 系列配置

与 echartbar 相同的字段结构，包括：
- dataSeriesName、seriesColor、seriesOpacity
- 柱子样式：barGap、barCategoryGap、barBorderRadius、barBackgroundColor
- 颜色配置：seriesColor、extremeShow、extremeType、extremeColor
- 数值标签：seriesLabelShow、seriesLabelColor、seriesLabelFontSize 等

**象形图特有字段**（通过 symbol 配置实现）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `symbol` | string | 自定义符号类型或图片路径 |
| `symbolRepeat` | boolean | 是否重复符号 |
| `symbolSize` | number/number[] | 符号大小 |
| `symbolMargin` | number | 符号间距 |
| `symbolClip` | boolean | 是否裁剪符号 |
| `symbolPosition` | string | 符号位置:"start"/"end" |
| `symbolOffset` | number[] | 符号偏移 [x, y] |
| `symbolRotate` | number | 符号旋转角度 |

### 全局配置

通过 Global 配置面板，包含：边距（gridLeft/Top/Right/Bottom）、柱子样式、数值标签、图例、轮播动画、滚动条等。

### 坐标轴配置

通过 xAxisConfigTab 配置，包含轴标签、轴线、刻度、网格线等标准坐标轴字段。

### 提示框配置

通过 Tooltip 配置面板，包含 tooltipTriggerOn、ItemZebra2Tooltip、ItemZebra2Pointer 等。

---

## 常用配置示例

### 使用自定义图片作为柱子

```json
{
  "symbol": "image://./custom-icon.png",
  "symbolSize": [30, 40],
  "symbolRepeat": true,
  "seriesLabelShow": true
}
```

### 使用 ECharts 内置符号

```json
{
  "symbol": "path://M30.9,53.2C16.8,53.2,5.3,41.7,5.3,27.6S16.8,2,30.9,2s25.6,11.5,25.6,25.6S45,53.2,30.9,53.2z",
  "symbolSize": [40, 50],
  "seriesColor": [{"colors": [{"color": "#3e43f4"}]}]
}
```

### 重复符号填充效果

```json
{
  "symbol": "circle",
  "symbolRepeat": true,
  "symbolSize": [20, 20],
  "symbolMargin": 5,
  "seriesBarColor": [{"colors": [{"color": "#3de3fb"}]}]
}
```

### 渐变色象形柱

```json
{
  "symbol": "rect",
  "symbolSize": [40, 60],
  "seriesColor": [{"colors": [{"color": "#3e43f4", "offset": 0}, {"color": "#3de3fb", "offset": 1}]}],
  "seriesLabelShow": true
}
```
