# datav (datav)

**组件标识**: datav | **中文名**: datav | **分类**: 第三方

## 描述

DataV 第三方组件的通用容器，用于集成阿里 DataV 组件库中的各种可视化组件，如水位图、边框、装饰、飞线等。通过 is 属性指定要加载的 DataV 组件名称，通过 echartFormatter 代码函数动态生成组件的 config 或 option 配置对象。数据结构采用通用的 categories 和 series 格式，经过代码函数处理后传入 DataV 组件。

**核心功能**：
- 动态加载任意 DataV 组件（通过 is 属性指定组件名）
- 支持通过代码函数自定义配置输出
- 支持标准的 categories/series 数据格式
- 配置代码区域可自由处理数据和输出配置

**与其他第三方组件的区别**：
- 区别于 echartcommon（Echarts通用型）：本组件集成 DataV 组件库，输出 config 配置对象；echartcommon 集成 ECharts 图表库，输出 option 配置对象
- 区别于 custom-component（自定义组件）：本组件专注于 DataV 生态的组件集成，不支持自定义 Vue 代码
- 区别于 vue-part（Vue2片段）：本组件是配置驱动型的 DataV 组件，vue-part 是代码驱动型的 Vue2 片段

## 别名/同义词

datav DataV 数据可视化 阿里DataV 大屏组件 DataV组件 第三方组件 datav组件 水位图容器 datav容器

## 适用场景

使用DataV组件库 水位图 水球图 数字翻牌器 装饰边框 飞线地图 动态边框 DataV风格大屏 阿里云DataV效果 大屏装饰元素
