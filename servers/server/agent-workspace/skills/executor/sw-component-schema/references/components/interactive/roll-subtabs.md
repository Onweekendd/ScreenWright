# 滚动选项卡 (roll-subtabs)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 标签名称 |
| value | string \| number | 标签值 |

## option 字段说明

### 布局配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| active | string | "1" | 激活的选项 |
| rows | number | 1 | 行数 |
| columns | number | 3 | 列数 |
| rowGap | number | 1 | 行间距 |
| columnGap | number | 4 | 列间距 |
| writingMode | string | "horizontal-tb" | 书写模式 |
| alignItems | string | "center" | 对齐方式 |
| textAlign | string | "center" | 文本对齐 |

### 滚动与箭头
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| direction | string | "horizontal" | 滚动方向 |
| directionNum | number | 3 | 方向数量 |
| setGridLength | boolean | true | 是否设置网格长度 |
| arrowShow | boolean | true | 是否显示箭头 |
| arrowWidth | number | 72 | 箭头宽度 |
| arrowHeight | number | 72 | 箭头高度 |
| imgLeft | string | "imgLeft.png" | 左箭头图片 |
| imgRight | string | "imgRight.png" | 右箭头图片 |

### 交互配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| componentLink | boolean | true | 是否组件联动 |
| isCallback | boolean | true | 是否触发回调 |
| related | boolean | false | 是否关联 |
| isCancelSelected | boolean | false | 是否可取消选中 |
| isHovered | boolean | false | 是否启用悬停效果 |

### 默认样式 (defaultObj)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontSize | number | 16 | 字体大小 |
| fontColor | string | "rgba(255,255,255,1)" | 字体颜色 |
| isBorder | boolean | true | 是否显示边框 |
| borderWidth | number | 2 | 边框宽度 |
| borderColor | string | "rgba(160,169,184,0.3)" | 边框颜色 |
| backgroundColor | string | "rgba(15,22,34,0.6)" | 背景颜色 |

### 激活样式 (activeObj)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontSize | number | 18 | 字体大小 |
| fontColor | string | "rgba(255,255,255,1)" | 字体颜色 |
| isBorder | boolean | true | 是否显示边框 |
| borderColor | string | "rgba(138,86,232,0.9)" | 边框颜色 |
| backgroundColor | string | "rgba(139,88,231,0.6)" | 背景颜色 |
| isTextShadow | boolean | true | 是否显示文本阴影 |

### 悬停样式 (hoverObj)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontSize | number | 16 | 字体大小 |
| fontColor | string | "rgba(255,255,255,1)" | 字体颜色 |
| isBorder | boolean | true | 是否显示边框 |
| borderColor | string | "rgba(138,86,232,0.9)" | 边框颜色 |
| backgroundColor | string | "rgba(139,88,231,0.6)" | 背景颜色 |
