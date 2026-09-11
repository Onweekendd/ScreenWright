# Echarts通用型 (echartcommon)

**组件标识**: echartcommon | **中文名**: Echarts通用型 | **分类**: 第三方

## 描述

ECharts 图表的万能配置组件，允许用户通过编写 JavaScript 代码函数动态生成完整的 ECharts option 配置对象。不受预定义图表类型的限制，可自由组合 ECharts 的所有功能，包括混合图表、自定义系列、多轴联动、渐变色、数据区域缩放等高级特性。数据结构采用通用的 categories 和 series 格式，经过代码函数处理后可灵活映射到任意 ECharts 配置中。

**核心功能**：
- 通过代码函数自由输出任意 ECharts option 配置
- 支持混合图表（柱状图+折线图等组合）
- 支持完整的 ECharts API，包括渐变色、自定义系列等
- 支持标准的 categories/series 数据格式作为输入
- 配置代码可自由处理数据和生成图表配置

**与其他第三方组件的区别**：
- 区别于 datav：本组件集成 ECharts 图表库，输出 option 配置对象；datav 集成 DataV 组件库
- 区别于自定义图表组件（如 echartbar、echartline 等）：本组件是通用型，完全由代码控制配置；其他组件是预设类型，通过配置面板参数生成图表
- 区别于 custom-component（自定义组件）：本组件专注于 ECharts 图表渲染，不支持自定义 Vue 组件

## 别名/同义词

Echarts通用 ECharts通用型 echarts通用 自定义echarts 自定义图表 通用图表 echarts代码配置 混合图表 ECharts万能 自定义ECharts配置

## 适用场景

需要ECharts高级特性的图表 混合图表 多轴图表 自定义系列 复杂组合图表 超出标准图表组件能力的需求 需要精确控制ECharts配置的场景 柱线混合 渐变色图表 双Y轴图表
