# 环比同比图 (ftdynamicratio) 配置说明

## dataChart 数据格式

```typescript
interface DynamicRatioDataItem {
  value: number;  // 数值
}

type dataChart = DynamicRatioDataItem[];
```

**示例**：
```json
[
  { "value": 10 }
]
```

---

## option 完整字段参考

> 注意：以下数组类型字段中，索引0对应环比，索引1对应同比。

### 基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `thresholdValue` | number | 0 | 阈值，判断环比同比正负 |

### 字体配置（数组）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontFamily` | string[] | ["Source Han Sans CN-Normal...","Source Han Sans CN-Normal..."] | 字体列表 [环比, 同比] |
| `fontSize` | number[] | [26, 26] | 字号列表 [环比, 同比] |
| `textColor` | string[] | ["rgba(255,0,0,1)","rgba(72,255,0,1)"] | 文本颜色列表 [环比, 同比] |
| `fontWeight` | string[] | ["normal","normal"] | 字体粗细列表 [环比, 同比] |
| `fontStyle` | string[] | ["normal","normal"] | 字体样式列表 [环比, 同比] |

### 选中文字配置（数组）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `selectedTextType` | string[] | ["normal","normal"] | 选中文字类型 [环比, 同比] |
| `selectedTextColor` | string[] | ["linear-gradient(...)","linear-gradient(...)"] | 选中文字颜色（支持渐变） [环比, 同比] |
| `selectedTextOpacity` | number[] | [100, 100] | 选中文字不透明度 [环比, 同比] |

### 对齐配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `textAlign` | string | "center" | 水平对齐方式 |
| `textAlignVertical` | string | "center" | 垂直对齐方式 |

### 间距与单位配置（数组）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `split` | number[] | [0, 0] | 间距列表 [环比, 同比] |
| `textUnit` | string[] | ["",""] | 文本单位列表 [环比, 同比] |

### 背景配置（数组）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `backgroundColor` | string[] | ["rgba(255,255,255,0)","rgba(255,255,255,0)"] | 背景颜色 [环比, 同比] |

### 阴影配置（数组）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `shadowShow` | boolean[] | [false, false] | 是否显示阴影 [环比, 同比] |
| `shadowColor` | string[] | ["rgba(255,255,255,1)","rgba(255,255,255,1)"] | 阴影颜色 [环比, 同比] |
| `shadowX` | number[] | [0, 0] | 阴影X偏移 [环比, 同比] |
| `shadowY` | number[] | [0, 0] | 阴影Y偏移 [环比, 同比] |
| `shadowFuzzy` | number[] | [8, 8] | 阴影模糊度 [环比, 同比] |
| `shadowExtension` | number[] | [0, 0] | 阴影扩展 [环比, 同比] |

### 图标配置（数组）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `iconColor` | string[] | ["rgba(255,0,0,1)","rgba(72,255,0,1)"] | 图标颜色 [环比, 同比] |
| `iconSize` | number[] | [28, 28] | 图标大小 [环比, 同比] |

---

## 常用配置示例

### 基础环比同比展示

```json
{
  "thresholdValue": 0,
  "textAlign": "center",
  "textColor": ["rgba(255,0,0,1)", "rgba(72,255,0,1)"],
  "fontSize": [26, 26],
  "iconColor": ["rgba(255,0,0,1)", "rgba(72,255,0,1)"],
  "iconSize": [28, 28]
}
```

### 红绿配色（正值绿色，负值红色）

```json
{
  "thresholdValue": 0,
  "textColor": ["rgba(255,0,0,1)", "rgba(72,255,0,1)"],
  "backgroundColor": ["rgba(0,0,0,0)", "rgba(0,0,0,0)"],
  "shadowShow": [false, false]
}
```

### 带渐变色选中效果

```json
{
  "selectedTextColor": [
    "linear-gradient(0.0deg,rgba(10,17,219,1) 0.0,rgba(137,181,252,1) 100.0)",
    "linear-gradient(0.0deg,rgba(10,17,219,1) 0.0,rgba(137,181,252,1) 100.0)"
  ],
  "selectedTextOpacity": [100, 100]
}
```

### 带阴影和单位

```json
{
  "shadowShow": [true, true],
  "shadowColor": ["rgba(0,183,226,0.5)", "rgba(0,183,226,0.5)"],
  "shadowFuzzy": [12, 12],
  "textUnit": ["%", "%"]
}
```
