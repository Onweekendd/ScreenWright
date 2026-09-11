# 分类占比条 (sortRatioBar) 配置说明

## dataChart 数据格式

```typescript
interface SortRatioBarDataItem {
  name: string;   // 系列名称
  value: number;  // 数值
}

type dataChart = SortRatioBarDataItem[];
```

**示例**：
```json
[
  { "name": "剩余数", "value": 20 },
  { "name": "使用数", "value": 43 },
  { "name": "故障数", "value": 20 }
]
```

---

## option 完整字段参考

### globalConfig 全局配置 (2字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bgColor` | string | "rgba(255,255,255,1)" | 条形背景颜色 |
| `interval` | number | 10 | 系列间隔(px) |

### textConfig 文字配置 (14字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `translateX` | number | 0 | 文字整体水平偏移(px) |
| `translateY` | number | -10 | 文字整体垂直偏移(px) |
| `tagFontFamily` | string | "Alibaba-PuHuiTi-Regular" | 标签字体 |
| `tagFontSize` | number | 18 | 标签字号(px) |
| `tagColor` | string | "rgba(255, 255, 255, 0.7)" | 标签颜色 |
| `tagFontStyle` | string | "normal" | 标签字体样式 |
| `tagFontWeight` | string | "normal" | 标签字重 |
| `tagLetterSpacing` | number | 0 | 标签字间距(px) |
| `tagLineHeight` | number | 18 | 标签行高(px) |
| `indexTranslateX` | number | 3 | 数值标签水平偏移(px) |
| `indexTranslateY` | number | 0 | 数值标签垂直偏移(px) |
| `isUsed` | boolean | true | 是否启用文字配置 |
| `tagShow` | boolean | true | 是否显示系列标签 |
| `indexShow` | boolean | true | 是否显示数值标签 |
| `decimalPlace` | number | 0 | 小数位数 |

### seriesList 系列列表 (数组，每项 21 字段)

每个系列对应 dataChart 中的一项数据。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesKeyValue` | string | — | 系列对应的数据键值(匹配 data.name) |
| `seriesBgColor` | object | — | 系列背景色渐变配置(见下方) |
| `seriesColor` | string | — | 系列颜色 |
| `seriesOpacity` | number | 100 | 系列透明度(0~100) |
| `seriesFontFamily` | string | — | 系列文字字体 |
| `seriesFontSize` | number | 18 | 系列文字字号(px) |
| `seriesLineHeight` | number | 18 | 系列文字行高(px) |
| `seriesLetterSpacing` | number | 0 | 系列文字字间距(px) |
| `seriesFontStyle` | string | "normal" | 系列文字样式 |
| `seriesFontWeight` | string | "normal" | 系列文字字重 |
| `seriesTranslateX` | number | 0 | 系列文字水平偏移(px) |
| `seriesTranslateY` | number | 0 | 系列文字垂直偏移(px) |
| `unitText` | string | "个" | 单位文字 |
| `unitTranslateX` | number | 2 | 单位水平偏移(px) |
| `unitTranslateY` | number | 0 | 单位垂直偏移(px) |
| `isUnitCustomStyle` | boolean | false | 是否启用单位自定义样式 |
| `unitFontFamily` | string | — | 单位字体 |
| `unitFontSize` | number | 20 | 单位字号(px) |
| `unitLineHeight` | number | 20 | 单位行高(px) |
| `unitLetterSpacing` | number | 0 | 单位字间距(px) |
| `unitColor` | string | — | 单位颜色 |
| `unitFontStyle` | string | "italic" | 单位字体样式 |
| `unitFontWeight` | string | "bolder" | 单位字重 |
| `seriesName` | string | — | 系列名称(如"系列1") |

#### seriesBgColor 渐变配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | 渐变类型，如 "linear-gradient" |
| `angle` | string | 渐变角度，如 "90" |
| `colors` | array | 渐变颜色数组，每项包含 `color`(颜色值) 和 `per`(位置百分比) |

---

## 常用配置示例

### 基础三分类占比
```json
{
  "globalConfig": {
    "bgColor": "rgba(255,255,255,1)",
    "interval": 10
  },
  "textConfig": {
    "tagShow": true,
    "indexShow": true,
    "decimalPlace": 0
  },
  "seriesList": [
    {
      "seriesKeyValue": "正常",
      "seriesBgColor": { "type": "linear-gradient", "angle": "90", "colors": [{"color": "rgba(0,245,171,1)", "per": 0}, {"color": "rgba(196,245,49,0.98)", "per": 100}] },
      "seriesColor": "rgba(172,241,67,1)",
      "unitText": "个"
    },
    {
      "seriesKeyValue": "告警",
      "seriesBgColor": { "type": "linear-gradient", "angle": "90", "colors": [{"color": "rgba(245,226,81,1)", "per": 0}, {"color": "rgba(247,178,49,0.98)", "per": 100}] },
      "seriesColor": "rgba(239,208,53,1)",
      "unitText": "个"
    }
  ]
}
```

### 隐藏标签仅显示占比条
```json
{
  "textConfig": {
    "tagShow": false,
    "indexShow": false
  }
}
```
