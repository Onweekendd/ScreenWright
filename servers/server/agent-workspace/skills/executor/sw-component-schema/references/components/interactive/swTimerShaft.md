# 时间轴 (swTimerShaft)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string \| number | 年份/时间标签 |
| value | string \| number | 时间值 |

## option 字段说明

### 基础配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| active | number | 1 | 默认激活索引 |
| size | number | 4 | 可见节点数量 |
| autoPlay | boolean | false | 是否自动播放 |
| loop | boolean | false | 是否循环播放 |
| isPrewrap | boolean | false | 是否预包裹 |
| interval | number | 5 | 自动播放间隔（秒） |

### 箭头与图标
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| iconSize | number | 24 | 图标大小 |
| iconLeft | number | 0 | 图标左边距 |
| arrowLeft | number | 26 | 左箭头大小 |
| arrowRight | number | 26 | 右箭头大小 |
| margin | number | 50 | 节点间距 |

### 轴线配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| lineColor | string | "rgba(21,129,131,1)" | 轴线颜色 |
| lineHeight | number | 1 | 轴线高度 |

### 默认节点样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| defaultObj.fontSize | number | 16 | 默认字体大小 |
| defaultObj.fontColor | string | "#00fced" | 默认字体颜色 |
| defaultObj.cursorSize | number | 6 | 默认游标大小 |
| defaultObj.cursorColor | string | "rgba(0,252,237,1)" | 默认游标颜色 |
| defaultObj.isBorder | boolean | true | 默认是否显示边框 |
| defaultObj.borderColor | string | "rgba(160,169,184,0.3)" | 默认边框颜色 |
| defaultObj.backgroundColor | string | "rgba(15,22,34,0.6)" | 默认背景颜色 |
| defaultObj.isTextShadow | boolean | true | 默认是否显示文本阴影 |

### 激活节点样式
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| activeObj.fontSize | number | 16 | 激活字体大小 |
| activeObj.fontColor | string | "#fde44c" | 激活字体颜色 |
| activeObj.cursorSize | number | 10 | 激活游标大小 |
| activeObj.cursorColor | string | "rgba(255,255,255,1)" | 激活游标颜色 |
| activeObj.isBorder | boolean | true | 激活是否显示边框 |
| activeObj.borderColor | string | "rgba(245,195,74,1)" | 激活边框颜色 |
| activeObj.isTextShadow | boolean | true | 激活是否显示文本阴影 |
