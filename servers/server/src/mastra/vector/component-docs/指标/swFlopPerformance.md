# 翻牌器v3 (swFlopPerformance)

**组件标识**: swFlopPerformance | **中文名**: 翻牌器v3 | **分类**: 指标

## 描述

以数字滚动翻转动画展示单个关键数值指标，为翻牌器系列的高性能版本。支持自动播放翻牌动画、千分位分组、小数位数控制、位数补齐等功能。与v2相比，v3新增文本对齐(textAlign)配置，移除了小数点大小(pointSize)、数字宽高(spanWidth/spanHeight)、数字间距(spanMangin)和递增总数(incrementTotal)字段，整体结构更简洁。数字部分支持边框和图片两种渲染模式，前缀和后缀文本可独立设置样式。

**与其他翻牌器的区别**：
- 区别于翻牌器v2（sw-countup-v2）：v3 没有 pointSize/spanWidth/spanHeight/spanMangin/incrementTotal，但有 textAlign 对齐配置
- v3 的默认类型为 img，v2 默认为 border

## 别名/同义词

翻牌器v3 性能翻牌器 高性能数字翻牌 滚动数字 计数器 数字动画 数值动画 flop performance

## 适用场景

实时数据展示 核心数值大屏 销售额指标 访客数统计 金额展示 KPI数值看板 订单数量 动态计数
