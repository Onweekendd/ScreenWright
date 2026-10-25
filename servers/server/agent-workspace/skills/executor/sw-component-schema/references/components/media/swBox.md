# 矩形 (swBox) 配置说明

纯 CSS 装饰盒子，用于背景底板、蒙层、渐变块、分隔条、发光边框和毛玻璃面板。

字段定义见 `packages/types/src/schemas/components/media/swBox.ts`，渲染实现见 `packages/material/src/components/ScreenwrightMedia/components/swBox/useSwBox.ts`。

## dataChart 数据格式

本组件无数据，工具参数 `dataChart` 和组件保存的 `data` 均使用空数组：

```json
[]
```

## option 完整字段参考

所有字段可选，`option` 使用 strict schema，仅接受下表中的字段。样式字段直接映射到 CSS；未设置时不写入对应样式，空 `option` 显示为透明盒子。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `background` | string | 未设置 | CSS background，支持纯色、线性渐变、径向渐变 |
| `border` | string | 未设置 | CSS border，如 `1px solid rgba(69,131,255,.4)` |
| `borderRadius` | number \| string | 未设置 | 数字按 px 渲染；字符串按 CSS，如 `8px 8px 0 0`、`50%` |
| `boxShadow` | string | 未设置 | CSS box-shadow，支持多层阴影和 inset 内阴影 |
| `backdropFilter` | string | 未设置 | CSS backdrop-filter，如 `blur(8px) saturate(150%)` |
| `opacity` | number | 未设置 | 透明度，范围 0～1 |
| `clipPath` | string | 未设置 | CSS clip-path，用于切角、斜边等裁剪 |
| `transform` | string | 未设置 | CSS transform，如 `rotate(15deg)` |
| `animation` | string | 未设置 | CSS animation 简写，如 `sw-breath 2s ease-in-out infinite` |
| `pointerEvents` | boolean | false | false 时鼠标事件穿透；true 时响应鼠标事件 |

`animation` 可用的内置关键帧：`sw-rotate`、`sw-rotate-reverse`、`sw-breath`、`sw-zoom`、`sw-float`、`sw-swing`。

位置、尺寸使用组件基础字段 `left`、`top`、`component.width`、`component.height`，不写入 `option`。

## 常用配置示例

以下示例均为 `option`，搭配空数据数组使用。

### 渐变圆角底板

```json
{
  "background": "linear-gradient(180deg,rgba(20,50,90,.9),rgba(8,18,36,.8))",
  "border": "1px solid rgba(69,131,255,.4)",
  "borderRadius": 12,
  "boxShadow": "inset 0 0 20px rgba(69,131,255,.25)",
  "pointerEvents": false
}
```

### 半透明蒙层

```json
{
  "background": "rgba(0,0,0,.5)",
  "pointerEvents": false
}
```

### 毛玻璃面板

```json
{
  "background": "rgba(255,255,255,.08)",
  "border": "1px solid rgba(255,255,255,.2)",
  "borderRadius": "8px 8px 0 0",
  "backdropFilter": "blur(8px) saturate(150%)"
}
```

### 切角发光边框与呼吸动画

```json
{
  "border": "1px solid #4583ff",
  "boxShadow": "inset 0 0 16px rgba(69,131,255,.5)",
  "clipPath": "polygon(12px 0,100% 0,100% 100%,0 100%,0 12px)",
  "animation": "sw-breath 2s ease-in-out infinite"
}
```
