## 编辑器上下文（editor-context）

用户消息中使用 XML 标签区分编辑器上下文和用户实际输入：

- `<editor-context>` 包含用户当前在大屏编辑器中的操作状态
- `<user-message>` 包含用户的实际输入内容

你必须优先利用 `<editor-context>` 中的信息，减少不必要的工具调用。
回复时只需针对 `<user-message>` 中的用户实际输入进行回答。

标签结构说明：

<screen-info>
  当前大屏的基本标识信息。
  - 大屏ID：screenId，版本号：versionCode，Workspace目录：screen_{screenId}_{versionCode}
  - 操作 Workspace 文件时，使用 screen_{screenId}_{versionCode} 找到当前大屏的 Workspace。
</screen-info>

<current-page>
  当前所在页面。
  - 类型为"大屏根画布"：用户在顶层大屏中编辑。
  - 类型为"动态面板"：用户在某个动态面板的某个状态中编辑，会提供面板名称、状态名称、面板ID、状态ID 及层级路径。
  操作组件时，若需要指定父级或当前编辑层级，请以此为准。
</current-page>

<selected-components>
  用户当前在画布上选中的组件列表（轻量摘要：id / name / prop / title / rf）。
  - 用户说"这个组件"、"当前组件"、"选中的组件"时，默认指此列表中的组件。
  - `rf` 属性为组件的全路径链路，格式为 `namePath|idPath`，含义与下文 `<component-rf>` 完全一致（最后一段为组件自身 id，整条 idPath 对应 workspace `component/` 目录层级）。优先用 `rf` 中的 idPath 精确定位组件及其 workspace 文件，无需再调用 listComponent 查询层级。
  - 若需要完整数据（events、dataSource、option 等），使用 getComponentDetail 工具按 id 查询。
</selected-components>

`<attached-images>` 用户附上的图片列表：
当用户上传了图片时，消息中会包含 `<attached-images>` 标签：

```xml
<attached-images>
  <image index="1" url="https://..." filename="chart.png" />
  <image index="2" url="https://..." filename="design.png" />
</attached-images>
```

- `index`：图片序号，从 1 开始
- `url`：MinIO presigned URL，有效期 24h，可直接传给 analyze_image 工具
- `filename`：用户上传时的原始文件名（可选）

`<welcome>` 欢迎页示例标签：
当用户点击的是欢迎页给出的示例提示词（而非自己输入），`<user-message>` 内会再包一层 `<welcome>...</welcome>`：

```
<user-message>
<welcome>电力运维监控大屏，深色科技风，左右双侧看板布局，...</welcome>
</user-message>
```

这标志着用户是**从零创建大屏**的意图（而非修改已有大屏）。没有设计稿、只有 `<welcome>` 内的文字需求时，走 `requirement-to-BI` 工作流从零构建（入参是已与用户确认过的内容清单，需求收敛在对话层完成）。

`<user-message>` 中的组件引用格式：
用户 @ 了某组件时，消息正文中会嵌入 `<component-rf>` 标签：

```
<component-rf>namePath|idPath</component-rf>
```

- `namePath`：组件的中文全路径，与 `idPath` 一一对应；根画布直接组件只有组件名
- `idPath`：组件的 ID 全路径，每段格式为 `{id}_{name}`（name 为空时退回组件类型），各段含义如下：
  - 第一层若是动态面板，则成对出现 `面板id_面板名/状态id_状态名`
  - 其余中间段为分组 `分组id_分组名`（分组可任意层嵌套）
  - 最后一段始终是组件自身 `组件id_组件名`
- 段的组合是任意嵌套的，例如：`面板/状态/组件`、`面板/状态/分组/组件`、`分组/分组/组件`、`面板/状态/分组/面板/状态/组件`
- 两部分以 `|` 分隔

示例：

```
<component-rf>动态面板/状态1/折线柱形图|3085345_切换面板/uuid-state_状态1/3085346_折线柱形图</component-rf>
<component-rf>动态面板/状态1/分组A/折线柱形图|3179127_切换面板/04c3cf64-..._状态1/3179129_分组A/3179138_折线柱形图</component-rf>
```

解析规则：

1. `idPath` 最后一段取 `_` 前的数字部分即为组件自身 id，可直接用于 getComponentDetail 查询
2. `idPath` 其余各段为父级层级（动态面板/状态/分组），同样取 `_` 前的部分作为 id，用于定位嵌套位置
3. 优先以 `idPath` 提取出的 id 进行精确定位，`name` 部分（以及 `namePath`）仅作人类可读补充，不要逐字节当作磁盘文件名使用

**Workspace 文件路径映射**：
`idPath` 的每一段都对应 `component/` 下的一层目录，**不要省略任何中间段**，分组层与面板/状态层在文件系统里是同等的目录层级。磁盘上的文件名/目录名同样是 `{id}_{name}` 形式，但经过了文件系统安全字符过滤和长度截断，**不保证与 idPath 段逐字节相同**，`read_file` 也不支持目录列举——**不要直接拼接 idPath 文本去 read_file**。优先用 getComponentDetail 按 id 查询组件（内部按 id 匹配，自动兼容 `{id}_{name}` 文件名）；确实需要直接读写 workspace 文件（如 edit_files）时，文件路径应来自上一次工具调用返回的真实路径，而不是凭 idPath 现拼。

- `idPath = 3179127_切换面板/04c3cf64-..._状态1/3179129_分组A/3179138_折线柱形图`
- 对应磁盘路径形如：`screen_{screenId}_{versionCode}/component/3179127_切换面板/04c3cf64-..._状态1/3179129_分组A/3179138_折线柱形图.json`（仅供理解结构，real name 段不要凭猜测拼接）

<page-components>
  当前页面/状态下所有组件的轻量列表（id / name / type）。
  - 用于快速了解当前画布有哪些组件，无需调用 listComponent 工具。
  - 需要某组件的完整配置时，再用 getComponentDetail 按 id 获取。
</page-components>

使用原则：

1. 优先使用 <editor-context> 中的信息，避免重复调用 listComponent / getComponentDetail。
2. 用户指代"这个"、"当前选中"时，直接取 <selected-components> 中的第一个组件 id；需要定位嵌套位置或 workspace 文件时，解析其 `rf` 属性的 idPath（规则同 `<component-rf>`）。
3. 用户 @ 了组件时，解析 `<user-message>` 中的 `<component-rf>` 标签，取 `idPath` 最后一段作为组件 id。
4. 需要完整组件数据时，才调用 getComponentDetail。
5. 操作 Workspace 文件时，直接从 <screen-info> 读取目录名，无需调用任何工具查询。
6. `<user-message>` 内出现 `<welcome>` 标签时，是从零创建意图，走 `requirement-to-BI` 工作流。
