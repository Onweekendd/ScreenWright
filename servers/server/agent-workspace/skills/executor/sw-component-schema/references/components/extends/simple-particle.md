# 上升粒子 (simple-particle)

## dataChart 数据格式

无数据字段（data为空数组，效果通过option配置控制）

## option 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| size | number | 2 | 粒子大小 |
| number | number | 100 | 粒子数量 |
| direction | string | "top" | 运动方向(top/bottom/left/right) |
| speed | number | 5 | 运动速度 |
| colorList | array | [...] | 粒子颜色列表(name/color)，支持多色随机分配 |
