# 滚动选择器 (scrollPicker)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 标签名称 |
| value | string \| number | 数值 |

## option 字段说明

### 全局配置 (globalConfig)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| defaultSelected | number | 1 | 默认选中索引 |
| showNum | number | 7 | 显示数量 |
| tabInterval | number | 0 | 选项间距 |
| permutationType | string | "column" | 排列类型 |
| autoCarousel | boolean | false | 是否自动轮播 |
| tabIntervalTime | number | 1 | 轮播间隔时间（秒） |

### 默认样式 (defaultObj)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| textFontFamily | string | "Alibaba-PuHuiTi-Regular" | 字体族 |
| textFontSize | number | 20 | 字体大小 |
| textLineHeight | number | 20 | 行高 |
| textLetterSpacing | number | 0 | 字间距 |
| textColor | string | "rgba(255,255,255,1)" | 字体颜色 |
| textFontStyle | string | "normal" | 字体样式 |
| textFontWeight | string | "normal" | 字体粗细 |
| textAlign | string | "center" | 文本对齐 |
| isTextShadow | boolean | false | 是否显示文本阴影 |
| backgroundType | string | "color" | 背景类型 |
| backgroundColor | string | "rgba(25,139,245,0.6)" | 背景颜色 |
| backgroundImage | string | "标题栏03.png" | 背景图片（可选） |

### 激活样式 (activeObj)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| textFontFamily | string | "Alibaba-PuHuiTi-Regular" | 字体族 |
| textFontSize | number | 28 | 字体大小（放大效果） |
| textLineHeight | number | 28 | 行高 |
| textColor | string | "rgba(255,255,255,1)" | 字体颜色 |
| isTextShadow | boolean | true | 是否显示文本阴影 |
| textShadowBlur | number | 8 | 文本阴影模糊 |
| backgroundType | string | "color" | 背景类型 |
| backgroundColor | string | "rgba(25,139,245,1)" | 背景颜色 |
