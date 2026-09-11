# 多选框 (formCheckbox)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 选项名称 |
| value | string \| number | 选项值 |
| isChecked | boolean | 是否选中（可选） |
| disabled | boolean | 是否禁用（可选） |

## option 字段说明

### 基础配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| disabled | boolean | false | 是否禁用 |
| paddingTop | number | 0 | 上内边距 |
| paddingLeft | number | 0 | 左内边距 |
| textColor | string | "rgba(255, 255, 255, 1)" | 文本颜色 |
| fillColor | string | "rgba(36,175,255,1.00)" | 选中填充颜色 |
| min | number | 0 | 最小可选数 |
| max | number | 5 | 最大可选数 |

### 复选框尺寸
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| sizeX | number | 20 | 复选框宽度 |
| sizeY | number | 20 | 复选框高度 |

### 字体配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontColor | string | "rgba(255, 255, 255, 1)" | 字体颜色 |
| fontSize | number | 16 | 字体大小 |
| letterSpacing | number | 0 | 字间距 |
| fontWeight | boolean | false | 字体加粗 |
| fontFamily | string | "sans-serif" | 字体族 |
| fontStyle | boolean | false | 字体斜体 |
| textTranslateX | number | 0 | 文本X偏移 |
| textTranslateY | number | 0 | 文本Y偏移 |
| isTextShadow | boolean | false | 是否显示文本阴影 |
| textShadow | object | {...} | 文本阴影配置 |
