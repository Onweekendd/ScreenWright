# 环形图 (echartring) 配置说明

## dataChart 数据格式

```typescript
interface RingDataItem {
  value: number;       // 当前值
  total: number;       // 总数
}

type dataChart = RingDataItem[];
```

**示例**：
```json
[
  { "value": 75, "total": 100 }
]
```

---

## option 完整字段参考

### 基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `refresh` | boolean | true | 是否启用刷新 |

### 环形位置与尺寸

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `startAngle` | number | 90 | 起始角度（度） |
| `centerX` | number | 50 | 圆心X坐标（百分比） |
| `centerY` | number | 50 | 圆心Y坐标（百分比） |
| `radiusMax` | number | 100 | 外环半径（百分比） |
| `radiusMin` | number | 70 | 内环半径（百分比） |

### 系列颜色

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesColor` | object | (渐变) | 系列颜色配置，支持线性渐变 |
| `seriesColor.type` | string | "linear-gradient" | 渐变类型 |
| `seriesColor.angle` | string | "180" | 渐变角度 |
| `seriesColor.colors` | array | [{color, per}] | 渐变颜色列表 |
| `seriesColor.colors[].color` | string | - | 颜色值 |
| `seriesColor.colors[].per` | number | - | 颜色位置百分比 |

### 系列样式

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesOpacity` | number | 100 | 系列不透明度（0-100） |
| `barGap` | number | 70 | 柱间距离（百分比） |
| `barCategoryGap` | number | 60 | 类目间距离（百分比） |

### 标签配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesLabelShow` | boolean | true | 是否显示标签 |
| `seriesLabelUtil` | string | "%" | 标签单位符号 |
| `seriesLabelColor` | string | "rgba(255,255,255,1)" | 标签颜色 |
| `seriesLabelFontFamily` | string | "siayuan-normal" | 标签字体 |
| `seriesLabelFontSize` | number | 32 | 标签字体大小 |
| `seriesLabelFontWeight` | string | "normal" | 标签字体粗细 |
| `seriesLabelFontStyle` | string | "normal" | 标签字体样式 |
| `seriesLabelOffsetX` | number | 0 | 标签X轴偏移 |
| `seriesLabelOffsetY` | number | 0 | 标签Y轴偏移 |

---

## 常用配置示例

### 默认渐变环形图

```json
{
  "refresh": true,
  "startAngle": 90,
  "centerX": 50,
  "centerY": 50,
  "radiusMax": 100,
  "radiusMin": 70,
  "seriesColor": {
    "type": "linear-gradient",
    "angle": "180",
    "colors": [
      { "color": "rgba(0,127,247,1)", "per": 0 },
      { "color": "rgba(0,183,226,1)", "per": 100 }
    ]
  },
  "seriesLabelShow": true,
  "seriesLabelFontSize": 32,
  "seriesLabelUtil": "%"
}
```

### 自定义颜色和位置

```json
{
  "seriesColor": {
    "type": "linear-gradient",
    "angle": "90",
    "colors": [
      { "color": "rgba(255,0,0,1)", "per": 0 },
      { "color": "rgba(255,165,0,1)", "per": 100 }
    ]
  },
  "radiusMax": 90,
  "radiusMin": 60,
  "centerX": 50,
  "centerY": 50,
  "seriesLabelFontSize": 40,
  "seriesLabelColor": "rgba(255,255,255,1)"
}
```
