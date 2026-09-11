# vue2 片段 (vue-part)

**组件标识**: vue-part | **中文名**: vue2 片段 | **分类**: 第三方

## 描述

基于 Vue 2 Options API 的代码片段组件，允许用户通过编写模板（template）、脚本（js）和样式（css）三个部分的代码来创建自定义可视化组件。脚本部分以函数形式定义 Vue 组件选项，注入了组件 id、绑定数据 list、事件通信函数 emitEvent 和内置工具函数 defaultFun 等参数。支持通过 onClick 等方法触发自定义事件通信，实现组件间联动。

**核心功能**：
- 支持编写 Vue 2 模板代码定义 HTML 结构
- 支持编写 JavaScript 函数定义 Vue 组件逻辑（data、methods、computed、watch 等）
- 支持编写 CSS 样式定义组件外观
- 注入组件 id、绑定数据（list）、事件通信（emitEvent）、内置工具（cloneDeep、debounce、throttle）
- 支持自定义交互函数名（funName），用于事件通信标识
- 通过 emitEvent 触发 fireCustomCode 事件实现组件间通信

**与其他第三方组件的区别**：
- 区别于 custom-component（自定义组件）：本组件基于 Vue 2 Options API 的代码片段模式，以函数形式定义组件逻辑；custom-component 基于 Vue 3 Composition API，提供完整的多文件在线编辑器环境
- 区别于 echartcommon（Echarts通用型）：本组件可创建任意类型的 Vue 组件，不限于图表；echartcommon 专注于 ECharts 图表
- 区别于 datav：本组件使用 Vue 2 代码驱动，datav 使用 DataV 组件库配置驱动

## 别名/同义词

vue2片段 Vue片段 vue-part 自定义Vue片段 Vue代码片段 Vue2自定义 Vue2代码片段 片段组件 Vue2组件片段 代码片段自定义

## 适用场景

自定义交互逻辑 自定义数据展示 需要组件间事件通信的场景 自定义列表 自定义Tab切换 自定义按钮组 轻量级自定义开发 Vue2风格的自定义组件 不需要完整代码编辑器的简单定制
