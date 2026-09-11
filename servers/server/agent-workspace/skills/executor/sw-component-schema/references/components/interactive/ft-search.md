# 搜索框组件 (ft-search)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| value | string | 搜索值 |

## option 字段说明

### 输入框字体配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| isFont | boolean | true | 是否自定义字体 |
| textIndent | number | 10 | 文本缩进 |
| fontSize | number | 24 | 输入框字体大小 |
| fontWeight | string | "" | 输入框字体粗细 |
| fontStyle | string | "" | 输入框字体样式 |
| fontFamily | string | "sans-serif" | 输入框字体族 |
| fontColor | string | "rgba(255,255,255,1)" | 输入框字体颜色 |

### 提示文字配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontSizeTip | number | 24 | 提示文字字体大小 |
| fontWeightTip | string | "" | 提示文字字体粗细 |
| fontStyleTip | string | "" | 提示文字字体样式 |
| fontFamilyTip | string | "sans-serif" | 提示文字字体族 |
| fontColorTip | string | "rgba(255,255,255,0.1)" | 提示文字字体颜色 |
| placeholder | string | "关键字" | 占位文本 |

### 边框与背景
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| isBorder | boolean | true | 是否显示边框 |
| borderWidth | number | 2 | 边框宽度 |
| borderColor | string | "rgba(138,86,232,0.9)" | 边框颜色 |
| borderRadius | number | 50 | 边框圆角 |
| isBackground | boolean | true | 是否显示背景 |
| backgroundColor | string | "rgba(24,144,255,0.2)" | 背景颜色 |
| backgroundImage | string | "" | 背景图片 |
| backgroundImageType | string | "100%100%" | 背景图片类型 |
| backgroundType | string | "color" | 背景类型 |

### 搜索按钮配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| isButton | boolean | true | 是否显示搜索按钮 |
| buttonPosition | string | "right" | 按钮位置 |
| buttonIconSize | number | 16 | 按钮图标大小 |
| buttonIconColor | string | "rgba(255,255,255,0.8)" | 按钮图标颜色 |
| buttonWidth | number | 60 | 按钮宽度 |
| backgroundColorBtn | string | "rgba(139,88,231,0.6)" | 按钮背景颜色 |
| backgroundImageBtn | string | "" | 按钮背景图片 |
| backgroundTypeBtn | string | "color" | 按钮背景类型 |
| buttonIconType | string | "default" | 按钮图标类型 |
| buttonIcon | string \| null | null | 按钮自定义图标 |
| buttonIconWidth | number | 30 | 按钮图标宽度 |
| buttonIconHeight | number | 30 | 按钮图标高度 |
