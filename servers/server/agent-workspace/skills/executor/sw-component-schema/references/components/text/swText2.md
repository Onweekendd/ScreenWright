# swText2 (状态文本框) 配置说明

## dataChart 数据格式

```typescript
interface FtText2DataItem {
  value: string;  // 文本内容
}

type dataChart = FtText2DataItem[];
```

**示例**：
```json
[
  { "value": "我是一个状态文本" }
]
```

---

## option 完整字段参考

基于配置文件：swText2Global.vue / swText2LoadingEffect.vue / swText2SpecifiedStyle.vue

### 基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `iswrap` | boolean | false | 是否自动换行 |
| `lineHeight` | number | 40 | 行高(px) |
| `split` | number | 0 | 字间距 |
| `textAlign` | string | "center" | 水平对齐(left/center/right) |
| `textAlignVertical` | string | "center" | 垂直对齐(top/center/bottom) |

### 字体配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontFamily` | string | "SourceHanSansCN-Normal" | 字体 |
| `fontSize` | number | 26 | 字号 |
| `color` | string | "rgba(255,255,255,1)" | 字体颜色 |
| `fontWeight` | string | "normal" | 字重 |
| `fontStyle` | string | "normal" | 字体样式 |

### 选中文字配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `selectedTextType` | string | "normal" | 选中文字类型(normal/gradient) |
| `selectedTextColor` | string | linear-gradient(...) | 选中文字颜色(支持渐变) |
| `selectedTextOpacity` | number | 100 | 选中文字透明度(0-100) |

### 背景配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `backgroundColor` | string | "rgba(255,255,255,0)" | 背景颜色 |

### 文字阴影配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `shadowShow` | boolean | false | 是否显示阴影 |
| `shadowColor` | string | "rgba(255,255,255,1)" | 阴影颜色 |
| `shadowX` | number | 0 | 阴影X偏移 |
| `shadowY` | number | 0 | 阴影Y偏移 |
| `shadowFuzzy` | number | 8 | 阴影模糊度 |
| `shadowExtension` | number | 0 | 阴影扩展 |

### 状态样式卡片 (cardList)

每张卡片定义一组条件样式映射：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tabsName` | string | - | 样式卡片名称 |
| `mappingValue` | string | - | 映射匹配值 |
| `mappingValueType` | string | "string" | 映射值类型(string/number) |
| `conditions` | string | "" | 匹配条件表达式 |
| `fontFamily` | string | "siayuan-normal" | 卡片字体 |
| `fontSize` | number | 26 | 卡片字号 |
| `fontStyle` | string | "normal" | 卡片字体样式 |
| `fontWeight` | string | "normal" | 卡片字重 |
| `selectedTextType` | string | "normal" | 卡片选中文字类型 |
| `color` | string | "rgba(255,255,255,1)" | 卡片字体颜色 |
| `backgroundColor` | string | "rgba(255,255,255,0)" | 卡片背景颜色 |
| `selectedTextColor` | string | linear-gradient(...) | 卡片选中文字颜色 |
| `selectedTextOpacity` | number | 100 | 卡片选中文字透明度 |

---

## 常用配置示例

### 设备状态样式切换
```json
{
  "cardList": [
    {
      "tabsName": "在线",
      "mappingValue": "online",
      "color": "rgba(0,255,0,1)",
      "backgroundColor": "rgba(0,100,0,0.2)"
    },
    {
      "tabsName": "离线",
      "mappingValue": "offline",
      "color": "rgba(255,0,0,1)",
      "backgroundColor": "rgba(100,0,0,0.2)"
    }
  ]
}
```

### 渐变文字效果
```json
{
  "selectedTextType": "gradient",
  "selectedTextColor": "linear-gradient(0.0deg,rgba(10,17,219,1) 0.0,rgba(137,181,252,1) 100.0%)",
  "selectedTextOpacity": 100
}
```
