# 线性渐变遮罩层 (ft-mask-layer)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| text | string | 文本内容 |

## option 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| linearGradient.markColor | string | "rgba(0,0,0,0.7)" | 渐变遮罩颜色 |
| linearGradient.markPosition | number | 180 | 渐变位置 |
| linearGradient.markRadius | number | 40 | 渐变半径 |
| linearGradient.markOpacity | number | 90 | 渐变透明度 |
| radioactiveGradation.markColor | string | "rgba(0,0,0,1)" | 径向遮罩颜色 |
| radioactiveGradation.markOpacityRadius | number | 40 | 透明区域半径 |
| radioactiveGradation.markOpacity | number | 100 | 中心透明度 |
| radioactiveGradation.markUnOpacityRadius | number | 90 | 不透明区域半径 |
| radioactiveGradation.showLengthWidthRatio | boolean | false | 是否显示长宽比 |
| radioactiveGradation.lengthWidthRatio | number | 0 | 长宽比值 |
| markType | string | "linearGradient" | 遮罩类型(linearGradient/radioactiveGradation) |
| pointerEvents | boolean | false | 是否响应鼠标事件 |
| refresh | boolean | false | 是否刷新 |
| backdropFilter | boolean | false | 是否启用背景滤镜 |
| backdropFilterBlur | number | 4 | 背景模糊度 |
| backdropFilterSaturate | number | 100 | 背景饱和度 |
