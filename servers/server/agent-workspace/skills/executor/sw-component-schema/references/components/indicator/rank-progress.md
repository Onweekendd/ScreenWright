# 排名进度 (rank-progress) 配置说明

## dataChart 数据格式

```typescript
interface RankProgressDataItem {
  name: string;   // 标签名称
  value: number;  // 数值
}

type dataChart = RankProgressDataItem[];
```

**示例**：
```json
[
  { "name": "广州", "value": 9999 },
  { "name": "深圳", "value": 9000 },
  { "name": "佛山", "value": 8000 },
  { "name": "东莞", "value": 7000 },
  { "name": "湛江", "value": 6000 }
]
```

---

## option 完整字段参考

### name 名称样式配置 (11字段)

控制左侧标签名称的文字样式。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `textTranslateX` | number | 0 | 文字水平偏移(px) |
| `textTranslateY` | number | 0 | 文字垂直偏移(px) |
| `fontSize` | number | 16 | 字号(px) |
| `fontWeight` | string | "normal" | 字重(normal/bold/bolder/lighter) |
| `fontStyle` | string | "normal" | 字体样式(normal/italic/oblique) |
| `fontFamily` | string | "sans-serif" | 字体 |
| `fontColor` | string | "rgba(255,255,255,1)" | 字体颜色 |
| `letterSpacing` | number | 0 | 字间距(px) |
| `isTextShadow` | boolean | false | 是否启用文字阴影 |
| `showBg` | boolean | true | 是否显示背景 |
| `textShadow` | object | — | 文字阴影配置(见下方) |

### value 数值样式配置 (10字段)

控制右侧数值的文字样式。字段结构与 name 相同，但无 `showBg` 字段。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `textTranslateX` | number | 0 | 文字水平偏移(px) |
| `textTranslateY` | number | 0 | 文字垂直偏移(px) |
| `fontSize` | number | 16 | 字号(px) |
| `fontWeight` | string | "normal" | 字重 |
| `fontStyle` | string | "normal" | 字体样式 |
| `fontFamily` | string | "sans-serif" | 字体 |
| `fontColor` | string | "rgba(255,255,255,1)" | 字体颜色 |
| `letterSpacing` | number | 0 | 字间距(px) |
| `isTextShadow` | boolean | false | 是否启用文字阴影 |
| `textShadow` | object | — | 文字阴影配置(见下方) |

### textShadow 文字阴影配置 (name 和 value 共用，5字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `x` | number | 0 | 阴影水平偏移(px) |
| `y` | number | 0 | 阴影垂直偏移(px) |
| `blur` | number | 0 | 阴影模糊度(px) |
| `color` | string | "rgba(255,255,255,1)" | 阴影颜色 |
| `extend` | number | 0 | 阴影扩展(px) |

### bar 条形配置 (7字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isScroll` | boolean | false | 是否启用滚动 |
| `scrollType` | string | "bar" | 滚动类型 |
| `showNum` | number | 5 | 显示条数 |
| `showCircle` | boolean | true | 是否显示圆形标记 |
| `width` | number | 100 | 进度条宽度(px) |
| `height` | number | 14 | 进度条高度(px) |
| `margin` | number[] | [0,0,0,0] | 外边距 [上, 右, 下, 左] |

### seriesTabs 系列标签列表 (数组，每项 3 字段)

每条数据对应一个排名的颜色配置。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tabName` | string | — | 标签页名称(如"排名1") |
| `name` | string | — | 对应数据名称(匹配 data.name) |
| `color` | string | — | 对应颜色(如"rgba(238,214,124,1.00)") |

---

## 常用配置示例

### 基础排名进度
```json
{
  "name": {
    "fontSize": 16,
    "fontColor": "rgba(255,255,255,1)",
    "showBg": true
  },
  "value": {
    "fontSize": 16,
    "fontColor": "rgba(255,255,255,1)"
  },
  "bar": {
    "isScroll": false,
    "showNum": 5,
    "showCircle": true,
    "width": 100,
    "height": 14,
    "margin": [0, 0, 0, 0]
  },
  "seriesTabs": [
    { "tabName": "排名1", "name": "广州", "color": "rgba(238,214,124,1.00)" },
    { "tabName": "排名2", "name": "深圳", "color": "rgba(208,208,208,1.00)" },
    { "tabName": "排名3", "name": "佛山", "color": "rgba(189,139,86,1.00)" }
  ]
}
```

### 启用滚动展示更多排名
```json
{
  "bar": {
    "isScroll": true,
    "scrollType": "bar",
    "showNum": 10
  }
}
```

### 自定义名称和数值样式
```json
{
  "name": {
    "fontSize": 14,
    "fontWeight": "bold",
    "fontColor": "rgba(0,168,255,1)",
    "isTextShadow": true,
    "textShadow": { "x": 1, "y": 1, "blur": 2, "color": "rgba(0,0,0,0.5)", "extend": 0 }
  },
  "value": {
    "fontSize": 18,
    "fontWeight": "bolder",
    "fontColor": "rgba(255,200,0,1)"
  }
}
```
