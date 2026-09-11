# 选项卡 (subtabs)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 标签名称 |
| value | string \| number | 标签值 |

## option 字段说明

### 布局配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| active | number | 1 | 激活的选项索引 |
| rows | number | 1 | 行数 |
| columns | number | 3 | 列数 |
| rowGap | number | 10 | 行间距 |
| columnGap | number | 4 | 列间距 |
| paddingTop | number | 0 | 上内边距 |
| paddingBottom | number | 0 | 下内边距 |
| paddingLeft | number | 0 | 左内边距 |
| paddingRight | number | 0 | 右内边距 |
| writingMode | string | "horizontal-tb" | 书写模式 |
| alignItems | string | "center" | 对齐方式 |
| textAlign | string | "center" | 文本对齐 |

### 播放与滚动
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| playVisible | boolean | false | 是否显示播放按钮 |
| playDelay | number | 10 | 播放延迟 |
| playDuration | number | 10 | 播放时长 |
| scrollVisible | boolean | false | 是否显示滚动条 |
| scrollGap | number | 10 | 滚动间距 |
| scrollTrack | string | "rgba(255,255,255,1)" | 滚动轨道颜色 |
| scrollSlide | string | "rgba(255,255,255,1)" | 滚动滑块颜色 |

### 交互配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| componentLink | boolean | true | 是否组件联动 |
| isCallback | boolean | true | 是否触发回调 |
| related | boolean | false | 是否关联 |
| isIsolated | boolean | false | 是否独立 |
| isCancelSelected | boolean | false | 是否可取消选中 |
| isHovered | boolean | false | 是否启用悬停效果 |

### 默认样式 (defaultObj)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontSize | number | 16 | 字体大小 |
| fontColor | string | "rgba(255,255,255,1)" | 字体颜色 |
| fontFamily | string | "sans-serif" | 字体族 |
| isBorder | boolean | true | 是否显示边框 |
| borderWidth | number | 2 | 边框宽度 |
| borderColor | string | "rgba(160,169,184,0.3)" | 边框颜色 |
| backgroundColor | string | "rgba(15,22,34,0.6)" | 背景颜色 |
| backgroundType | string | "color" | 背景类型 |
| isTextShadow | boolean | false | 是否显示文本阴影 |

### 激活样式 (activeObj)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontSize | number | 18 | 字体大小 |
| fontColor | string | "rgba(255,255,255,1)" | 字体颜色 |
| isBorder | boolean | true | 是否显示边框 |
| borderWidth | number | 3 | 边框宽度 |
| borderColor | string | "rgba(138,86,232,0.9)" | 边框颜色 |
| backgroundColor | string | "rgba(139,88,231,0.6)" | 背景颜色 |

### 悬停样式 (hoverObj)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fontSize | number | 16 | 字体大小 |
| fontColor | string | "rgba(255,255,255,1)" | 字体颜色 |
| isBorder | boolean | true | 是否显示边框 |
| borderWidth | number | 2 | 边框宽度 |
| borderColor | string | "rgba(138,86,232,0.9)" | 边框颜色 |
| backgroundColor | string | "rgba(139,88,231,0.6)" | 背景颜色 |

### 系列配置 (seriesTabsList)
数组，每项包含 name（系列名称）、activeObj、hoverObj、defaultObj，结构与上方样式配置相同。
