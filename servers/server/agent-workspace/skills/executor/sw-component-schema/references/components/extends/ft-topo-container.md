# 拓扑容器 (ft-topo-container)

## dataChart 数据格式

无数据字段（data为空数组，拓扑数据通过option.topoData管理）

## option 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| topoBgType | string | "color" | 拓扑背景类型(color/image) |
| topoBgColor | string | "rgba(35,38,48,0)" | 拓扑背景颜色 |
| topoBgImage | string | "" | 拓扑背景图片路径 |
| topoData.nodes | array | [] | 拓扑节点列表 |
| topoData.edges | array | [] | 拓扑边列表 |
| perspective | number | 0 | 透视距离 |
| originX | number | 50 | 变换原点X坐标(百分比) |
| originY | number | 50 | 变换原点Y坐标(百分比) |
| rotateX | number | 0 | X轴旋转角度 |
| rotateY | number | 0 | Y轴旋转角度 |
| rotateZ | number | 0 | Z轴旋转角度 |
| skewX | number | 0 | X轴倾斜角度 |
| skewY | number | 0 | Y轴倾斜角度 |
| scaleX | number | 100 | X轴缩放比例 |
| scaleY | number | 100 | Y轴缩放比例 |
| translateX | number | 0 | X轴平移距离 |
| translateY | number | 0 | Y轴平移距离 |
| translateZ | number | 0 | Z轴平移距离 |
| originGrid.left | string | "center" | 水平对齐方式 |
| originGrid.top | string | "center" | 垂直对齐方式 |
