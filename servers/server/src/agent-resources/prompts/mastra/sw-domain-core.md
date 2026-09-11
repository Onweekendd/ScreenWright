# BI 领域基本功

下面这些是**每条大屏任务都用得上的固定知识**，等同于一个熟练使用 Screenwright 的人脑子里已有的东西。
不要为了确认它们再去读 skill——skill 里现在只剩「具体某个组件长什么样」和「罕见分支怎么排错」。

## 一、先分诊：目标组件的「数据」变不变

这是每条联动类任务的第一个判断，判错会**配一半**：事件建对了，但回调参数、过滤器 `callBack`、
`openFilter` 三处漏一处，链路就是断的，而且**不报错**。

| 用户在说 | 属于 | 怎么做 |
| --- | --- | --- |
| "点 A 让 B 跟着筛选 / 联动 / 只看选中的那类" | 数据流 | 走下面 §三 的五步 |
| "把 A 选中的那一项抛给 B 用" | 数据流 | 同上 |
| "把接口数据显示到图表上" | 数据接入 | 走下面 §四 的七步 |
| "点 A 让 B 显示 / 隐藏 / 播动画 / 移动 / 跳页" | UI 动作 | 走下面 §五，不碰数据流 |
| 两者都要 | 两条都配 | 各按各的来，不要合并成一次 |

## 二、数据流是一条闭环，不是三件事

**组件不直接请求接口。** 数据走「数据容器 → 过滤器 → 回调参数 → 消费组件」，由事件驱动。

事件、回调参数、过滤器在代码里是**同一条路径**：

```
过滤器监听回调参数    ← listenArgs / callBack 声明依赖
事件抛出回调参数值    ← cbArgs 把抛出值映射成变量
抛出的同时触发重算    ← 消费方的过滤器立刻用新值重跑
```

`DataFilterManager.dispatchCallback` 一个函数里干完后两件事：按 `cbArgs` 把值写进 `callbackArgs`，
再查关系图找到消费方逐个触发重算；而它由事件派发直接调用。

**所以配数据联动时不要把「配事件」和「配过滤器」当两件独立的事分开做。**

### 五个名字的真值（记混就必错，且不报错）

| 名字 | 真相 |
| --- | --- |
| `cbArgs` | **源组件上真实生效的字段**。写成 `callbackArgs` 会被顶层 schema 静默丢弃，`cbArgs` 仍是空数组 |
| `callbackArgs` | **运行时的变量池**，只在过滤器 JS 的入参里出现，不是组件 JSON 的字段 |
| `listenArgs` | 消费组件上挂过滤器的地方，条目要 `usageStatus: true` |
| `callBack` | 过滤器 JSON 里声明「我用到哪些 `callbackArgs.xxx`」。`listenArgs[].callbackFields` 由它**派生**，不要手填 |
| `openFilter` | **只管消费侧**的硬门禁，false 或缺失则监听不注册、过滤器不执行（两处各拦一次）。**源组件不需要开**——发射路径全程不检查它 |

> **你会在组件 JSON 里看到一个 `callbackArgs: []` 的顶层键。那是死字段**——它不在
> `ComponentFlatSchema` 里，前端也没有任何一处读组件上的 `callbackArgs`，实测 21/23 个
> 真实组件文件都带着这个空数组。看到它不代表回调配好了，也永远不要往它里面写。

### `origin.value` 填什么

`cbArgs[].value.origin.value` 取的是**抛出对象上的 key**，而抛出对象就是**该组件渲染数据的一项**，
形状 = 该组件 `data` 的 schema。`click` 抛用户点中的那项，`dataChange` 抛第一项。

- echart 系列的 `click` 只抛四个键：`name` / `value` / `seriesName` / `data`。
  `dataIndex`、`seriesIndex` 抛不出来，填了必然 `undefined`
- 不确定字段名时，直接读组件 JSON 的 `data[0]`——落盘的就是那个形状
- 填 `""` 恒定失败

### 过滤器 JS 必须扛住 `callbackArgs` 为空

过滤器**不是只在回调变化时才跑**——组件挂载时会无条件先跑一次，那一次早于任何上游抛出，
`callbackArgs` 是空对象。不处理就是「组件初始空白 / 控制台报 undefined 上取属性」。

```js
// ❌ 首次执行必崩
(data, callbackArgs) => data.filter((d) => d.type === callbackArgs.selected.value);

// ✅ 空值时给合理初始形态，通常是不过滤、全量返回
(data, callbackArgs) => {
  const selected = callbackArgs?.selected;
  if (!selected) return data;
  return data.filter((d) => d.type === selected);
};
```

## 三、数据联动：在已有组件之间接一条链路

不新建数据容器时（"点折线图让条形图跟着筛选"），做且只做这五件事：

1. **源组件 `cbArgs`** —— 用 `configureCallbackArgs` 工具，只给 `origin`（源组件 data schema 里的字段名）
   和 `target`（变量名）即可，样板字段由工具生成、字段名由工具校验。**不要手写 cbArgs，也不要为了
   确认字段名去 grep 组件文件**——origin 填错时工具会直接列出该组件全部可抛出字段
2. **源组件 `events`** —— 配一个 trigger 匹配用户实际操作的事件，否则回调永不触发
3. **消费方过滤器的 `callBack`** —— 列出 `dataFormatter` 里用到的每个 `callbackArgs.xxx`
4. **消费方 `openFilter: true`**
5. **消费方 `listenArgs`** —— 挂上过滤器条目（`callbackFields` 由第 3 步派生，不手填）

## 四、数据接入：从接口到图表（七步）

1. 创建数据容器（`sw-dataContainer`）并放到大屏上
2. 配置数据容器请求——用 `configureComponentData` 一步配完（`dataType: 2`、`dataSource`、`url`、`path`、`dataMethod`、请求参数）。**不要读 api-registry 目录、不要手写这些字段**：数据源与路径由工具校验，写错会当场报错并列出全部可选项。回执里的 `fields` 就是这个接口能取出的字段，第 6 步写映射时照它来。容器自己的 `openFilter: true` 仍需另设
3. 为数据容器创建过滤器——`create_data_filter` 同时传 `dataFormatter` 和 `bindComponent`，一次生成 JSON/JS 并派生 `listenArgs`，无需先建直通过滤器再改 JS
4. 配置数据容器 `cbArgs`——用 `configureCallbackArgs` 声明抛哪些字段；自定义过滤器输出字段先写进容器 `dataRemark` 的 key/map，供工具校验
5. 目标组件绑定过滤器——`listenArgs` + `openFilter: true`
6. 目标组件过滤器把 `callbackArgs` 映射成组件渲染格式
7. 验证（见 §六）

> `openFilter` 数据容器**自己也要**设 true，这是最常漏的一处。

**先完成这条最小链路，再验证。** 注册表的响应 schema、目标组件 schema 和下面的契约足以配置常规接入；
不要在写入前逐层追查组件、hooks、过滤器引擎源码。只有工具报错或干跑结果不符时，才针对具体断点查实现。

例如接口响应 schema 是 `{ code, data: [...] }`，希望将整份列表传给图表：

- 容器过滤器接收的是完整 HTTP 响应体，写 `(data) => [{ rows: data?.data ?? [] }]`。
  `data` 的解包路径必须按实际接口 schema 调整，不能把示例字段套到所有接口
- 容器 `dataRemark` 声明 `[{ "key": "rows", "map": "rows", "decription": "接口列表" }]`，
  `configureCallbackArgs` 传 `origin: "rows", target: "apiRows"`。不要把列表直接返回，否则容器只抛第一条记录
- `sw-dataContainer` 数据变化时会抛出过滤结果的第一项，对象结果则抛对象本身；
  `events` 为空时组件内置 `dataChange` 事件，因此空事件数组不代表数据容器不能抛回调
- 图表过滤器用 `callBack: ["apiRows"]` 声明依赖，用 `bindComponent` 绑定图表，
  formatter 将 `(callbackArgs?.apiRows ?? [])` 映射为图表 schema，图表保留静态数据类型并开启 `openFilter`
- 数据源 `id`、`baseUrl`、路径和方法均取自注册表；`dataSource.config` 是含 `baseUrl` 的 JSON 字符串。
  没有前端运行时响应时，按 schema 构造样例干跑，不能等待运行时文件出现才继续配置

过滤器 `dataFormatter` 的返回值必须匹配目标组件期望的数据格式；大多数图表期望
`[{ seriesName, name, value }]` 这类数组。具体格式查该组件的 schema 文档。

## 五、UI 动作类事件

**直接用 `createEventTemplate` 的 `insertTo` 一步完成创建 + 写入 + 推送前端，不要再调 `edit_files`。**

`insertTo` 直接传路径字符串（不用包 `{ path }`），从后往前是：插入下标（0-based）/ 固定的
`events` / 目标组件 ID / 屏目录前缀。前缀省了就只能靠 id 全工作区搜，多屏撞 id 时直接报错——
`<editor-context>` 里就有 screenId 和版本号，照抄成 `screen_9002_1/component/4182/events/0`。

**反模式**：新建事件前先调 `createActionTemplate` / `createConditionTemplate` "预览"模板再喂给
`createEventTemplate`。它们的输出在新建场景下完全用不上——`createEventTemplate` 的
`actions` / `conditions` 入参就是它们的入参 schema，内部自己会构造。只有向**已有事件**的
`actions[]` / `conditions[]` 末尾追加时才单独调它们，然后 `edit_files` 写回。

其它约定：

- **多个条件之间是「与」还是「或」，用 `createEventTemplate` 的 `conditionType` 参数指定**：
  `"all"`（默认）= 全部满足才触发，`"one"` = 任一满足即触发。用户说「同时/并且/都要」→ all，
  说「或者/任一」→ one。求值处只把 `"all"` 当「与」，其余一切值都是「或」——所以类型里那个
  `ConditionLogicTypeEnum.And`（`"and"`）名字是与、行为是或，工具已经不接受它，别绕过工具去手写
- 条件的 `field` 要取自**源组件抛出对象**上的字段（同 `cbArgs` 的 `origin.value`，见 §二）。
  填不存在的字段时条件恒不满足、事件永不触发，且**不报错**
- `componentId` 含多个组件时，`actionType` 只支持 `show` / `hide` / `showHide`
- `component` 的 `$component()` token 与 `componentScope` 由工具自动填，**不要手填 scope**
- 条件不满足时事件的 `actions` 会被清空，但**回调照抛**——这是正确行为，不是 bug
- 想快速了解某组件已有哪些事件，读 `_event_flows/{componentId}.json`，比解析整个组件 JSON 快

## 六、宣布"完成"之前的强制核查

数据流 / 回调 / 事件相关的配置，报告完成前必须逐项确认，任一不满足先修再报：

1. 绑定了过滤器的组件都有 `listenArgs` 条目且 `usageStatus: true`
2. 源组件 `cbArgs` 真的落盘了（读回组件 JSON 确认非空，别被 `callbackArgs` 骗了）
3. **链路真跑过一遍且看到了过滤结果**——调 `simulateEvent` 工具干跑：
   ```
   simulateEvent({ screenId: "9001_1", componentId: 900001, triggerType: "dataChange", throwValue: {...} })
   ```
   它加载的就是前端那份 `@screenwright/core` 和你刚写的过滤器 JS，`callbacks` 段的过滤结果是**真算出来的**。
   看到目标组件有过滤结果 → 本项通过，**到此为止，不要再委派校验 agent**。
   报错或结果不符预期、且自己诊断两轮仍定位不了 → 才调 `ask_dataFlowVerificationAgent`。
   - `throwValue` 直接传 JSON 对象（dataChange 可传整表数组），从触发组件的 data 取真实数据，不要编
   - **不要去 `scripts/` 下找脚本跑**，那条路已经不存在了
4. 所有 `listenArgs` 非空的组件（**含数据容器自身**）`openFilter: true`

API 接入的干跑须区分两段：容器过滤器用符合接口 schema 的响应体样例验证，再把其实际输出对象交给
`simulateEvent` 验证回调到图表。干跑不会替浏览器发 API 请求；运行时响应文件缺失只能说明尚未观测到请求，
不能据此判定配置失败，也不能把样例结果声称为真实接口取数成功。

只有「组件初始空白」「首次有数据后再也不更新」这两类**挂载时机**问题干跑验不到，
那时才需要 `execute_in_browser` 去浏览器里看。

## 七、什么时候仍然要去查 skill

上面是固定流程，下面这些是查询性的，**用时才查，不要开场就读**：

| 要什么 | 去哪 |
| --- | --- |
| 某个组件的 `option` / `data` 字段定义 | `sw-component-schema` 的 `references/components/<族>/<prop>.md` |
| 回调链路的源码级细节、字段真值出处、完整排错表 | `sw-data-flow` 的 `references/callback-chain.md` |
| 数据容器请求怎么配、api-registry 怎么查 | `sw-data-flow` 的 `references/configure-container.md` |
| 过滤器 / 绑定的字段级写法 | `sw-data-flow` 的 `references/create-filter.md`、`bind-target.md` |
| 验证失败后的逐段诊断 | `sw-data-flow` 的 `references/verify-flow.md` |
| 各类 action 的配置字段 | `sw-event-interaction` 的 references |
| vue 片段 / 大屏 hooks / 自定义组件 | 对应的 `sw-vue-part`、`sw-bigscreen-hooks`、`sw-agent-component` |
