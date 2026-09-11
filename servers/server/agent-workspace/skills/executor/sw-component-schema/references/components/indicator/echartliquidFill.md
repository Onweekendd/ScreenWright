# 水球图 (echartliquidFill) 配置说明

## dataChart 数据格式

```typescript
interface LiquidFillDataItem {
  seriesName: string;   // 系列名称
  percent: number;      // 占比值（0-1之间）
}

type dataChart = LiquidFillDataItem[];
```

**示例**：
```json
[
  { "seriesName": "A", "percent": 0.5 }
]
```

---

## option 完整字段参考

### 基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `refresh` | boolean | true | 是否启用刷新 |

### 位置与尺寸

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `centerX` | number | 50 | 圆心X坐标（百分比） |
| `centerY` | number | 50 | 圆心Y坐标（百分比） |
| `radius` | number | 80 | 水球半径（百分比） |

### 波浪配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `amplitude` | number | 8 | 波浪振幅 |
| `waveLength` | number | 80 | 波浪长度 |
| `direction` | string | "right" | 波浪方向：right/left |
| `shape` | string | "circle" | 水球形状：circle/rect/roundRect/triangle/diamond/pin 等 |
| `waveColor` | string[] | ["#294D99","#156ACF","#1598ED","#45BDFF"] | 波浪颜色列表 |
| `waveAnimation` | boolean | true | 是否启用波浪动画 |

### 外边框配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `outlineShow` | boolean | true | 是否显示外边框 |
| `outlineBorderDistance` | number | 8 | 外边框距离 |
| `outlineColor` | string | "rgba(0,0,0,0)" | 外边框内部填充色 |
| `outlineBorderColor` | string | "#294D99" | 外边框边框颜色 |
| `outlineBorderWidth` | number | 8 | 外边框边框宽度 |

### 背景与样式

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `backgroundColor` | string | "#E3F7FF" | 背景色 |
| `seriesItemStyleOpacity` | number | 0.95 | 系列不透明度（0-1） |
| `seriesLabelInsideColor` | string | "#ffffff" | 标签内部颜色 |

### 标签-基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesLabelShow` | boolean | true | 是否显示标签 |

### 标签-系列名称配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesLabelSeriesShow` | boolean | false | 是否显示系列名称标签 |
| `seriesLabelSeriesFontFamily` | string | "siayuan-normal" | 系列名称标签字体 |
| `seriesLabelSeriesFontSize` | number | 50 | 系列名称标签字体大小 |
| `seriesLabelSeriesColor` | string | "#294D99" | 系列名称标签颜色 |
| `seriesLabelSeriesFontStyle` | string | "normal" | 系列名称标签字体样式 |
| `seriesLabelSeriesFontWeight` | string | "bolder" | 系列名称标签字体粗细 |
| `seriesLabelSeriesBottomPadding` | number | 10 | 系列名称标签底部内边距 |

### 标签-百分比配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesLabelPercentShow` | boolean | true | 是否显示百分比标签 |
| `seriesLabelPercentValue` | number | 0 | 百分比小数位数 |
| `seriesLabelPercentFontFamily` | string | "siayuan-normal" | 百分比标签字体 |
| `seriesLabelPercentFontSize` | number | 50 | 百分比标签字体大小 |
| `seriesLabelPercentColor` | string | "rgba(41,77,153,1)" | 百分比标签颜色 |
| `seriesLabelPercentFontStyle` | string | "normal" | 百分比标签字体样式 |
| `seriesLabelPercentFontWeight` | number | 48 | 百分比标签字体粗细 |

### 标签位置配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesLabelAlign` | string | "center" | 标签水平对齐方式 |
| `seriesLabelBaseline` | string | "middle" | 标签垂直对齐方式 |
| `seriesLabelPositionX` | number | 50 | 标签X坐标（百分比） |
| `seriesLabelPositionY` | number | 50 | 标签Y坐标（百分比） |

### 水波标签页

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `waveTabsName` | string[] | ["水波1","水波2","水波3","水波4"] | 水波标签页名称列表 |

---

## 常用配置示例

### 默认圆形水球图

```json
{
  "refresh": true,
  "centerX": 50,
  "centerY": 50,
  "radius": 80,
  "amplitude": 8,
  "waveLength": 80,
  "direction": "right",
  "shape": "circle",
  "waveColor": ["#294D99", "#156ACF", "#1598ED", "#45BDFF"],
  "waveAnimation": true,
  "outlineShow": true,
  "seriesLabelPercentShow": true,
  "seriesLabelPercentFontSize": 50
}
```

### 自定义蓝色系水球

```json
{
  "radius": 90,
  "amplitude": 12,
  "waveColor": ["#1a5276", "#2980b9", "#5dade2", "#85c1e9"],
  "backgroundColor": "#d4e6f1",
  "outlineBorderColor": "#1a5276",
  "outlineBorderWidth": 6,
  "seriesLabelPercentColor": "rgba(255,255,255,1)",
  "seriesLabelPercentFontSize": 60
}
```

### 矩形水球（无边框）

```json
{
  "shape": "rect",
  "outlineShow": false,
  "radius": 85,
  "amplitude": 5,
  "waveColor": ["#27ae60", "#2ecc71"],
  "backgroundColor": "#eafaf1"
}
```
