# 点状时间轴 (pointTimeline)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| text | string | 标题（时间点） |
| value | string | 文本内容（描述） |

## option 字段说明

### 全局配置 (globalConfig)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| defaultExpansion | boolean | false | 是否默认展开 |
| crossDisplay | boolean | false | 是否交叉显示 |
| initMargin | number | 30 | 初始边距 |
| shaftMargin | number | 180 | 轴线边距 |
| centralAxisMargin | number | 100 | 中轴边距 |
| defaultSelected | number | 1 | 默认选中索引 |
| axisColor | string | "rgba(186,231,255,0.3)" | 轴线颜色 |
| axisWidth | number | 2 | 轴线宽度 |
| arrangementDirection | string | "row" | 排列方向 |

### 时间线配置 (timeLineConfig)

#### 默认节点样式 (defaultObj)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| axialPointImgSrc | string | "defaultPoint.png" | 节点图片 |
| axialPointWidth | number | 20 | 节点宽度 |
| axialPointHeight | number | 20 | 节点高度 |
| axialSpindleTextFontSize | number | 12 | 轴标签字体大小 |
| axialSpindleTextColor | string | "rgba(230,247,255,0.5)" | 轴标签字体颜色 |
| axialTitleTextFontSize | number | 16 | 标题字体大小 |
| axialTitleTextColor | string | "rgba(230,247,255,0.5)" | 标题字体颜色 |
| axialTitleWidth | number | 250 | 标题宽度 |

#### 激活节点样式 (activeObj)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| axialPointImgSrc | string | "currentPoint.png" | 激活节点图片 |
| axialPointWidth | number | 55 | 激活节点宽度 |
| axialPointHeight | number | 55 | 激活节点高度 |
| axialSpindleTextFontSize | number | 14 | 激活轴标签字体大小 |
| axialSpindleTextColor | string | "rgba(0,245,255,1)" | 激活轴标签字体颜色 |
| axialTitleTextFontSize | number | 16 | 激活标题字体大小 |
| axialTitleTextColor | string | "rgba(0,245,255,1)" | 激活标题字体颜色 |

### 动画配置 (animationConfig)
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| loop | boolean | true | 是否循环播放 |
| loopInterval | number | 4 | 循环间隔（秒） |
| animateTranstion | number | 2 | 动画过渡时间（秒） |
