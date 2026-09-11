# 开关 (formSwitch)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 名称 |
| value | boolean | 开关状态（true开/false关） |

## option 字段说明

### 基础配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | string | "default" | 开关类型 |
| disabled | boolean | false | 是否禁用 |
| paddingTop | number | 0 | 上内边距 |
| paddingLeft | number | 0 | 左内边距 |
| pointSize | number | 50 | 开关按钮大小 |
| pointColor | string | "#2898ff" | 开关按钮激活颜色 |
| pointColor2 | string | "#3b445a" | 开关按钮未激活颜色 |

### 文本配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| activeText | string | "打开" | 激活状态文本 |
| inactiveText | string | "关闭" | 未激活状态文本 |

### 颜色与图片配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| activeColor | string | "#0c0c13" | 激活状态背景颜色 |
| inactiveColor | string | "#0c0c13" | 未激活状态背景颜色 |
| activeIcon | string | "..." | 激活状态图标路径 |
| inactiveIcon | string | "..." | 未激活状态图标路径 |
| activeImage | string | "..." | 激活状态图片路径 |
| inactiveImage | string | "..." | 未激活状态图片路径 |
| backgroundImage | string | "" | 背景图片 |
| backgroundSize | string | "100% 100%" | 背景图片大小 |

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
