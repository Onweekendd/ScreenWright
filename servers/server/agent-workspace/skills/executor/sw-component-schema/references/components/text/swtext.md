# swtext (文本框/跑马灯/超链接) 配置说明

字段名与取值和 CSS 一致，所有字段可选，缺省走渲染层默认值。option 是 strict 的：写了下表以外的字段会校验失败。

## dataChart 数据格式

文本内容只来自 `data[0].value`，**不要写进 option**。

```json
[
  { "value": "大屏标题文字" }
]
```

---

## 三种形态由字段是否存在区分

没有 `type` 字段。

- 文本框：不写 `marquee`、`href`
- 跑马灯：写 `marquee`
- 超链接：写 `href`

---

## option 完整字段参考

### 字体

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontFamily` | string | "Source Han Sans CN" | CSS font-family |
| `fontSize` | number | 14 | 字号(px) |
| `fontWeight` | number \| string | 400 | 如 400 / "bold" |
| `fontStyle` | "normal" \| "italic" | normal | 字体样式 |
| `letterSpacing` | number | 0 | 字间距(px) |
| `lineHeight` | number | 1.2 | 行高，**无单位倍数**，如 1.5（不是 px） |

### 颜色与效果

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `color` | string | "#ffffff" | 纯色 `#fff` / `rgba(...)`，或渐变 `linear-gradient(90deg,#fff,#496adc)` |
| `textShadow` | string | - | CSS text-shadow，发光如 `0 0 24px rgba(69,131,255,1)`，可多层 |
| `background` | string | - | 文字底色。**`color` 是渐变时此字段不生效** |
| `opacity` | number | - | 0-1 |

### 排版

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `textAlign` | "left" \| "center" \| "right" | left | 水平对齐 |
| `verticalAlign` | "top" \| "middle" \| "bottom" | middle | 在组件框内的垂直位置 |
| `whiteSpace` | "nowrap" \| "normal" \| "pre-line" | nowrap | 单行 / 自动换行 / 保留换行符 |
| `textOverflow` | "clip" \| "ellipsis" | ellipsis | 溢出处理 |
| `writingMode` | "horizontal-tb" \| "vertical-rl" \| "vertical-lr" | - | 书写模式 |
| `textOrientation` | "mixed" \| "upright" | - | 竖排时文字方向 |

### 变换与动画

| 字段 | 类型 | 说明 |
|------|------|------|
| `transform` | string | CSS transform，如 `rotateZ(15deg)` |
| `animation` | string | CSS animation 简写，关键帧名取内置预设，如 `sw-breath 2s ease-in-out infinite` |

### 数值格式化

| 字段 | 类型 | 说明 |
|------|------|------|
| `template` | string | 显示模板，`{value}` 替换为内容，如 `{value} kWh` |
| `decimals` | integer ≥ 0 | 内容为数字时保留的小数位 |
| `thousands` | boolean | 内容为数字时显示千分位 |

### 跑马灯

| 字段 | 类型 | 说明 |
|------|------|------|
| `marquee.speed` | number（必填） | 滚动速度(px/s) |
| `marquee.direction` | "left" \| "right" | 滚动方向，默认 left |

### 超链接

| 字段 | 类型 | 说明 |
|------|------|------|
| `href` | string | 链接地址，有此字段即为超链接 |
| `target` | "_self" \| "_blank" | 打开方式，默认 _self |

### 交互

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pointerEvents` | boolean | false | 是否响应鼠标 |

---

## 常用配置示例

### 大屏标题文字（渐变 + 发光）
```json
{
  "fontSize": 46,
  "fontWeight": "bold",
  "color": "linear-gradient(180deg,#ffffff,#4fa3ff)",
  "textShadow": "0 0 24px rgba(69,131,255,1)",
  "textAlign": "center"
}
```

### 指标数值
```json
{
  "fontSize": 36,
  "color": "#00a8ff",
  "template": "{value} kWh",
  "decimals": 1,
  "thousands": true
}
```

### 跑马灯滚动文字
```json
{
  "fontSize": 28,
  "marquee": { "speed": 80, "direction": "left" }
}
```

### 超链接跳转
```json
{
  "color": "rgba(0,168,255,1)",
  "href": "https://www.example.com",
  "target": "_blank",
  "pointerEvents": true
}
```
