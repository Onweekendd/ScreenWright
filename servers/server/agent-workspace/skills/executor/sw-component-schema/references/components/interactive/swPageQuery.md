# 分页 (swPageQuery)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| pageIndex | number | 当前页码 |
| pageTotal | number | 总条数 |
| pageSize | number | 每页条数 |

## option 字段说明

### 基础配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| showJumper | boolean | true | 是否显示跳转 |
| pageSize | number | 10 | 每页条数 |
| textAlign | string | "center" | 文本对齐 |
| boxWidth | number | 30 | 分页按钮宽度 |
| boxHeight | number | 30 | 分页按钮高度 |
| borderRadius | number | 0 | 圆角 |
| margin | number | 3 | 间距 |

### 默认样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| defaultFontFamily | string | "Source Han Sans CN-..." | 默认字体族 |
| defaultFontSize | number | 12 | 默认字体大小 |
| defaultColor | string | "rgba(179,205,224,1)" | 默认字体颜色 |
| defaultFontStyle | string | "normal" | 默认字体样式 |
| defaultFontWeight | string | "normal" | 默认字体粗细 |
| defaultLetterSpacing | number | 0 | 默认字间距 |
| defaultLineHeight | number | 16 | 默认行高 |
| defaultBackgroundType | string | "color" | 默认背景类型 |
| defaultBackgroundColor | string | "rgba(144,172,201,0.15)" | 默认背景颜色 |
| defaultBackgroundColorOpacity | number | 100 | 默认背景颜色透明度 |
| defaultBorderWidth | number | 1 | 默认边框宽度 |
| defaultBorderColor | string | "rgba(144,171,201,0.45)" | 默认边框颜色 |

### 悬停样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| hoverFontFamily | string | "Source Han Sans CN-..." | 悬停字体族 |
| hoverFontSize | number | 12 | 悬停字体大小 |
| hoverColor | string | "rgba(230,247,255,1)" | 悬停字体颜色 |
| hoverBackgroundType | string | "color" | 悬停背景类型 |
| hoverBackgroundColor | string | "rgba(19,98,184,1)" | 悬停背景颜色 |
| hoverBorderWidth | number | 1 | 悬停边框宽度 |
| hoverBorderColor | string | "rgba(125,220,255,1)" | 悬停边框颜色 |

### 选中样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| checkedFontFamily | string | "Source Han Sans CN-..." | 选中字体族 |
| checkedFontSize | number | 12 | 选中字体大小 |
| checkedColor | string | "rgba(255,255,255,1)" | 选中字体颜色 |
| checkedBackgroundType | string | "color" | 选中背景类型 |
| checkedBackgroundColor | string | "rgba(144,172,201,1)" | 选中背景颜色 |
| checkedBorderWidth | number | 1 | 选中边框宽度 |
| checkedBorderColor | string | "rgba(160,169,184,0.3)" | 选中边框颜色 |
