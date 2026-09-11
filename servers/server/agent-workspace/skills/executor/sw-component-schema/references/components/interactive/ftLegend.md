# 图例 (ftLegend)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 选项名称 |
| value | string \| number | 选项值 |
| isChecked | boolean | 是否选中（可选） |
| children | array | 子类列表（可选） |
| children[].label | string | 子类名称 |
| children[].value | string \| number | 子类值 |
| children[].isChecked | boolean | 子类是否选中（可选） |

## option 字段说明

### 复选框样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| checkboxPaddingTop | number | 0 | 复选框上内边距 |
| checkboxPaddingBottom | number | 0 | 复选框下内边距 |
| checkboxPaddingLeft | number | 0 | 复选框左内边距 |
| checkboxPaddingRight | number | 0 | 复选框右内边距 |
| checkboxWidth | number | 14 | 复选框宽度 |
| checkboxHeight | number | 14 | 复选框高度 |
| checkboxBorderColor | string | "rgba(59,244,255,1)" | 复选框边框颜色 |
| checkboxBackgroundColor | string | "rgba(0,17,52,0.8)" | 复选框背景颜色 |
| checkboxBorderColorIsChecked | string | "rgba(59,244,255,1)" | 选中时边框颜色 |
| checkboxBackgroundColorIsChecked | string | "rgba(59,244,255,1)" | 选中时背景颜色 |
| checkboxCheckPositionX | number | 4 | 勾选标记X位置 |
| checkboxCheckPositionY | number | 1 | 勾选标记Y位置 |
| checkboxCheckColor | string | "rgba(0,17,52,0.8)" | 勾选标记颜色 |

### 标签默认样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| labelFontFamily | string | "Source Han Sans CN-..." | 标签字体族 |
| labelFontSize | number | 14 | 标签字体大小 |
| labelColor | string | "rgba(255,255,255,1)" | 标签字体颜色 |
| labelFontWeight | string | "normal" | 标签字体粗细 |
| labelFontStyle | string | "normal" | 标签字体样式 |
| labelLetterSpacing | number | 0 | 标签字间距 |

### 标签选中样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| labelFontFamilyIsChecked | string | "Source Han Sans CN-..." | 选中时字体族 |
| labelFontSizeIsChecked | number | 14 | 选中时字体大小 |
| labelColorIsChecked | string | "rgba(255,255,255,1)" | 选中时字体颜色 |
| labelFontWeightIsChecked | string | "normal" | 选中时字体粗细 |
| labelFontStyleIsChecked | string | "normal" | 选中时字体样式 |
| labelLetterSpacingIsChecked | number | 0 | 选中时字间距 |

### 背景配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| backgroundBackgroundType | string | "color" | 背景类型 |
| backgroundBackgroundColor | string | "rgba(0,17,52,0.8)" | 背景颜色 |
| backgroundBackgroundImage | string | "" | 背景图片 |
| backgroundBorderColor | string | "rgba(24,56,121,1)" | 背景边框颜色 |
| backgroundBorderRadius | number | 10 | 背景边框圆角 |
