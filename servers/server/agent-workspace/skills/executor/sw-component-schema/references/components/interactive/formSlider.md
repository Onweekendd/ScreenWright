# 滑块 (formSlider)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 名称 |
| value | number | 数值 |

## option 字段说明

### 基础配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| size | number | 10 | 滑块轨道大小 |
| min | number | 0 | 最小值 |
| max | number | 100 | 最大值 |
| step | number | 1 | 步长 |
| changeType | string | "1" | 变化类型 |
| vertical | boolean | false | 是否垂直方向 |
| disabled | boolean | false | 是否禁用 |
| range | boolean | false | 是否范围选择 |
| paddingTop | number | 0 | 上内边距 |
| paddingLeft | number | 0 | 左内边距 |

### 显示配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| showLabel | boolean | true | 是否显示标签 |
| showValue | boolean | true | 是否显示数值 |
| showStops | boolean | false | 是否显示间断点 |
| backgroundImage | string | "" | 背景图片 |
| backgroundSize | string | "100% 100%" | 背景图片大小 |

### 滑块按钮配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| pointSize | number | 20 | 滑块按钮大小 |
| pointColor | string | "rgba(229,229,229,1)" | 滑块按钮颜色 |
| pointBorderColor | string | "rgba(36,175,255,1)" | 滑块按钮边框颜色 |
| pointType | string | "color" | 滑块按钮类型 |
| pointImage | string | "" | 滑块按钮图片 |

### 轨道配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| activeColor | string | "rgba(36,175,255,1)" | 激活颜色 |
| defaultColor | string | "rgba(63,72,94,1)" | 默认颜色 |
| seriesBgColor | string | "linear-gradient(...)" | 轨道背景色 |
| seriesOpacity | number | 100 | 轨道透明度 |
| highlightArea | string | "all" | 高亮区域 |
| borderRadius | number | 3 | 轨道圆角 |

### 字体配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontColor | string | "rgba(255,255,255,1)" | 字体颜色 |
| fontSize | number | 16 | 字体大小 |
| letterSpacing | number | 0 | 字间距 |
| fontWeight | boolean | false | 字体加粗 |
| fontFamily | string | "sans-serif" | 字体族 |
| fontStyle | boolean | false | 字体斜体 |
| textTranslateX | number | 0 | 文本X偏移 |
| textTranslateY | number | 0 | 文本Y偏移 |
| isTextShadow | boolean | false | 是否显示文本阴影 |
| fontPaddingTop | number | 10 | 字体上内边距 |
| fontPaddingLeft | number | 10 | 字体左内边距 |
