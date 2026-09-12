# swtext (文本框/跑马灯/超链接) 配置说明

## dataChart 数据格式

```typescript
interface FtTextDataItem {
  value: string;  // 文本内容
}

type dataChart = FtTextDataItem[];
```

**示例**：
```json
[
  { "value": "大屏标题文字" }
]
```

---

## option 完整字段参考

基于配置文件：swtextGlobal.vue

本组件通过 `type` 字段区分三种模式：
- `"text"` — 文本框（静态文本展示）
- `"marquee"` — 跑马灯（文字滚动）
- `"link"` — 超链接（可点击跳转）

### 类型配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | string | "text" | 组件类型("text"文本框/"marquee"跑马灯/"link"超链接) |

### 超链接配置（type="link"时生效）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `link` | boolean | false | 是否为超链接 |
| `linkHref` | string | "" | 链接地址 |
| `linkTarget` | string | "_self" | 链接打开方式(_self/_blank) |
| `pointerEvents` | boolean | true | 是否响应鼠标事件 |

### 排版配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `writingMode` | string | "horizontal-tb" | 书写模式(horizontal-tb/vertical-rl/vertical-lr) |
| `textOrientation` | string | "mixed" | 文本方向 |

### 字体配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontFamily` | string | "siayuan-normal" | 字体 |
| `fontSize` | number | 32 | 字号 |
| `color` | string | "rgba(255,255,255,1)" | 字体颜色 |
| `fontWeight` | string | "normal" | 字重 |
| `fontStyle` | string | "normal" | 字体样式 |
| `lineHeight` | number | 40 | 行高(px) |

### 选中文字配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `selectedTextType` | string | "normal" | 选中文字类型(normal/gradient) |
| `selectedTextColor` | string | linear-gradient(...) | 选中文字颜色(支持渐变) |
| `selectedTextOpacity` | number | 100 | 选中文字透明度(0-100) |

### 布局配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `textAlign` | string | "center" | 水平对齐(left/center/right) |
| `textAlignVertical` | string | "center" | 垂直对齐(top/center/bottom) |
| `split` | number | 0 | 字间距 |
| `backgroundColor` | string | "rgba(255,255,255,0)" | 背景颜色 |

### 文字阴影配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `shadowShow` | boolean | false | 文字阴影开关 |
| `shadowColor` | string | "rgba(255,255,255,1)" | 阴影颜色 |
| `shadowX` | number | 0 | 阴影X偏移 |
| `shadowY` | number | 0 | 阴影Y偏移 |
| `shadowFuzzy` | number | 8 | 阴影模糊度 |
| `shadowExtension` | number | 0 | 阴影扩展 |

---

## 常用配置示例

### 大屏标题文字
```json
{
  "type": "text",
  "fontSize": 36,
  "fontWeight": "bold",
  "color": "rgba(0,168,255,1)",
  "textAlign": "center"
}
```

### 跑马灯滚动文字
```json
{
  "type": "marquee",
  "scroll": true,
  "speed": 15,
  "fontSize": 28
}
```

### 超链接跳转
```json
{
  "type": "link",
  "link": true,
  "linkHref": "https://www.example.com",
  "linkTarget": "_blank",
  "color": "rgba(0,168,255,1)"
}
```
