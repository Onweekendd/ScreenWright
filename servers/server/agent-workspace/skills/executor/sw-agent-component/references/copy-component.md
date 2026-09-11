# 复制组件流程

## 工具说明

| 工具             | 用途                                                                            |
| ---------------- | ------------------------------------------------------------------------------- |
| `copy_component` | 读取源组件完整树结构（含子节点），suspend 交给前端创建，返回复制后组件 filePath |

`copy_component` 是直接工具（始终可用），会自动递归处理分组和动态面板的所有子节点，无需手动展开。

> ⚠️ **复制即已在前端创建实组件，完成后禁止再调用 `create_component`**（会重复创建同一组件）。如需修改复制出的新组件，直接对返回的 `filePath` 执行 `read_file` / `edit_files`。

---

## Step 1：确认源组件路径

通过以下方式获取源组件的工作区路径：

- 用户直接告知组件 ID → 路径为 `screen_<screenId>/component/<componentId>.json`
- 用户描述位置关系 → 先 `read_file` 查看父组件 JSON，从 `children` 或 `panelData` 中找到目标 ID

---

## Step 2：确认目标位置

目标位置（`to` 参数）有两种写法：

| 目标类型             | 示例值                                 | 说明             |
| -------------------- | -------------------------------------- | ---------------- |
| 放到大屏根层         | `screen_29445_1/component/`            | 与现有组件同级   |
| 放入分组             | `screen_29445_1/component/456/`        | 456 为父组件 ID  |
| 放入动态面板某状态下 | `screen_29445_1/component/456/state1/` | state1 为状态 ID |

---

## Step 3：调用 copy_component

```
copy_component({
  from: "screen_29445_1/component/123.json",   // 源组件文件路径
  to:   "screen_29445_1/component/456/"        // 目标位置目录
})
```

工具会：

1. 递归读取源组件及其所有子节点（分组的 `children`、动态面板的 `panelData`）
2. suspend 将完整数据交给前端
3. 前端创建实组件后恢复执行，返回复制后组件的 `filePath`

---

## Step 4：使用返回的 filePath

复制成功后工具返回：

```json
{ "success": true, "filePath": "screen_29445_1/component/789_xxx.json", "message": "组件已复制，路径: ..." }
```

**此时新组件已在前端创建完成，切勿再调用 `create_component`。** 后续对新组件的操作直接使用返回的 `filePath` 执行 `read_file` / `edit_files`。

---

## 示例

**用户**：把 123 号组件复制一份放到 456 分组里

```
copy_component({
  from: "screen_29445_1/component/123.json",
  to:   "screen_29445_1/component/456/"
})
```

返回 `{ "filePath": "screen_29445_1/component/789_xxx.json" }` → 后续直接用该 `filePath` 操作新组件。
