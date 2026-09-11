# 修改 vue-part 组件的属性 / 数据

修改 vue-part 的**非模板/脚本/样式**内容（绑定数据、位置、尺寸、事件等）时，改 **`.json`** 文件。先读 [concepts.md](concepts.md) 了解结构。

定位文件：`screen_{screenId}_{versionCode}/component/{id}.json`。

## 流程

1. **`read_file`** 读取 `.json`。
2. **`edit_files`** 修改目标属性（组件路径会自动按 schema 校验，失败会拒绝）：
   ```
   edit_files({
     files: [{
       path: "screen_{screenId}_{versionCode}/component/{id}.json",
       edits: [{ old_string: "从 read_file 结果精确复制的原始内容", new_string: "修改后的内容" }]
     }]
   })
   ```
3. 校验通过后自动推送到前端：系统会自动从同名 `.vue` 合并真实模板/脚本/样式到 `option` 一并推送，得到完整组件。**无需手动推送、也无需手动处理 option 指针。**

## 规则

- **绝不修改 `option.template` / `option.js` / `option.css`** —— 它们是指向 `.vue` 的指针；模板/脚本/样式一律去 `.vue` 改（见 [edit-content.md](edit-content.md)）。
- 修改数据时，按 `sw-component-schema` 中 vue-part 的 `dataChart` 格式（`[{ name, value }]`）映射，不要凭空填字段名。
- `old_string` 必须从 `read_file` 返回结果精确复制，并带足够上下文保证唯一。
- 禁止修改 `id` / `_draftId`。
