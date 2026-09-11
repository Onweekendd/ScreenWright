# 创建布局模板流程

## 可用工具

| 工具 | 用途 | 关键参数 | 返回结果 |
|------|------|----------|----------|
| `listLayoutTemplates(filter?)` | 列出所有可用布局模板 | `filter?: { theme?: string, scene?: string }` | 模板列表（含id、名称、主题、缩略图、描述） |
| `getLayoutTemplateDetail(id)` | 获取模板完整配置详情 | `id: string` | 模板结构配置（含id、名称、默认组件、主题变量） |
| `applyLayoutTemplate(id, options?)` | 将指定模板应用到目标大屏 | `id: string`, `options: string`（JSON格式） | 应用结果（成功/失败、生成的图层ID集合） |

## 参数格式说明

### applyLayoutTemplate 的 options 参数
```json
{
  "targetScreenId": "目标大屏ID"
}
```

## 操作流程

### Step 1: 解析用户需求

提取关键词：
- 布局主题：中国红、天空蓝、深海蓝、科技蓝、青绿
- 特殊要求：是否需要地图、是否需要动态面板、主题偏好

### Step 2: 列出可用模板

调用 `listLayoutTemplates()` 获取系统预置模板列表。

- 展示布局模板的id、名称以及描述

场景A：用户描述较模糊：

```typescript
// 展示所有分类的模板供用户选择
const templates = await listLayoutTemplates();
```

场景B：用户指定了布局主题：
 - 根据用户具体的描述，记录主题信息，即 `theme`

```typescript
const templates = await listLayoutTemplates({ theme: "中国红" });
```

### Step 3: 展示模板选项

向用户展示匹配的模板列表，包含：

- 模板名称、唯一 ID
- 缩略图（如可用）
- 简要功能描述

### Step 4: 获取模板详情

用户选择模板后，调用 `getLayoutTemplateDetail(id)` 获取完整配置

- 根据用户描述，从模板列表中选择符合模板中的 `id`
- 若无匹配模板时，返回相似模板列表供用户选择

```typescript
try {
  // 获取模板详情
  const templateDetail = await getLayoutTemplateDetail(`{id}`);
  // 可基于detail向用户展示布局结构预览
} catch (error) {
  // 错误处理：模板不存在/加载失败
  console.error("模板详情获取失败：", error);
  // 引导用户重新选择模板或刷新列表
}
```

### Step 5:  应用布局

将模板配置应用到目标数据大屏，需处理重复应用、配置覆盖等场景：

1. **应用前置校验**
  - 校验目标大屏是否已绑定其他布局模板
  - 校验模板配置与大屏分辨率的兼容性
  
2. **重复应用处理策略**
  若当前大屏已绑定布局模板，再次应用新模板时，需要根据用户意图处理：
  - 新增布局：用户明确要添加新布局（使用 applyLayoutTemplate）
  - 替换布局：用户明确要替换现有布局（应使用 updateLayoutTemplate）

3. **模板应用与持久化**
  调用 applyLayoutTemplate 执行模板应用，同时自动留存核心信息：
  - 必须传入正确的 options 参数格式
  - 记录应用成功的图层 ID 集合，为后续可能的替换操作做准备

```typescript
ttry {
  const result = await applyLayoutTemplate(`{id}`, {
    targetScreenId: `{screenId}`, // 目标大屏ID，必填
  });
  // 记录生成的图层ID，用于可能的后续替换
  const generatedLayerIds = result.generatedLayerIds;
} catch (error) {
  // 处理应用失败场景：如模板不兼容、权限不足
  console.error("模板应用失败：", error);
}
```

## 多场景决策

| 场景 | 操作策略 |
|------|------|
| 用户描述模糊 | 列出所有分类的模板供选择，询问场景和偏好 |
| 用户指定主题 | 用 listLayoutTemplates({ theme }) 筛选后推荐 |
| 基于现有布局修改 | 	读取当前布局 → 分析结构 → 按需调整 |
| 用户想浏览模板 | 调用 listLayoutTemplates() 展示所有选项 |
| 用户指定模板ID | 直接 getLayoutTemplateDetail(id) 获取并应用 |
| 模板无匹配结果 | 返回 3-5 个相似场景 / 主题的模板作为备选，或引导用户提交自定义布局需求 |
