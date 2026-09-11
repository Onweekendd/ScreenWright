# 更新布局模板流程

# 前置条件
- 目标大屏已成功绑定布局模板（需留存模板ID、版本号等绑定信息）
- 已记录原模板生成的图层ID集合（为 `generateLayerIds` 参数做准备）

## 可用工具

| 工具 | 用途 | 关键参数 | 返回结果 |
|------|------|----------|----------|
| `listLayoutTemplates(filter?)` | 列出可用模板（含新版本/同主题模板） | `filter?: { theme?: string }` | 模板列表（含版本号、更新时间） |
| `getLayoutTemplateDetail(id)` | 获取模板完整配置（含新旧版本对比） | `id: string` | 模板结构配置（栅格、区域、主题变量、版本差异） |
| `updateLayoutTemplate(id, options)` | 将更新后的模板应用到目标大屏 | `id: string`, `options: { targetScreenId: string, generateLayerIds: string }`（JSON格式） | 更新结果（成功/失败、新生成的图层ID集合） |

## 参数格式说明

### updateLayoutTemplate 的 options 参数
```json
{
  "targetScreenId": "目标大屏ID", // 目标大屏ID，必填
  "generateLayerIds": ["原图层ID1", "原图层ID2", "..."]  // 要替换的图层ID数组，必填
}
```

## 操作流程

### Step 1: 解析用户更新需求

  明确用户的更新方向，区分不同更新场景：

  - 主题更新：更换同一场景下的布局主题（如科技蓝→深海蓝）
  - 模板替换：切换为同场景下的其他模板（如监控场景模板 A→模板 B）
  - 结构调整：基于现有模板，修改区域划分 / 组件布局

### Step 2: 获取更新目标模板

根据用户需求，获取更新目标的模板配置

### Step 3: 识别要替换的图层ID

关键步骤：必须获取原模板生成的图层ID集合，用于 generateLayerIds 参数。

图层ID来源：
  1. 上次 applyLayoutTemplate 调用返回的 generatedLayerIds
  2. 当前画布组件列表中的相关图层ID
  3. 系统记录的模板绑定信息

### Step 4: 执行模板更新操作

调用 updateLayoutTemplate 执行更新：

```typescript
try {
  await updateLayoutTemplate(`{id}`, {
    targetScreenId: `{screenId}`, // 目标大屏ID，必填
    generateLayerIds: `{generateLayerIds}`, // 图层 ID 集合，必填
  });
  // 应用成功提示
  console.log("更新成功，新生成的图层ID：", result.generatedLayerIds);
  return result.generatedLayerIds;
} catch (error) {
  // 处理应用失败场景：如模板不兼容、权限不足
  console.error("模板应用失败：", error);
}
```

## 工作原理解析
 updateLayoutTemplate 的内部流程：
  1. 图层查找与验证：根据 generateLayerIds 查找对应的图层组件
  2. 删除旧图层：安全删除指定的旧图层及其子组件
  3. 应用新模板：应用新模板，生成新的图层组件
  4. 引用更新：更新大屏中所有对旧图层的引用指向新图层
  5. 返回结果：返回新生成的图层ID集合


## 故障排除

### 常见错误 "未找到对应的布局模板"
**可能原因**：
1. 目标大屏未绑定任何布局模板
2. generateLayerIds 参数格式不正确
3. 提供的图层ID不属于任何模板绑定
4. 工具内部状态异常

**解决方案**：
1. 确保已通过 applyLayoutTemplate 成功应用过模板
2. 确认 generateLayerIds 是最后一次 applyLayoutTemplate 返回的图层ID数组
3. 联系平台技术支持获取详细错误日志
