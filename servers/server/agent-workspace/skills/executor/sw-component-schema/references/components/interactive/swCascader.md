# 多级下拉框 (swCascader)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| value | string | 选项值 |
| label | string | 选项标签 |
| disabled | boolean | 是否禁用（可选） |
| children | array | 子级选项（递归嵌套，可选） |

children 为递归结构，与父级字段相同。

## option 字段说明

### 基础配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| defaultIndex | number | 0 | 默认选中索引 |
| placeholder | string | "请选择" | 占位文本 |
| textAlign | string | "center" | 文本对齐方式 |
| backgroundType | string | "custom" | 背景类型 |
| backgroundImage | string | "..." | 背景图片 |
| backgroundColor | string | "rgba(255,255,255,0)" | 背景颜色 |
| borderColor | string | "rgba(0,0,0,0)" | 边框颜色 |
| borderWidth | number | 0 | 边框宽度 |
| borderRadius | number | 0 | 边框圆角 |

### 字体配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| color | string | "rgba(255,255,255,1)" | 字体颜色 |
| fontFamily | string | "SourceHanSansCN-..." | 字体族 |
| fontSize | number | 20 | 字体大小 |
| fontWeight | string | "normal" | 字体粗细 |
| fontStyle | string | "normal" | 字体样式 |
| lineHeight | number | 12 | 行高 |
| letterSpacing | number | 1 | 字间距 |

### 下拉菜单配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| dropDownIcon | string | "" | 下拉图标 |
| dropDownIconSize | number | 16 | 下拉图标大小 |
| dropdownBackgroundColor | string | "rgba(2,19,51,0.95)" | 下拉菜单背景颜色 |
| dropdownMaxHeight | number | 108 | 下拉菜单最大高度 |
| dropdownMarginTop | number | 12 | 下拉菜单上边距 |
| scrollBarWidth | number | 6 | 滚动条宽度 |
| scrollBackgroundColor | string | "rgba(255,255,255,0)" | 滚动背景颜色 |
| scrollBarColor | string | "rgba(144,147,153,0.3)" | 滚动条颜色 |

### 菜单默认样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| menuHeight | number | 34 | 菜单项高度 |
| menuMarginLeft | number | 20 | 菜单项左边距 |
| menuMarginTop | number | 0 | 菜单项上边距 |
| menuDefaultFontFamily | string | "SourceHanSansCN-..." | 菜单默认字体族 |
| menuDefaultFontSize | number | 14 | 菜单默认字体大小 |
| menuDefaultColor | string | "rgba(180,183,193,1)" | 菜单默认字体颜色 |
| menuDefaultBackgroundType | string | "color" | 菜单默认背景类型 |
| menuDefaultBackgroundColor | string | "rgba(0,0,0,0.2)" | 菜单默认背景颜色 |

### 菜单悬停样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| menuHoverFontFamily | string | "SourceHanSansCN-..." | 菜单悬停字体族 |
| menuHoverFontSize | number | 14 | 菜单悬停字体大小 |
| menuHoverColor | string | "rgba(255,255,255,1)" | 菜单悬停字体颜色 |
| menuHoverBackgroundType | string | "custom" | 菜单悬停背景类型 |
| menuHoverBackgroundColor | string | "rgba(255,255,255,0)" | 菜单悬停背景颜色 |
