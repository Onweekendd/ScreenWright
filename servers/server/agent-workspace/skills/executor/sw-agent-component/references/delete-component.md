# 删除组件流程

## 工具说明

| 工具          | 用途                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| `delete_file` | 删除 workspace 中的组件或数据过滤器文件，suspend 等待前端用户确认，确认后执行删除并返回结果 |

`delete_file` 是直接工具（始终可用）。传入组件 JSON 路径即可删除组件；调用后会 suspend，前端弹出确认对话框，用户点击"接受"才真正删除，点击"拒绝"则取消。

> 过滤器删除同样用 `delete_file`（传入 `/dataFilterArr/` 下的文件路径），本文只讲组件删除。

---

## Step 1：确认目标组件路径

通过以下方式获取待删除组件的工作区路径（文件名格式为 `{id}_{name}.json`）：

- 用户直接告知组件 ID → 路径为 `screen_<screenId>/component/<id>_<name>.json`
- 组件在分组内 → 路径为 `screen_<screenId>/component/<groupId>_<groupName>/<id>_<name>.json`
- 组件在动态面板某状态下 → 路径为 `screen_<screenId>/component/<panelId>_<panelName>/<stateId>_<stateName>/<id>_<name>.json`

不确定路径时，先 `read_file` 查看父组件的 `children` 或 `panelData` 找到目标 ID，或按 ID 前缀定位文件。

---

## Step 2：调用 delete_file

```
delete_file({
  path: "screen_29445_1/component/123_柱状图.json"
})
```

工具会：

1. 校验文件是否存在
2. suspend 将组件信息（ID + placement）发送给前端
3. 前端弹出确认对话框，等待用户选择
4. 用户确认 → 前端执行删除，返回 `{ success: true }`
5. 用户取消 → 返回 `{ success: false }`

---

## Step 3：处理返回结果

```json
// 删除成功
{ "success": true, "message": "组件已删除，ID: 123" }

// 用户取消
{ "success": false, "message": "用户取消了删除操作" }
```

删除成功后，该组件 ID 已失效，不要再对其执行任何 `read_file` 或 `edit_files` 操作。

---

## 示例

**用户**：把 123 号组件删掉

```
delete_file({
  path: "screen_29445_1/component/123_柱状图.json"
})
```

前端弹出「确认删除组件「柱状图」吗？」，用户点击接受后返回 `{ "success": true }`。
