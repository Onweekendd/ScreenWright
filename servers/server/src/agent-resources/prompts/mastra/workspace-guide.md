# 工作区结构与读写规范

## 自检用工具，不用脚本

事件干跑用 `simulateEvent` 工具（真跑一遍「条件求值 → 动作规划 → 抛回调 → 消费方重算过滤器」，
输出哪些组件会响应、以及回调参数驱动出的真实过滤结果）。它曾是 `scripts/simulateEvent.ts`，
现在**不要去 `scripts/` 下找它**——那条路已经不存在了。

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
    ├── assets/                  # 本地素材区（本大屏专用，不进版本历史、回退不会动它）：从存储拉下来的 / 本地处理出来的图片和视频
    │   └── {文件名}              # 用 pullAssetsTool 拉、pushAssetsTool 传；返回的 path 就是最终位置
    ├── aniFrameSet.json         # 动画帧信息
    ├── statusAnimation.json     # 状态动画信息
    └── component/
        ├── 123_销售额.json              # 叶子组件（完整 schema），文件名为 "{id}_{name}"
        ├── 456_KPI分组.json             # 分组自身配置 + children 轻量文件引用（id/name/type/prop/file）
        ├── 456_KPI分组/                 # 分组组件的子组件目录（与 456_KPI分组.json 并列，目录名同为 "{id}_{name}"）
        │   └── 789_趋势.json
        ├── 111_主面板.json              # 面板自身配置 + panelData[i].config 轻量文件引用
        └── 111_主面板/                  # 动态面板状态目录（与 111_主面板.json 并列）
            ├── {stateId}_{stateName}/  # 状态目录，状态 id（多为 uuid）+ 状态名称
            │   └── {子组件id}_{子组件name}.json
            └── {stateId}_{stateName}/
                └── {子组件id}_{子组件name}.json
```

文件结构规则：

- 组件文件名/目录名统一为 `{id}_{name}` 形式（id 是真实数字 id，name 是组件名称；name 为空时退回组件类型（如"柱状图""图片"），便于直接从文件名/引用列表识别组件；name 净化后为空的段自动省略，最差退化为纯 `{id}`）
- 动态面板状态目录为 `{stateId}_{stateName}` 形式（stateId 多为 uuid 字符串，不是数字；还原时取目录名第一个 `_` 之前的部分作为 stateId，要求 stateId 本身不含 `_`）
- **叶子组件**：只有 `{id}_{name}.json`，无同名子目录
- **分组组件**：`{id}_{name}.json` 同时存自身配置和 `children: [{ id, name, type, prop, file }]`，同名目录存完整子组件，**二者并列**。
- **动态面板**：`{id}_{name}.json` 的 `panelData[i]` 保留状态 id/name，`config` 存同样的轻量引用；子组件位于同名目录下的 `{stateId}_{stateName}/`。
- 是否存在同名子目录即可判断父节点 vs 叶子节点；提取 id 时取文件名/目录名中第一个 `_` 之前的数字部分（旧数据可能仍是纯数字文件名，同样兼容）
- **引用粒度**：只列直属子组件，完整配置不递归内联。旧工作区可能仍是 `"{id}_{name}"` 字符串引用，读取兼容；同步后自动升级。引用由组件树生成，不直接增删引用来改变层级，结构操作仍使用移动、分组等专用工具。

**操作规则**：不再生成或读取 `_layout.json`。根级目标先使用 editor-context 的组件摘要和真实目录列表；理解分组内部时读取分组 JSON 的 children，理解面板状态时读取面板 JSON 的 panelData。按 prop/type 筛选目标后，按需读取子文件或检索字段，不加载整屏配置。视觉布局和效果使用 `capture_canvas`；精确位置、层级、样式从目标组件配置读取。组件不可见时按配置核实，不编造截图结果。

**路径规则**：引用的 `file` 是实际子文件名。分组子文件位于分组 JSON 的同名目录：如 `component/712_天气卡.json` 的引用 `{ file: "637_标题-天气.json" }` 指向 `component/712_天气卡/637_标题-天气.json`。面板状态引用位于面板同名目录的 `{stateId}_{净化后stateName}/`，先确认实际状态目录名，不猜省略中间层级。file 原样使用，不根据展示名称重新拼文件名。

## 本地素材区 assets/

要在本地处理图片 / 视频（裁切、缩放、拼图、转格式……）时：

1. `pullAssetsTool`（带当前 `screenId`）把存储里的文件（素材库、生成的图、用户上传的）拉到 `screen_{id}/assets/`，一次可以带多个、并行下载。**用返回的 `path`**——同名但内容不同的文件会自动改名避让，别自己猜文件名
2. 用 `execute_command` 在 `screen_{id}/assets/` 里处理（工作目录是工作区根，路径写 `screen_{id}/assets/xxx.png`）；处理结果也写回这个目录
3. `pushAssetsTool` 把这个大屏 `assets/` 里的结果传到存储并新增到用户素材库，一次可以带多个、并行上传；返回的 `url` 直接放进图片 / 视频组件

`assets/` 只放素材，不放组件、过滤器、屏幕配置；那些仍然只用 `read_file` / `edit_files`。每个大屏的 `assets/` 互相独立，只能上传当前大屏 `assets/` 里的 png / jpg / webp / gif / svg / mp4 / webm / mov。

## 文件读写与前端同步

操作 Workspace 文件使用 `read_file` 和 `edit_files`。禁止使用 `execute_command`、Mastra 原生文件工具或脚本修改组件、过滤器、屏幕配置，避免绕过校验和前端同步。

1. 结构化修改前先 `read_file` 获取准确内容；纯全局文本替换可以先用 workspace grep 得到真实文件路径和命中内容。
2. `edit_files` 接受 `files: [{ path, edits }]`，单文件也要放在 files 数组里。path 使用工具返回的真实路径。
3. 每项 edits 是一次精确字符串替换；old_string 命中多次时增加上下文使其唯一，或设 replace_all: true。
4. **文件内原子、文件间隔离**：同一文件的 edits 按顺序应用，任意一项失败则该文件不写入；一个文件失败不阻断或回滚其他文件。
5. 组件、过滤器、屏幕配置逐文件校验和同步前端，可能经过独立的 suspend/resume。校验失败的文件返回字段错误且不写入；通过后写入并推送前端。等待工具最终汇总，按 results 逐项报告成败。

```js
edit_files({
  files: [
    {
      path: "screen_29445_1/component/123_销售额.json", // 使用实际读取到的路径
      edits: [{ old_string: "…", new_string: "…", replace_all: true }]
    }
  ]
});
```
