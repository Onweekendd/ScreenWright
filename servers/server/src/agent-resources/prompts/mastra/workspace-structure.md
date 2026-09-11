## 自检用工具，不用脚本

事件干跑用 `simulateEvent` 工具（真跑一遍「条件求值 → 动作规划 → 抛回调 → 消费方重算过滤器」，
输出哪些组件会响应、以及回调参数驱动出的真实过滤结果）。它曾是 `scripts/simulateEvent.ts`，
现在**不要去 `scripts/` 下找它**——那条路已经不存在了。

`scripts/` 里剩下的 `create-template.ts` / `extract-slots.ts` 是模板提取子 agent 用的，主 agent 不需要碰。

## Workspace 文件结构

大屏数据以文件化方式存储在 Workspace，目录结构如下：

```
workspace/
├── api-registry/                # API 注册表（所有大屏共享）；用户询问"有哪些接口"时必须读取
│   └── {datasourceId}/          # 按数据源 ID 分组
│       ├── index.json           # 该数据源的 baseUrl 和所有注册路径列表
│       └── paths/
│           └── {path}.json      # 单个路径详情：HTTP 方法、query/body 参数、响应 schema
│
└── screen_{id}/                 # 大屏目录（id 格式为 "{screenId}_{versionCode}"，如 "29445_1"）
    ├── _meta.json               # 同步锚点 { updatedTime, componentIds }
    ├── _callback_flows/         # 回调参数数据流（每次同步自动生成，只读）
    │   └── {argName}.json       # 单个回调参数的完整链路：emittedBy（谁在哪些事件上抛出）+ consumedBy（哪些过滤器和组件消费）
    ├── _event_flows/            # 事件-行为链路（每次同步自动生成，只读）
    │   └── {sourceId}.json      # 单个组件的所有事件：trigger / conditions / targets（目标组件 id + actionType）
    ├── info.json                # 大屏基本信息（name、宽高、versionCode、config 等）
    ├── dataFilterArr/           # 数据过滤器目录（每个过滤器一个文件，以过滤器名称命名）
    │   ├── {name}.json          # 过滤器元数据（dataFormatter 字段为 "{name}.js" 引用）
    │   └── {name}.js            # dataFormatter 函数体
    ├── aniFrameSet.json         # 动画帧信息
    ├── statusAnimation.json     # 状态动画信息
    └── component/
        ├── 123_销售额.json              # 叶子组件（完整 schema），文件名为 "{id}_{name}"
        ├── 456_KPI分组.json             # 分组组件自身（children 字段仅保留子组件的 "{id}_{name}" 字符串数组）
        ├── 456_KPI分组/                 # 分组组件的子组件目录（与 456_KPI分组.json 并列，目录名同为 "{id}_{name}"）
        │   ├── _layout.json            # 该分组内子组件的布局（container 含容器宽高，24×12 网格 + ascii_map）【只读，每次同步自动生成，禁止手动修改】
        │   └── 789_趋势.json
        ├── 111_主面板.json              # 动态面板自身（panelData[i].config 仅保留子组件的 "{id}_{name}" 字符串数组）
        └── 111_主面板/                  # 动态面板状态目录（与 111_主面板.json 并列）
            ├── {stateId}_{stateName}/  # 状态目录，状态 id（多为 uuid）+ 状态名称
            │   ├── _layout.json        # 该状态内子组件的布局（container 含 stateId/stateName，24×12 网格 + ascii_map）【只读，每次同步自动生成，禁止手动修改】
            │   └── {子组件id}_{子组件name}.json
            └── {stateId}_{stateName}/
                ├── _layout.json
                └── {子组件id}_{子组件name}.json
```

文件结构规则：

- 组件文件名/目录名统一为 `{id}_{name}` 形式（id 是真实数字 id，name 是组件名称；name 为空时退回组件类型（如"柱状图""图片"），便于直接从文件名/引用列表识别组件；name 净化后为空的段自动省略，最差退化为纯 `{id}`）
- 动态面板状态目录为 `{stateId}_{stateName}` 形式（stateId 多为 uuid 字符串，不是数字；还原时取目录名第一个 `_` 之前的部分作为 stateId，要求 stateId 本身不含 `_`）
- **叶子组件**：只有 `{id}_{name}.json`，无同名子目录
- **分组组件**：`{id}_{name}.json`（自身，children 替换为 `"{id}_{name}"` 字符串数组）+ `{id}_{name}/` 目录（存子组件），**二者并列**
- **动态面板**：`{id}_{name}.json`（自身，panelData[i].config 替换为 `"{id}_{name}"` 字符串数组）+ `{id}_{name}/` 目录（存各状态子目录 `{stateId}_{stateName}/`），**二者并列**
- 是否存在同名子目录即可判断父节点 vs 叶子节点；提取 id 时取文件名/目录名中第一个 `_` 之前的数字部分（旧数据可能仍是纯数字文件名，同样兼容）
- **嵌套 `_layout.json`**：分组子目录和动态面板的每个状态子目录下各有一份 `_layout.json`，结构为 `{ container, grid, ascii_map, components }`：`container` 含容器的 id/name/prop/width/height（动态面板状态额外含 stateId/stateName）以及 **`dir`（本 `_layout.json` 所在目录相对于 `component/` 的正斜杠路径）**，网格为 24×12，`components` 为直接子组件列表（含坐标和 childrenSummary，不递归展开）

**⚠️ 操作规则：`_layout.json` 每次数据同步时自动重新生成，禁止手动写入或修改。需要理解分组或动态面板内部结构时，必须先读该容器子目录下的 `_layout.json`**，它提供：子组件的空间布局（ascii_map）、层叠顺序（zIndex）、子树规模摘要（childrenSummary）。读完后再按需精读具体子组件文件。跳过此步直接猜测内部结构会导致错误。

**⚠️ 路径拼接规则（必读）**：读到 `_layout.json` 后，其 `container.dir` 字段即为该容器目录相对于 `component/` 的路径（如 `"3303567_card-右侧栏_动态面板/42tW3Gpd-zHho-41hN-bNPq-tbccR78oVwH5_设备检测右"`）。`components[]` 中每个子组件的文件路径为：`screen_{id}/component/{container.dir}/{idName}.json`，**不要**直接将子组件 id 拼到顶层 `component/` 下。
