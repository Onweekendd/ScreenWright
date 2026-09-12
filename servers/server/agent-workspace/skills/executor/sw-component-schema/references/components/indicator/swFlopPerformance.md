# 翻牌器 (swFlopPerformance) 配置说明

## dataChart 数据格式

```typescript
interface FlopPerformanceDataItem {
  value: number;  // 数值
}

type dataChart = FlopPerformanceDataItem[];
```

**示例**：
```json
[
  { "value": 12345 }
]
```

---

## option 完整字段参考

### 播放配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `autoplay` | boolean | false | 是否自动播放翻牌动画 |
| `intervalTime` | number | 10 | 翻牌动画间隔时间 |
| `whole` | boolean | false | 是否整页翻牌 |
| `decimals` | number | 0 | 小数位数 |
| `span` | number | 1 | 翻牌间隔 |
| `splitx` | number | 31 | 水平分割间距 |
| `splity` | number | 20 | 垂直分割间距 |
| `letterSpace` | number | 1 | 字间距 |
| `useGrouping` | boolean | true | 是否使用千分位分组 |
| `makeComplete` | boolean | false | 是否补齐位数 |
| `completeCount` | number | 6 | 补齐后的总位数 |

### 类型与边框配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | string | "img" | 翻牌器类型："img" 或 "border" |
| `borderColor` | string | "rgba(255,255,255,1)" | 边框颜色 |
| `borderTopWidth` | number | 10 | 上边框宽度 |
| `borderBottomWidth` | number | 10 | 下边框宽度 |
| `borderLeftWidth` | number | 16 | 左边框宽度 |
| `borderRightWidth` | number | 16 | 右边框宽度 |
| `backgroundBorder` | string | "" | 背景边框图片 |
| `backgroundColor` | string | "rgba(255,255,255,0)" | 背景颜色 |
| `backgroundImage` | string | "" | 背景图片 |

### 数字字体配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontFamily` | string | "siayuan-normal" | 数字字体 |
| `fontSize` | number | 42 | 数字字号 |
| `color` | string | "rgba(255,255,255,1)" | 数字颜色 |
| `fontLinearColor` | string | "linear-gradient(...)" | 数字渐变色 |
| `fontWeight` | string | "bolder" | 数字粗细 |
| `fontStyle` | string | "normal" | 数字样式 |
| `textAlign` | string | "center" | 数字文本对齐方式 |

### 前缀配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `prefixInline` | string | "block" | 前缀显示方式 |
| `prefixText` | string | "翻牌器标题" | 前缀文本 |
| `prefixTextAlign` | string | "center" | 前缀对齐方式 |
| `prefixSplitx` | number | 37 | 前缀水平间距 |
| `prefixSplity` | number | 0 | 前缀垂直间距 |
| `prefixFontFamily` | string | "siayuan-normal" | 前缀字体 |
| `prefixFontSize` | number | 20 | 前缀字号 |
| `prefixColor` | string | "rgba(255, 255, 255, 1)" | 前缀颜色 |
| `prefixFontWeight` | string | "normal" | 前缀粗细 |
| `prefixFontStyle` | string | "normal" | 前缀样式 |

### 后缀配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `suffixInline` | string | "inline-block" | 后缀显示方式 |
| `suffixText` | string | "单位" | 后缀文本 |
| `suffixTextAlign` | string | "center" | 后缀对齐方式 |
| `suffixSplitx` | number | 0 | 后缀水平间距 |
| `suffixSplity` | number | 0 | 后缀垂直间距 |
| `suffixFontFamily` | string | "siayuan-normal" | 后缀字体 |
| `suffixFontSize` | number | 18 | 后缀字号 |
| `suffixColor` | string | "rgba(57,48,243,1)" | 后缀颜色 |
| `suffixFontWeight` | string | "normal" | 后缀粗细 |
| `suffixFontStyle` | string | "normal" | 后缀样式 |

### 自增配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `autoIncrement` | boolean | false | 是否启用自动递增 |
| `incrementFrequency` | number | 5 | 递增频率 |
| `randomRange` | number | 20 | 随机波动范围 |

---

## 常用配置示例

### 基础翻牌器（图片模式）

```json
{
  "type": "img",
  "fontFamily": "siayuan-normal",
  "fontSize": 42,
  "textAlign": "center",
  "prefixText": "总销售额",
  "suffixText": "元",
  "useGrouping": true
}
```

### 渐变色数字 + 边框样式

```json
{
  "type": "border",
  "borderColor": "rgba(0,183,226,1)",
  "borderTopWidth": 5,
  "borderBottomWidth": 5,
  "borderLeftWidth": 10,
  "borderRightWidth": 10,
  "fontLinearColor": "linear-gradient(286.0deg,rgba(126,255,77,1) 0.0,rgba(30,213,64,0) 100.0%)",
  "fontWeight": "bolder"
}
```

### 自动递增 + 补齐位数

```json
{
  "autoIncrement": true,
  "incrementFrequency": 3,
  "randomRange": 30,
  "makeComplete": true,
  "completeCount": 8
}
```
