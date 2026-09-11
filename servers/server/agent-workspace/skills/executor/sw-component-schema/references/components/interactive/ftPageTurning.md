# 翻页 (ftPageTurning)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| pageIndex | number | 当前页码 |
| pageTotal | number | 总页数 |
| textPage | string[] | 文本数据集（可选） |

## option 字段说明

### 基础配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| isText | boolean | false | 是否显示文本 |
| isLoop | boolean | false | 是否循环翻页 |
| isPlay | boolean | false | 是否自动播放 |
| intervalTime | number | 5 | 自动播放间隔（秒） |
| letterSpacing | number | 0 | 字间距 |
| split | number | 5 | 分隔距离 |

### 页码字体配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontFamily | string | "Source Han Sans CN-..." | 字体族 |
| fontSize | number | 26 | 字体大小 |
| color | string | "rgba(255,255,255,1)" | 字体颜色 |
| fontWeight | string | "normal" | 字体粗细 |
| fontStyle | string | "normal" | 字体样式 |

### 总页数字体配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontFamilyTotal | string | "Source Han Sans CN-..." | 总页数字体族 |
| fontSizeTotal | number | 26 | 总页数字体大小 |
| colorTotal | string | "rgba(255,255,255,1)" | 总页数字体颜色 |
| fontWeightTotal | string | "normal" | 总页数字体粗细 |
| fontStyleTotal | string | "normal" | 总页数字体样式 |

### 分隔线字体配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontFamilyLine | string | "Source Han Sans CN-..." | 分隔线字体族 |
| fontSizeLine | number | 26 | 分隔线字体大小 |
| colorLine | string | "rgba(255,255,255,1)" | 分隔线字体颜色 |

### 阴影与按钮配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| shadowShow | boolean | false | 是否显示阴影 |
| shadowColor | string | "rgba(255,255,255,1)" | 阴影颜色 |
| shadowX | number | 0 | 阴影X偏移 |
| shadowY | number | 0 | 阴影Y偏移 |
| shadowFuzzy | number | 8 | 阴影模糊 |
| shadowExtension | number | 0 | 阴影扩展 |
| backgroundImage | string | "Arrow.png" | 翻页按钮背景图片 |
| buttonWidth | number | 50 | 翻页按钮宽度 |
| buttonHeight | number | 25 | 翻页按钮高度 |
