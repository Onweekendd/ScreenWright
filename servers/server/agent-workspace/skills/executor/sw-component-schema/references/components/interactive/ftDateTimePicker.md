# 时间范围选择器 (ftDateTimePicker)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| startTime | string | 开始时间 |
| endTime | string | 结束时间 |

## option 字段说明

### 基础配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | string | "datetimerange" | 选择器类型 |
| dateFormat | string | "yyyy-MM-dd" | 日期格式 |
| timeFormat | string | "" | 时间格式 |
| startTime | string | "" | 默认开始时间 |
| endTime | string | "" | 默认结束时间 |
| textAlign | string | "center" | 文本对齐 |
| rangeSeparator | string | "：" | 范围分隔符 |

### 字体配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontFamily | string | "Source Han Sans CN-..." | 字体族 |
| fontSize | number | 16 | 字体大小 |
| color | string | "rgba(255,255,255,1)" | 字体颜色 |
| fontStyle | string | "normal" | 字体样式 |
| fontWeight | string | "normal" | 字体粗细 |
| letterSpacing | number | 0 | 字间距 |
| lineHeight | number | 24 | 行高 |

### 背景与边框
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| backgroundType | string | "color" | 背景类型 |
| backgroundColor | string | "rgba(0,0,0,1)" | 背景颜色 |
| backgroundColorOpacity | number | 0.6 | 背景颜色透明度 |
| backgroundImageType | string | "100% 100%" | 背景图片类型 |
| backgroundImage | string | "" | 背景图片 |
| borderColor | string | "rgba(158,158,158,1)" | 边框颜色 |
| borderWidth | number | 1 | 边框宽度 |
| borderRadius | number | 0 | 边框圆角 |

### 日历配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| calendarShow | boolean | true | 是否显示日历 |
| calendarPosition | string | "bottom" | 日历位置 |
| spacing | number | 5 | 间距 |
| calendarHeight | number | 400 | 日历高度 |
| calendarBackgroundColor | string | "rgba(0,0,0,1)" | 日历背景颜色 |
| calendarFontFamily | string | "Source Han Sans CN-..." | 日历字体族 |
| calendarFontSize | string | "16" | 日历字体大小 |
| calendarColor | string | "rgba(255,255,255,1)" | 日历字体颜色 |

### 按钮与装饰
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| lineDecorativeColor | string | "rgba(255,255,255,1)" | 线条装饰颜色 |
| buttonFontFamily | string | "Source Han Sans CN-..." | 按钮字体族 |
| buttonFontSize | string | "16" | 按钮字体大小 |
| buttonColor | string | "rgba(255,255,255,1)" | 按钮字体颜色 |
