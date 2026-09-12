# swmultiLine (多行文本) 配置说明

## dataChart 数据格式

```typescript
interface FtMultiLineDataItem {
  name: string;  // 文字段落内容
  src: string;   // 前缀图标URL
}

type dataChart = FtMultiLineDataItem[];
```

**示例**：
```json
[
  { "name": "文字段落1", "src": "" },
  { "name": "文字段落2", "src": "" },
  { "name": "文字段落3", "src": "https://example.com/icon.png" }
]
```

---

## option 完整字段参考

基于配置文件：swmultiLineGlobal.vue

### 基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | string | "scroll" | 类型标识 |
| `scroll` | boolean | false | 是否滚动 |
| `speed` | number | 10 | 滚动速度 |
| `textDeraction` | string | "ToLeft" | 文本滚动方向 |

### 字体配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontFamily` | string | "SourceHanSansCN-Normal" | 字体 |
| `fontSize` | number | 26 | 字号 |
| `color` | string | "rgba(255,255,255,1)" | 字体颜色 |
| `fontWeight` | string | "normal" | 字重 |
| `fontStyle` | string | "normal" | 字体样式 |
| `lineHeight` | number | 36 | 行高(px) |

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
| `whiteSpace` | boolean | true | 是否不换行 |
| `textIndent` | number | 0 | 首行缩进(px) |

### 行边距配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `lineMarginTop` | number | 0 | 行上边距 |
| `lineMarginBottom` | number | 0 | 行下边距 |
| `lineMarginLeft` | number | 10 | 行左边距 |
| `lineMarginRight` | number | 10 | 行右边距 |

### 背景与阴影配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `backgroundColor` | string | "rgba(255,255,255,0)" | 背景颜色 |
| `shadowShow` | boolean | false | 文字阴影开关 |
| `shadowColor` | string | "rgba(255,255,255,1)" | 阴影颜色 |
| `shadowX` | number | 0 | 阴影X偏移 |
| `shadowY` | number | 0 | 阴影Y偏移 |
| `shadowFuzzy` | number | 8 | 阴影模糊度 |
| `shadowExtension` | number | 0 | 阴影扩展 |

### 图标配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `icon` | any | null | 图标资源 |
| `iconWidth` | number | 20 | 图标宽度(px) |
| `iconHeight` | number | 20 | 图标高度(px) |
| `iconMargin` | number[] | [0,0,0,0] | 图标边距[上,右,下,左] |

---

## 常用配置示例

### 多行文本列表
```json
{
  "scroll": false,
  "fontSize": 18,
  "lineHeight": 30,
  "lineMarginLeft": 20,
  "textAlign": "left",
  "whiteSpace": false
}
```

### 带图标的滚动文本
```json
{
  "scroll": true,
  "speed": 15,
  "textDeraction": "ToLeft",
  "icon": "version-test/assets/bullet.png",
  "iconWidth": 16,
  "iconHeight": 16,
  "iconMargin": [0, 10, 0, 0]
}
```
