# 修改组件流程

修改已有组件前，**必须先确认字段结构再动手**，禁止凭猜测修改。

---

## Step 1：定位组件

通过组件 ID 找到工作区文件路径：

```
screen_{screenId}_{versionCode}/component/{componentId}.json
```

如果是嵌套组件：

- 分组内：`component/{groupId}/{componentId}.json`
- 动态面板内：`component/{panelId}/{stateId}/{componentId}.json`

> 不确定路径时，先用 `read_file` 尝试读取。

---

## Step 2：读取当前内容

```
read_file({ path: "<filePath>" })
```

**必须先读取，以获得精确的原始内容。**

读取后仔细查看当前字段值，确认要修改的字段路径和现有内容。

---

## Step 3：查阅字段结构

修改任何字段前，**必须先通过 `sw-component-schema` skill 确认该字段的正确结构**。

### 查阅规则

| 要修改的内容           | 查阅来源                                                |
| ---------------------- | ------------------------------------------------------- |
| 位置（left/top）       | `sw-component-schema` → `component-base-identity.md` |
| 尺寸（width/height）   | `sw-component-schema` → `component-base-identity.md` |
| 数据（data）           | `sw-component-schema` → 对应组件的 references 文件   |
| 数据源（API/SQL）      | `sw-component-schema` → `component-base-data.md`     |
| 样式、series、颜色等   | `sw-component-schema` → 对应组件的 references 文件   |
| 组件专属配置（option） | `sw-component-schema` → 对应组件的 references 文件   |

**禁止跳过此步骤直接修改。** 字段结构复杂，凭记忆修改极易出错。

### 涉及数据时

用户要求修改数据内容时，**必须**：

1. 调用 `skill` 工具，启用 `sw-component-schema`
2. 查询该组件（按 prop 名称）的 data 字段结构
3. 将用户数据按组件 data 格式映射后再修改

**禁止直接用用户给出的字段名填写 data。**

---

## Step 4：执行修改

```
edit_files({
  files: [{
    path: "<filePath>",
    edits: [{ old_string: "从 read_file 结果中复制的原始内容", new_string: "修改后的内容" }]
  }]
})
```

### 规则

1. **`old_string` 必须从 `read_file` 的返回结果中精确复制**，不要手写或猜测
2. 路径包含 `/component/` 时自动校验修改后的 JSON 是否符合组件 schema，校验失败会拒绝修改
3. 包含足够的上下文行确保每一项 `old_string` 在文件中唯一
4. 同一个组件需要同时修复/修改多处字段时，把它们作为多个元素放进同一次调用的 `edits` 数组（按顺序依次应用，全部应用完才整体校验一次），不要逐次单独调用 `edit_files`——否则中间状态可能仍不满足 schema 而被拒绝
5. 修改完成后自动推送到前端，无需再调用推送工具

### 禁止修改的字段

| 字段       | 原因                         |
| ---------- | ---------------------------- |
| `id`       | 系统分配，修改会导致组件丢失 |
| `_draftId` | 系统标记，仅在创建流程中使用 |

---

## 示例

### 示例 1：修改图表位置和尺寸

**用户**：把柱状图移到左边，宽度改成 400

1. 读取文件：
   ```
   read_file({ path: "screen_29445_1/component/456.json" })
   ```
2. 无需查阅 schema（位置和尺寸字段结构简单，但可按需确认）
3. 一次调用修改位置和宽度（两处不相邻的字段放进同一个 `edits` 数组）：
   ```
   edit_files({
     files: [{
       path: "screen_29445_1/component/456.json",
       edits: [
         { old_string: '"left": 500,\n  "top": 200', new_string: '"left": 100,\n  "top": 200' },
         { old_string: '"width": 300', new_string: '"width": 400' }
       ]
     }]
   })
   ```

### 示例 2：修改图表数据

**用户**：把柱状图数据改成按季度展示

1. 读取文件：`read_file({ path: "screen_29445_1/component/456.json" })`
2. 查阅 `sw-component-schema` → 对应组件的 data 字段结构
3. 按组件 data 格式映射用户数据
4. 修改：
   ```
   edit_files({
     files: [{
       path: "screen_29445_1/component/456.json",
       edits: [{ old_string: "// read_file 返回的原始 data 内容", new_string: "// 映射后的新 data 内容" }]
     }]
   })
   ```
