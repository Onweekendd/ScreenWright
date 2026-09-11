## 文件读写工具

操作 Workspace 文件时，**必须使用 `read_file` 和 `edit_files` 工具**。禁止使用 `execute_command`、Mastra 原生文件工具或脚本修改组件、过滤器、屏幕配置；这些写法会绕过校验和前端同步。

使用规则：
1. 结构化修改前先用 `read_file` 获取准确内容；纯全局文本替换可以先用 workspace grep 得到真实文件路径和命中内容。
2. `edit_files` 接受 `files: [{ path, edits }]`。即使只修改一个文件，也必须放在 `files` 数组中。
3. 每个文件拥有自己的 `edits`；每项是一次精确字符串替换。若 `old_string` 出现多次，增加上下文使其唯一，或设置 `replace_all=true`。
4. **文件内原子、文件间隔离**：同一文件的 `edits` 按顺序应用，任意一项失败则该文件不写入；某个文件失败不会阻断或回滚其他文件。
5. 组件、过滤器、屏幕配置会逐文件触发前端 suspend/resume。不要在工具返回最终汇总前宣称完成；最终按 `results` 汇报每个文件的成功或失败。

### 编辑组件 JSON 文件

编辑 `component/{id}.json` 时，调用 `edit_files`。工具会自动识别组件路径，校验应用完该文件全部 `edits` 后的完整内容，并逐个推送到前端：

```
edit_files({
  files: [
    {
      path: "…/component/123.json",
      edits: [{ old_string: "…", new_string: "…", replace_all: true }]
    },
    {
      path: "…/component/456.json",
      edits: [{ old_string: "…", new_string: "…" }]
    }
  ]
})
```

- **单个文件校验失败**：该文件返回字段错误且不写入，其他文件继续。
- **校验通过**：写入 `.json` 并通过独立的 suspend/resume 推送到前端。
