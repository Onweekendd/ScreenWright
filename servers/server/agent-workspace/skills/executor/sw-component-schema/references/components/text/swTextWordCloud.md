# swTextWordCloud (词云) 配置说明

## dataChart 数据格式

```typescript
interface FtTextWordCloudDataItem {
  text: string;   // 词语文本
  value: number;  // 权重值（决定显示大小）
}

type dataChart = FtTextWordCloudDataItem[];
```

**示例**：
```json
[
  { "text": "北京", "value": 93 },
  { "text": "上海", "value": 45 },
  { "text": "深圳", "value": 80 }
]
```

---

## option 完整字段参考

基于配置文件：swTextWordCloudGlobal.vue / swTextWordCloudSeries.vue

### 基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | string | "scroll" | 类型标识 |
| `scroll` | boolean | true | 是否自动旋转 |
| `speed` | number | 10 | 旋转速度 |
| `maxNumber` | number | 100 | 最大显示词语数量 |
| `dragControl` | boolean | false | 是否允许鼠标拖拽控制旋转 |

### 字体配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontFamily` | string | "Source Han Sans CN-Normal" | 基础字体 |
| `fontSize` | number | 26 | 基础字号（最大词语字号） |
| `textFontSize` | number | 12 | 最小字号（最小词语字号） |
| `color` | string | "rgba(255,255,255,1)" | 基础颜色 |

### 颜色配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `seriesColor` | string[] | ["rgba(62,67,244,1)", "rgba(61,227,251,1)", "rgba(137,181,252,1)"] | 词语颜色数组（循环使用） |

---

## 常用配置示例

### 自定义颜色方案
```json
{
  "seriesColor": [
    "rgba(255,87,51,1)",
    "rgba(255,189,51,1)",
    "rgba(51,255,87,1)"
  ],
  "scroll": true,
  "speed": 15,
  "maxNumber": 50
}
```

### 静态词云
```json
{
  "scroll": false,
  "dragControl": true,
  "fontSize": 30,
  "textFontSize": 14
}
```
