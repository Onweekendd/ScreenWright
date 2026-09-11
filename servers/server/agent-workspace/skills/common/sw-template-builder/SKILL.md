---
name: sw-template-builder
description: >
  FunBI 低代码大屏布局模板生成指南，供 agentBI 根据用户自然语言自动完成大屏布局模板生成。
  触发场景：当用户需要创建大屏布局、基于场景生成布局模板、后修改布局模板时触发。
  涵盖：布局模板列表查询、组件推荐等。
---

# FunBI 布局模板生成

## 核心功能

根据用户自然语言描述，自动生成 FunBI 大屏的布局模板配置，包括：
- 页面整体布局结构（网格、分层、分区）
- 各区域组件类型推荐
- 样式配置（尺寸、位置、主题）
- 数据源绑定建议

## 触发场景

当用户提出以下类型需求时触发：

1. **整体布局创建**
   - "帮我创建一个中国红布局的大屏"
   - "生成一个顶部标题、中间地图、两侧图表的布局"
   - "需要一个左侧数据列表、右侧详情面板的布局"

2. **模板浏览与选择**
   - "有哪些可用的布局模板？"
   - "列出所有科技蓝的大屏布局模板"
   - "中国红和天空蓝个列出一个大屏布局模板"

3. **模板替换与更新**
   - "替换为科技蓝的布局大屏"
   - "更新为一个同类型主题的布局"
   - "需要把当前的布局换成中国红"

## 核心数据结构

### 布局模板对象
```typescript
// 区域定义
interface Region {
  name: string,                  // 区域名称：header | left | center | right | footer
  position: {
    x: number,                   // X坐标
    y: number,                   // Y坐标
    width: number,               // 宽度
    height: number               // 高度
  },
  suggestedComponents: string[]  // 推荐组件类型列表
}

{
  id: number,                    // 模板唯一ID，如 1818
  name: string,                  // 模板名称
  groupId: string,               // 模板分类ID
  layerId: string,               // 组件集合，如 "[2828110, 2828111, 2828112]"
  scene: string,                 // 场景：monitor | traffic | energy | general
  theme: string,                 // 主题：中国红 | 天空蓝 | 深海蓝 | 科技蓝 | 青绿
  description: string,           // 模板描述
  coverUrl: string,              // 缩略图URL
  structure: {
    root: {
      width: number,             // 画布宽度
      height: number             // 画布高度
    },
    regions: Region[]            // 区域列表
  }
}
```

## 布局模板主题分类

| 主题 | 适用行业 | 典型组件 |
|------|------|----------|
| 中国红 | 通用场景 | - |
| 天空蓝 | 通用场景 | - |
| 深海蓝 | 通用场景 | - |
| 科技蓝 | 通用场景 | - |
| 青绿 | 通用场景 | - |

## 可用工具

| 工具 | 用途 | 关键参数 | 返回结果 |
|------|------|----------|----------|
| `listLayoutTemplates(filter?)` | 列出所有可用布局模板 | `filter?: { theme?: string }` | 	模板列表（含id、名称、主题、缩略图、描述） |
| `getLayoutTemplateDetail(id)` | 获取模板完整配置详情 | `id: string`, `version?: string` | 模板结构配置（含id、名称、默认组件、主题变量） |
| `applyLayoutTemplate(id, options?)` | 将指定模板应用到目标大屏（新增） | `id: string`, `options?: { targetScreenId: number }` | 应用结果（成功/失败、生成的图层ID集合） |
| `updateLayoutTemplate(id, options)` | 将更新后的模板应用到目标大屏（替换） | `id: string`, `options: { targetScreenId: string, generateLayerIds: string } }` | 更新结果（成功/失败、新生成的图层ID集合） |

## 工具参数详解

### applyLayoutTemplate 参数详解
```typescript
applyLayoutTemplate({
  id: "模板ID",
  options: JSON.stringify({
    targetScreenId: "目标大屏ID"  // 必填
  })
})
```

### updateLayoutTemplate 参数详解
```typescript
updateLayoutTemplate({
  id: "新模板ID",
  options: JSON.stringify({
    targetScreenId: "目标大屏ID",  // 必填
    generateLayerIds: ["原图层ID1", "原图层ID2", ...]  // 必填，要替换的图层ID数组
  })
})
```

## 重要区别

| 特性 | applyLayoutTemplate | updateLayoutTemplate |
| 功能 | 新增模板图层 | 替换模板图层 |
| 图层处理 | 在画布上添加新组件 | 删除旧图层，创建新图层 |
| 参数要求 | 只需要targetScreenId | 需要targetScreenId和generateLayerIds |
| 使用场景 | 首次应用模板、添加新布局 | 替换现有模板、主题切换 |
| 结果 | 画布上图层数量增加 | 画布上图层数量可能变化 |


## 操作目录

| 操作 | 参考文件 |
|------|------|
| 创建布局模板 | [references/layout-create.md](references/layout-create.md) |
| 更新布局模板 | [references/layout-update.md](references/layout-update.md) |
