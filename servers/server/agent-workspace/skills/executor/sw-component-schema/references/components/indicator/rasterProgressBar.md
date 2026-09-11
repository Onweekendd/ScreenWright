# 栅格进度条 (rasterProgressBar) 配置说明

## dataChart 数据格式

```typescript
interface RasterProgressBarDataItem {
  value: string;  // 进度值，字符串类型，如 "0.65"
}

type dataChart = RasterProgressBarDataItem[];
```

**示例**：
```json
[
  { "value": "0.65" }
]
```

数据还支持可选字段 `max`(最大值) 和 `min`(最小值)。

---

## option 完整字段参考

### globalConfig 全局配置 (5字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `animatieTime` | number | 400 | 动画时长(ms) |
| `numType` | string | "percent" | 数值类型(percent百分比) |
| `isUsed` | boolean | true | 是否启用全局配置 |
| `extremeValueMax` | number | 1 | 最大值 |
| `extremeValueMin` | number | 0 | 最小值 |

### gridConfig 栅格配置 (7字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sectionNums` | number | 10 | 栅格分段数量 |
| `borderRadius` | number | 5 | 栅格圆角(px) |
| `foregroundOpacity` | number | 100 | 前景透明度(0~100) |
| `backgroundOpacity` | number | 0 | 背景透明度(0~100) |
| `interval` | number | 0.2 | 栅格间隔(px) |
| `foregroundColor` | object | — | 前景颜色渐变配置(见下方) |
| `backgroundColor` | string | "rgba(59,58,58,1)" | 背景颜色 |

#### foregroundColor 渐变配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | 渐变类型，如 "linear-gradient" |
| `angle` | string | 渐变角度，如 "0" |
| `colors` | array | 渐变颜色数组，每项包含 `color`(颜色值) 和 `per`(位置百分比) |

### seriesConfig 系列配置 (45字段)

#### 系列文字样式 (7字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesFontFamily` | string | — | 系列文字字体 |
| `seriesFontSize` | number | 18 | 系列文字字号(px) |
| `seriesLetterSpacing` | number | 0 | 系列文字字间距(px) |
| `seriesColor` | string | — | 系列文字颜色 |
| `seriesFontStyle` | string | "normal" | 系列文字样式 |
| `seriesFontWeight` | string | "normal" | 系列文字字重 |
| `seriesLineHeight` | number | 18 | 系列文字行高(px) |
| `decimalPlace` | number | 1 | 小数位数 |
| `seriesTranslateX` | number | 0 | 系列文字水平偏移(px) |
| `seriesTranslateY` | number | -34 | 系列文字垂直偏移(px) |

#### 背景图片配置 (5字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bgImgSrc` | string | — | 背景图片路径 |
| `bgImgWidth` | number | 97 | 背景图片宽度(px) |
| `bgImgHeight` | number | 49 | 背景图片高度(px) |
| `bgImgTranslateX` | number | 0 | 背景图片水平偏移(px) |
| `bgImgTranslateY` | number | 0 | 背景图片垂直偏移(px) |

#### 单位配置 (9字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `unitText` | string | "" | 单位文字 |
| `unitTranslateX` | number | 0 | 单位水平偏移(px) |
| `unitTranslateY` | number | 0 | 单位垂直偏移(px) |
| `isUnitCustomStyle` | boolean | false | 是否启用单位自定义样式 |
| `unitFontFamily` | string | — | 单位字体 |
| `unitFontSize` | number | 20 | 单位字号(px) |
| `unitLineHeight` | number | 20 | 单位行高(px) |
| `unitLetterSpacing` | number | 0 | 单位字间距(px) |
| `unitColor` | string | — | 单位颜色 |
| `unitFontStyle` | string | "normal" | 单位字体样式 |
| `unitFontWeight` | string | "normal" | 单位字重 |

#### 标签配置 (13字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tagShow` | boolean | true | 是否显示标签 |
| `tagFontFamily` | string | — | 标签字体 |
| `tagFontSize` | number | 18 | 标签字号(px) |
| `tagLetterSpacing` | number | 0 | 标签字间距(px) |
| `tagColor` | string | — | 标签颜色 |
| `tagFontStyle` | string | "normal" | 标签字体样式 |
| `tagFontWeight` | string | "normal" | 标签字重 |
| `tagLineHeight` | number | 18 | 标签行高(px) |
| `tagTranslateX` | number | 0 | 标签水平偏移(px) |
| `tagTranslateY` | number | 0 | 标签垂直偏移(px) |
| `tagUnitText` | string | "" | 标签单位文字 |
| `tagUnitTranslateX` | number | 0 | 标签单位水平偏移(px) |
| `tagUnitTranslateY` | number | 0 | 标签单位垂直偏移(px) |
| `isTagUnitCustomStyle` | boolean | false | 是否启用标签单位自定义样式 |
| `tagUnitFontFamily` | string | — | 标签单位字体 |
| `tagUnitFontSize` | number | 20 | 标签单位字号(px) |
| `tagUnitLineHeight` | number | 20 | 标签单位行高(px) |
| `tagUnitLetterSpacing` | number | 0 | 标签单位字间距(px) |
| `tagUnitColor` | string | — | 标签单位颜色 |
| `tagUnitFontStyle` | string | "normal" | 标签单位字体样式 |
| `tagUnitFontWeight` | string | "normal" | 标签单位字重 |

### sectionList 区间列表 (数组，每项 16 字段)

每个区间定义一个数值范围及对应的样式。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sectionMin` | number | — | 区间最小值 |
| `sectionMax` | number | — | 区间最大值 |
| `sectionBgColor` | object | — | 区间背景色渐变配置(同 foregroundColor 结构) |
| `sectionOpacity` | number | 100 | 区间透明度(0~100) |
| `seriesFontFamily` | string | — | 区间文字字体 |
| `seriesFontSize` | number | 18 | 区间文字字号(px) |
| `seriesLineHeight` | number | 20 | 区间文字行高(px) |
| `seriesLetterSpacing` | number | 0 | 区间文字字间距(px) |
| `seriesColor` | string | — | 区间文字颜色 |
| `seriesFontStyle` | string | "normal" | 区间文字样式 |
| `seriesFontWeight` | string | "normal" | 区间文字字重 |
| `seriesBgImgSrc` | string | — | 区间背景图片路径 |
| `seriesBgImgWidth` | number | 97 | 区间背景图片宽度(px) |
| `seriesBgImgHeight` | number | 49 | 区间背景图片高度(px) |
| `seriesBgImgTranslateX` | number | 0 | 区间背景图片水平偏移(px) |
| `seriesBgImgTranslateY` | number | 0 | 区间背景图片垂直偏移(px) |
| `sectionName` | string | — | 区间名称(如"区间1") |

### refresh 刷新配置 (1字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `refresh` | boolean | true | 是否刷新 |

---

## 常用配置示例

### 基础百分比进度
```json
{
  "globalConfig": {
    "animatieTime": 400,
    "numType": "percent",
    "extremeValueMax": 1,
    "extremeValueMin": 0
  },
  "gridConfig": {
    "sectionNums": 10,
    "borderRadius": 5,
    "foregroundOpacity": 100,
    "backgroundOpacity": 0,
    "interval": 0.2,
    "foregroundColor": {
      "type": "linear-gradient",
      "angle": "0",
      "colors": [{"color": "rgba(24,144,255,1)", "per": 0}, {"color": "rgba(30,231,231,1)", "per": 100}]
    },
    "backgroundColor": "rgba(59,58,58,1)"
  }
}
```

### 带告警分级的进度条
```json
{
  "sectionList": [
    {
      "sectionMin": 0,
      "sectionMax": 0.3,
      "sectionBgColor": {"type": "linear-gradient", "angle": "0", "colors": [{"color": "rgba(108,233,36,1)", "per": 0}, {"color": "rgba(253,206,37,1)", "per": 100}]},
      "sectionName": "正常"
    },
    {
      "sectionMin": 0.3,
      "sectionMax": 0.6,
      "sectionBgColor": {"type": "linear-gradient", "angle": "0", "colors": [{"color": "rgba(245,226,81,1)", "per": 0}, {"color": "rgba(247,178,49,1)", "per": 100}]},
      "sectionName": "告警"
    },
    {
      "sectionMin": 0.6,
      "sectionMax": 1,
      "sectionBgColor": {"type": "linear-gradient", "angle": "0", "colors": [{"color": "rgba(249,139,43,1)", "per": 0}, {"color": "rgba(249,38,38,1)", "per": 100}]},
      "sectionName": "危险"
    }
  ]
}
```

### 隐藏标签文字
```json
{
  "seriesConfig": {
    "tagShow": false
  }
}
```
