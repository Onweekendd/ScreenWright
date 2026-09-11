# 创建组件流程

## 工具说明

| 工具               | 用途                                                             |
| ------------------ | ---------------------------------------------------------------- |
| `search-component` | 通过自然语言描述搜索匹配的组件，返回组件文档                     |
| `create_component` | 创建组件并直接推送到前端，返回真实组件的 filePath                |
| `read_file`        | 读取组件文档或组件文件内容（edit_files 前必须先调用）            |
| `edit_files`       | 修改已创建组件的文件，自动校验并推送到前端                       |

**`create_component` 创建即推送，没有草稿阶段，无需任何额外的推送调用。**

---

## Step 1：确认目标组件

### 路径 A：用户明确指定了组件

直接在 `sw-component-schema` skill 的组件速查表中确认该组件是否存在，提取：

- **title**：中文名（如 `面积折线图`）
- **prop**：英文标识（如 `echartareaLine`）

### 路径 B：用户描述了需求但未指定组件

1. 从用户描述中提取特征关键词，构造一个简洁的自然语言 query
2. 调用 `search-component` 工具（topK 默认 3）
3. 从返回的 `doc` 字段第一行解析：
   ```
   # 面积折线图 (echartareaLine)
        ↑ title          ↑ prop
   ```
4. 若有多个候选，根据 `score` 和描述选最优项，或向用户确认

---

## Step 2：判断是否需要定制

- **用户只说「加一个 XX 图」，无其他要求** → 跳到 Step 4，直接创建默认组件
- **用户有定制需求**（数据、位置、样式等）→ 先做 Step 3

---

## Step 3：查阅组件 schema 文档

**要定制字段就必须先读文档。模板里的默认值不代表正确的字段名和数据格式，靠猜必然出错。**

1. 进入 `sw-component-schema` skill，在组件类型索引中找到对应类型的 `index.md`（如图表组件 → `references/components/echart/index.md`）
2. 从 `index.md` 中按 prop 名称找到该组件，确认其文档路径
3. `read_file` 读取该文档（如 `references/components/echart/echartbar.md`），重点关注：
   - `data` 字段的数组格式和每项所需字段
   - `option` 中与用户需求相关的配置项

若一时找不到文档路径，可以先不带 `overrides` 创建默认组件，工具返回的 `schemaDoc` 就是该组件的文档路径，读完再用 `edit_files` 调整。

---

## Step 4：创建组件

```
create_component({
  screenId: "<大屏标识>",          // 如 "29445_1"
  componentName: "<title>",        // 中文名，如 "柱状图"
  placement: {                     // 可选，嵌套时提供
    parentId: <父组件id>,
    parentType: "group" | "dynamicPanel",
    stateId: "<状态id>"            // dynamicPanel 时必填
  },
  overrides: {                     // 可选，只写需要定制的字段
    title: "各分数段人数",
    left: 100,
    top: 50,
    data: [ ... ],
    option: { ... }
  }
})
```

返回 `{ filePath, schemaDoc }`。`filePath` 是前端创建后的真实路径，后续 `read_file` / `edit_files` 都用它。

### overrides 规则

**核心原则：只写用户明确要求的字段。模板已包含全部默认值，用户没提的字段一律不要写。**

| 规则                       | 说明                                                                       |
| -------------------------- | -------------------------------------------------------------------------- |
| 键名必须与模板一致         | 写错会被拒绝，并返回该层级的可用字段列表或相近字段建议                     |
| 嵌套对象逐层深合并         | `option: { title: "x" }` 只覆盖 `option.title`，其余 option 字段保持默认    |
| 数组与原始值整体替换       | 传 `data: [...]` 会替换整个 data，不做逐项合并                             |
| 不要传 `id`                | 由前端业务接口分配真实 ID                                                  |
| 不要传 `title` 作为组件类型 | `componentName` 已经决定组件类型；`overrides.title` 是显示标题             |

**禁止直接用用户给出的字段名填写 `data`**——用户数据的字段名与组件所需格式几乎不会一致，必须按文档做映射转换。

### 字段参考速查

| 用户需求                             | 参考来源                                                |
| ------------------------------------ | ------------------------------------------------------- |
| 位置（left/top）                     | `sw-component-schema` → `component-base-identity.md` |
| 尺寸（component.width/height）       | `sw-component-schema` → `component-base-identity.md` |
| 数据（data 字段）                    | 该组件的 MD 文档（**必读，禁止靠猜**）                  |
| 数据源（API/SQL）                    | `sw-component-schema` → `component-base-data.md`     |
| 图表样式、series、颜色等组件专属配置 | 该组件的 MD 文档（**必读，禁止靠猜**）                  |

---

## Step 5：创建后调整（可选）

组件已经是前端的真实组件，后续修改走常规编辑流程：

1. `read_file({ path: filePath })` 读取当前内容
2. `edit_files` 修改指定字段，自动校验并推送到前端

```
edit_files({
  files: [{
    path: "<filePath>",
    edits: [{ old_string: "要替换的内容", new_string: "替换后的内容" }]
  }]
})
```

若需要同时修改多处字段，放进同一次调用的 `edits` 数组，避免中间状态校验不过被拒绝。

---

## 示例

### 示例 1：仅需默认样式

**用户**：加一个柱状图

1. 确认组件：速查 → title = `柱状图`
2. 无定制需求，直接创建：
   ```
   create_component({ screenId: "29445_1", componentName: "柱状图" })
   ```
   返回 `{ filePath: "screen_29445_1/component/456_柱状图.json" }` → 完成

### 示例 2：带数据和定制

**用户**：加一个柱状图，展示各分数段人数

1. 确认组件：速查 → title = `柱状图`，prop = `echartbar`
2. 有定制需求 → 读 `references/components/echart/echartbar.md` 确认 `data` 结构
3. 一次创建：
   ```
   create_component({
     screenId: "29445_1",
     componentName: "柱状图",
     overrides: {
       title: "各分数段人数",
       data: [ ... 按文档格式映射后的数据 ... ]
     }
   })
   ```
   返回 `filePath` → 完成

### 示例 3：嵌套到分组内

**用户**：在这个分组里加一个折线图

```
create_component({
  screenId: "29445_1",
  componentName: "折线图",
  placement: { parentId: 3303567, parentType: "group" }
})
```

### 示例 4：overrides 键名写错

```
create_component({ ..., overrides: { option: { titel: "销售额" } } })
```

工具拒绝执行并返回：

```
overrides 中以下字段在 "柱状图" 模板中不存在，请修正后重试。组件文档：...
  option.titel —— 是否想写：title
```

按提示改正键名后重新调用即可。
