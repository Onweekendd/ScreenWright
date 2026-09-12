# 下拉框 (swCustomSelect)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 选项标签 |
| value | string \| number | 选项值 |
| disabled | boolean | 是否禁用（可选） |
| select | boolean | 是否选中（可选） |

## option 字段说明

### 基础配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| defaultIndex | number | 1 | 默认选中索引 |
| related | boolean | false | 是否关联 |
| placeholder | string | "请选择" | 占位文本 |
| indent | number | 20 | 缩进 |

### 选择框样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| boxHeight | number | 16 | 选择框高度 |
| boxFontSize | number | 16 | 选择框字体大小 |
| boxFontFamily | string | "SourceHanSansCN-..." | 选择框字体族 |
| boxlineHeight | number | 72 | 选择框行高 |
| boxBackgroundType | string | "color" | 选择框背景类型 |
| boxBackground | string | "rgba(25,30,40,1)" | 选择框背景颜色 |
| boxColor | string | "rgba(255,255,255,1)" | 选择框字体颜色 |
| boxLetterSpacing | number | 0 | 选择框字间距 |
| boxTextAlign | string | "center" | 选择框文本对齐 |
| boxBorderColor | string | "rgba(0,0,0,0)" | 选择框边框颜色 |
| boxBorderWidth | number | 2 | 选择框边框宽度 |
| boxRadius | number | 0 | 选择框圆角 |

### 下拉菜单配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| dropDownIcon | string | "" | 下拉图标 |
| dropDownIconSize | number | 16 | 下拉图标大小 |
| dropDownHeight | number | 164 | 下拉区域高度 |
| contentColor | string | "rgba(255,255,255,1)" | 内容颜色 |
| topOffset | number | 2 | 顶部偏移 |
| dropDownPosition | string | "bottom" | 下拉位置 |
| dropdownBackgroundColor | string | "#2d2f38" | 下拉菜单背景颜色 |
| scrollBarWidth | number | 2 | 滚动条宽度 |
| rightMargin | number | 30 | 右边距 |

### 选项样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| optionHeight | number | 46 | 选项高度 |
| optionIndent | number | 12 | 选项缩进 |
| optionSpace | number | 2 | 选项间距 |
| defaultHeight | number | 42 | 默认高度 |
| defaultFontSize | number | 16 | 默认字体大小 |
| defaultColor | string | "rgba(66,231,251,1)" | 默认字体颜色 |
| defaultBackgroundType | string | "color" | 默认背景类型 |
| defaultBackground | string | "rgba(0,0,0,0.2)" | 默认背景颜色 |

### 悬停样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| hoverFontSize | number | 16 | 悬停字体大小 |
| hoverColor | string | "rgba(255,255,255,1)" | 悬停字体颜色 |
| hoverBackgroundType | string | "color" | 悬停背景类型 |
| hoverBackground | string | "rgba(255,255,255,0)" | 悬停背景颜色 |
| hoverHeight | number | 16 | 悬停高度 |
