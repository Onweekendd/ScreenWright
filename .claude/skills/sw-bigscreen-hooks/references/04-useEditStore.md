# useEditStore

## 作用

画布编辑状态的全局 store。管理当前选中/悬停的组件、画布缩放与偏移、鼠标位置，以及当前页面类型（build/panel/dynamicPanel/encodePanel）的判断。

## 文件路径

`apps/app/src/views/build/components/buildRender/hooks/useEditStore.ts`

## 返回值

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `targetChart` | `Ref<TargetChart>` | 当前悬停与选中状态（含 hoverChart、selectChart[]） |
| `editCanvas` | `Ref<EditCanvas>` | 画布状态（scale、offsetX/Y、isDrag、renderWidth/Height） |
| `editConfig` | `Ref<EditConfig>` | 大屏详情配置（同步自 detailInfo） |
| `selectTargetData` | `ComputedRef<Component[]>` | 当前选中的组件数组 |
| `isBuild()` | `() => boolean` | 是否在编辑器主画布 |
| `isPanel()` | `() => boolean` | 是否在静态 panel |
| `isDynamicPanel()` | `() => boolean` | 是否在动态 panel |
| `isEncodePanel()` | `() => boolean` | 是否在 encode panel |
| `isSpecialPanel()` | `() => boolean` | isPanel \|\| isDynamicPanel \|\| isEncodePanel |
| `isQuickEdit()` | `() => boolean` | 是否在快速编辑模式 |
| `setTargetSelectChart(ids)` | `Function` | 设置选中组件（支持多选） |
| `setTargetHoverChart(id)` | `Function` | 设置悬停组件 |
| `setEditConfig(config)` | `Function` | 更新 editConfig |
| `setEditCanvas(canvas)` | `Function` | 更新画布状态 |
| `setMousePosition(x, y)` | `Function` | 记录鼠标位置 |
| `fetchTargetById(id)` | `Function` | 递归查找指定 ID 的组件 |
| `scrollIntoViewTree(id)` | `Function` | 将组件滚动到组件树视图中 |

## 核心使用场景

- **获取当前选中组件**：`selectTargetData.value[0]` 取第一个选中组件
- **判断当前编辑上下文**：`isBuild()` / `isPanel()` 等区分不同编辑环境
- **获取画布缩放比例**：`editCanvas.value.scale`（用于坐标换算）
- **多选操作**：`setTargetSelectChart([id1, id2])`
- **按 ID 查找组件**：`fetchTargetById(id)` 支持递归穿透 panel 层级

## 基本实现示例

```typescript
const {
  selectTargetData,
  editCanvas,
  isBuild,
  setTargetSelectChart,
  fetchTargetById
} = useEditStore()

// 获取当前选中的第一个组件
const currentComp = selectTargetData.value[0]

// 判断是否在主画布（非 panel 内部）
if (isBuild()) {
  // 执行主画布专属逻辑
}

// 获取画布当前缩放
const scale = editCanvas.value.scale // e.g. 0.75

// 选中某个组件
setTargetSelectChart([componentId])

// 在任意层级查找组件
const comp = fetchTargetById(someId)
```

## 注意事项

- 使用 `createGlobalState`，全局单例
- `isBuild()` 等路由类型判断基于 `useRoute().name`，需在路由上下文内使用
- `selectTargetData` 支持多选，下标 0 是主选项
