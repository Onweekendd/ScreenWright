# 集成交互控制 (ft-integration-mutual)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 名称 |
| value | string \| number | 值 |

## option 字段说明

### 字体配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontSize | number | 20 | 字体大小 |
| fontFamily | string | "sans-serif" | 字体族 |
| fontColor | string | "rgba(255,255,255,1)" | 字体颜色 |

### 变换配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| rotateX | number | 0 | X轴旋转角度 |
| rotateY | number | 0 | Y轴旋转角度 |
| rotateZ | number | 0 | Z轴旋转角度 |
| skewX | number | 0 | X轴倾斜角度 |
| skewY | number | 0 | Y轴倾斜角度 |
| textTranslateX | number | 0 | 文本X偏移 |
| textTranslateY | number | 0 | 文本Y偏移 |

### 背景与悬停
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| bgImage | string | "..." | 背景图片 |
| isHovered | boolean | false | 是否启用悬停效果 |
| hoverFontSize | number | 24 | 悬停字体大小 |
| hoverFontFamily | string | "sans-serif" | 悬停字体族 |
| hoverFontColor | string | "rgba(255,255,255,1)" | 悬停字体颜色 |
| hoverBgImage | string | "..." | 悬停背景图片 |
| isCursorPointer | string | "" | 鼠标指针样式 |
