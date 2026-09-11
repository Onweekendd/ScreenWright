# Step 7：验证数据流链路

**核心原则：结论必须建立在「真跑一遍」的结果上，禁止只读静态文件就下 ✅。**

「真跑一遍」有两条路，覆盖面和代价都不同，**先跑便宜的那条**：

| | 覆盖什么 | 验不到什么 | 代价 |
|---|---|---|---|
| **7.0 `simulateEvent` 干跑** | trigger 匹配、条件是否满足、回调参数抛没抛出、**消费方过滤器真实算出的结果** | 挂载时机、渲染（显隐/动画/跳转只报告「会被触发」） | 本地几秒，不需要浏览器 |
| **7.1 `execute_in_browser` 运行时** | 上面全部 + 挂载时机 + 组件是否真的更新 | —— | 需要编辑器开着 |

7.0 不是「静态检查」：它加载的就是 `@screenwright/core` 那份编排和你刚写的那份过滤器 JS，与浏览器里是同一批纯函数，**它算出的过滤结果就是运行时会得到的结果**。

整体顺序：

1. **7.0（第一步）** 干跑 —— 跑 `simulateEvent`，看「回调参数」段有没有算出目标组件的过滤结果
2. **7.0 通过** → 配置正确性已确认，**直接报告 ✅**。只有当任务本身涉及**首屏/挂载表现**（组件初始空白、首次有数据之后不再更新）时，才继续跑 7.1——那两类问题只有浏览器看得出来
3. **7.0 报错或结果不符预期** → 进入 7.2~7.6 静态诊断定位并修复；自己诊断两轮仍定位不了，再跑 7.1，或升级给 `ask_dataFlowVerificationAgent`

> **不要在 7.0 已经通过之后还去委派 `ask_dataFlowVerificationAgent`。** 它能做的事是 7.0 的子集加一个浏览器调用；干跑已经把过滤结果算出来的情况下，委派换不来新信息，只是多烧一轮子 agent。

---

## 7.0 干跑验证（第一步）

```
simulateEvent({
  screenId: "{screenId}_{versionCode}",
  componentId: <抛出方组件 id>,
  triggerType: "<trigger>",
  throwValue: { ... }        // 抛出方 data[0] 的形状；dataChange 可传整表数组
})
```

- `componentId` 填**抛出方**（配了 `cbArgs` 的那个组件），不是消费方
- `throwValue` 从抛出方的 `data[]` / `dataRemark[]` 里取真实数据构造，直接传 JSON 对象，不要编
- 回执的 `summary` 是人话版三段：**事件**（trigger 匹配、条件满足与否）、**动作**（哪些组件会响应）、**回调参数**（消费方真算出来的过滤结果）；`events` / `actions` / `callbacks` 是同一内容的结构化版
- **不要去 `scripts/` 下找脚本跑**，那条路已经不存在了

**判定规则：**

| 「回调参数」段的输出 | 判定 | 下一步 |
|---|---|---|
| 目标组件有过滤结果，条数与内容符合预期 | ✅ 通过 | **结束**，输出 ✅ 报告；不必跑 7.1，也不必委派 |
| 目标组件有过滤结果但条数/内容不对 | ⚠️ 过滤器逻辑问题 | 改 `dataFormatter`，不是事件或绑定的问题 |
| 说「没有组件监听该回调参数」 | ❌ 消费侧没接上 | 进入 7.2（`consumedBy`）、7.4（`openFilter`） |
| 「事件」段说没有该 trigger 的事件 | ❌ 事件没配对 | 回 Step 2 改 `trigger` |
| 「事件」段显示条件不满足 | ⚠️ 条件与实际数据不匹配 | 检查条件的字段名 / compare / expected |
| 脚本本身报错（模块找不到、参数解析失败等） | 🟡 干跑不可用 | 照脚本打印的提示改一次；仍不行则转 7.1 或静态诊断，并在报告里标注「干跑不可用」 |

---

## 7.1 运行时验证（挂载/渲染问题，或 7.0 跑不起来时）

**这是唯一能验到「挂载时机」和「组件真的更新了没」的手段。** 7.0 跑的是「抛一次值」那一刻，覆盖不到首屏；两类问题只有这里看得见：组件初始空白、首次有数据之后不再更新。

配置正确性本身 7.0 已经能定，**不要为了走流程再跑一遍这里**。

对每个已配置过滤器的目标组件，调用：

```javascript
window.screenwright.sdk.useDataFilter().getFilterResultsByComponentId('组件ID')
```

通过 `execute_in_browser` 工具执行，返回结构：

```json
{
  "success": true,
  "results": [
    {
      "filterName": "过滤器名称",
      "inputData": [...],
      "outputData": [...],
      "success": true,
      "error": null
    }
  ]
}
```

**判定规则：**

| 运行时返回 | 判定 | 下一步 |
|---|---|---|
| `success: true` 且 `results` 非空 且 `results[n].success === true` 且 `outputData` 非空 | ✅ 通过 | **结束**，输出 ✅ 报告，不必跑静态检查 |
| `success: true` 但 `results` 为空 | ❌ 过滤器从未执行 | 进入 7.2 诊断回调链路、7.3 数据容器绑定、7.4 openFilter |
| `results[n].success: false` | ❌ 过滤器抛异常 | 看 `error` 字段，进入对应 7.x 修复 |
| `outputData` 为空数组 | ⚠️ 过滤器跑了但没数据 | 进入 7.2 诊断 inputData 是否进来、`dataFormatter` 逻辑 |
| `outputData` 非空但对象中缺少 `cbArgs[].value.origin.value` 字段 | ⚠️ 过滤器有数据但字段不匹配 | 进入 7.6 诊断 origin 字段与过滤器输出匹配 |
| `execute_in_browser` 工具本身报错（连接异常 / sdk 未挂载等技术错误） | 🟡 运行时不可达 | 在报告里**显式标注**「运行时不可达」。若 7.0 已通过，配置正确性的 ✅ 仍然成立，只是挂载/渲染那一层没验到；若 7.0 也没跑通，则只剩静态诊断，**不能**仅凭静态检查写 ✅ |

**禁止：**

- 禁止在既没跑 7.0 也没跑 7.1 的前提下给 ✅——两条路至少走通一条
- 禁止跑了运行时但 `results` 为空 / `outputData` 为空时，绕过静态诊断直接给 ✅
- 禁止 7.0 或 7.1 通过后还把 7.2~7.6 全跑一遍（浪费且无意义）

---

## 7.2 静态诊断：验证回调参数链路（\_callback_flows）

针对每个刚配置的 `cbArgs`，用 `cbArgs[].value.target.value`（即抛出的变量名）直接读取对应文件：

```
read_file({ path: "screen_{screenId}/_callback_flows/{argName}.json" })
```

**检查项：**

| 检查项                         | 期望值                                           | 问题说明                                           |
| ------------------------------ | ------------------------------------------------ | -------------------------------------------------- |
| `emittedBy` 不为空             | 至少一项                                         | 没有组件抛出该回调参数，cbArgs 未配置              |
| `emittedBy[n].onEvents` 不为空 | 包含触发事件（如 `["dataChange"]`、`["click"]`） | 该组件未配置事件，回调永远不会触发                 |
| `consumedBy` 不为空            | 至少一项                                         | 没有过滤器消费该参数，过滤器 `callBack` 未配置     |
| `consumedBy[n].boundTo` 不为空 | 包含目标组件                                     | 过滤器未绑定组件，或目标组件 `openFilter` 为 false |

**常见问题与修复方向（仅诊断，不直接动手改；改由 swExecutorAgent 执行）：**

- `emittedBy[n].onEvents` 为 `[]` → 该组件没有任何事件，在报告中标注需补事件：
  - **数据容器**（ft-dataContainer）：需补 `dataChange` 触发器，actions 为空数组
  - **其他组件**：按实际交互目的补事件（如选项卡补 click），回调会随该事件自动触发；不要专门为抛出回调新增事件
- `consumedBy` 为空 → **这是真实的配置错误，不是"快照问题"或"不影响功能"**。说明下游过滤器的 `callBack` 字段没有声明该参数名，或消费方组件的 `openFilter` 不为 `true`。在报告中标注两处需核查的位置：
  1. 消费方过滤器 JSON 的 `callBack` 数组是否包含该参数名
  2. 消费方组件 JSON 是否 `openFilter: true`

---

## 7.3 静态诊断：验证事件-行为链路（\_event_flows）

> **适用范围**：不适用于数据容器（`ft-dataContainer`）——数据容器的 dataChange 事件 `actions` 本身就是空数组，这是正常设计，**跳过 7.2 检查，不标记 ❌**。此检查仅对通过事件行为直接控制其他组件的组件执行（如切换动态面板状态、显示/隐藏等）。

对于满足上述条件的组件，读取其事件流文件：

```
read_file({ path: "screen_{screenId}/_event_flows/{sourceComponentId}.json" })
```

**检查项：**

| 检查项                 | 期望值                        | 问题说明                                  |
| ---------------------- | ----------------------------- | ----------------------------------------- |
| 文件存在且不为空       | 包含至少一个事件条目          | 该组件未配置任何事件                      |
| `targets` 不为空       | 包含目标组件 id 和 actionType | 事件行为未填写目标组件，或 token 格式错误 |
| `targets[n].name` 非空 | 目标组件的名称                | ID 有效但名称为空（组件可能已删除）       |

---

## 7.4 静态诊断：验证数据容器过滤器绑定

读取数据容器组件 JSON，检查 `cbArgs` 与 `listenArgs` 的对应关系：

| 检查项 | 期望值 | 问题说明 |
|--------|--------|---------|
| `cbArgs` 非空时 `listenArgs` 也非空 | `listenArgs` 至少包含一个过滤器条目 | `cbArgs.origin.value` 从过滤器返回值中取字段，没有过滤器则返回值不存在，该字段永远是 undefined，callbackArgs 无法正常抛出 |
| `listenArgs[n].usageStatus` | `true` | 过滤器条目存在但未启用 |

若 `cbArgs` 非空但 `listenArgs` 为空，报告：**❌ 数据容器过滤器绑定缺失（listenArgs 为空，cbArgs 声明的数据没有过滤器处理）**

---

## 7.5 静态诊断：验证 openFilter

**`listenArgs` 数组非空的组件都需要 `openFilter: true`**，不仅限于下游图表组件，数据容器（ft-dataContainer）本身也不例外。

> `listenArgs` 为空的组件跳过此检查，不标记 ❌。若数据容器因 7.3 报告了"过滤器绑定缺失"，修复 7.3（补充 listenArgs）后，再对该组件执行 7.4 检查。

逐一读取每个 `listenArgs` 非空的组件 JSON，确认 `openFilter: true`：

```
read_file({ path: "screen_{screenId}/component/{componentId}.json" })
```

若 `openFilter` 缺失或为 `false`，在报告中标注 ❌，写明组件 ID 与期望值 `"openFilter": true`，由执行类 agent（swExecutorAgent）修复，本 agent 不直接改文件。

> 典型遗漏：只给折线图设置了 `openFilter: true`，忘记给数据容器也设置，导致数据容器的过滤器不执行，callbackArgs 里没有数据。

---

## 7.6 静态诊断：验证 cbArgs origin 字段与过滤器返回值匹配

对每个有 `cbArgs` 的源组件，验证 `cbArgs[].value.origin.value` 声明的字段在过滤器返回的数据中确实存在。

**核心逻辑：** 过滤器返回 `{ a: 123 }` 这样的对象，`cbArgs` 的 `origin.value` 声明了要从该对象中取哪些字段。如果 `origin.value` 对应的 key 在过滤器返回对象中不存在，`throwValue[originKey]` 永远是 `undefined`，回调参数无法被设置，数据无法传递给下游组件。

**静态判定时**，通过源组件的 `dataRemark` 做字段匹配——`origin.value` 只需匹配 `dataRemark[].key` 或 `dataRemark[].map` 其中之一即可：

```
cbArgs[].value.origin.value ∈ { dataRemark[].key ∪ dataRemark[].map }
```

### 运行时判定

在 7.1 的 `outputData` 已拿到的情况下，直接比对：

```
源组件 cbArgs[].value.origin.value 的每个字段 → outputData[0] 的 key 中是否存在
```

### 静态判定（运行时不可达时）

读取源组件 JSON：

```
read_file({ path: "screen_{screenId}/component/{sourceComponentId}.json" })
```

**检查项：**

| 检查项 | 期望值 | 问题说明 |
|--------|--------|---------|
| `origin.value` 匹配 `dataRemark` 中任意一项的 `key` 或 `map` | 每个声明的 origin 字段都在 `dataRemark` 中有对应 | `origin.value` 声明了一个源数据中不存在的字段，`throwValue[originKey]` 为 `undefined`，回调参数无法设置 |
| `dataRemark` 非空 | 至少一项映射 | `cbArgs` 存在但 `dataRemark` 为空，无法确认字段是否存在，需运行时验证 |

**常见问题与修复方向（仅诊断，不直接动手改；改由 swExecutorAgent 执行）：**

- `origin.value` 不在 `dataRemark` 的 `key` 或 `map` 中 → 源数据不包含 cbArgs 期望的字段，在报告里标注以下任一可能根因即可：
  1. 过滤器的 `dataFormatter` 未输出该字段 → 需补字段
  2. 字段名不匹配（如过滤器返回 `name` 但 `origin.value` 写的是 `label`）→ 需对齐字段名
  3. 字段存在但 `dataRemark` 缺映射 → 需在 `dataRemark` 补 `key` 或 `map` 条目

---

## 无需检查的字段（不影响数据流）

以下字段在过滤器 JSON 中**存在**，但不控制数据流链路是否正常工作，验证时**不要检查也不要修改**：

| 字段名           | 位置                                  | 说明                                                           |
| ---------------- | ------------------------------------- | -------------------------------------------------------------- |
| `callBackStatus` | 过滤器 JSON（`dataFilterArr/*.json`） | 前端 UI 状态字段，不影响过滤器执行。**不需要检查，不需要修改** |

> 过滤器是否对某个组件生效，完全由该**组件** JSON 中 `listenArgs[n].usageStatus: true` 决定，与过滤器自身的 `callBackStatus` 无关。

---

## 通过标准

判定为 ✅ 必须满足以下**任一**条件：

**A-0.（首选，最常见）7.0 干跑通过**

`simulateEvent` 回执的 `callbacks` 段里，目标组件有过滤结果且条数/内容符合预期。

满足这一条即可输出 ✅，**无需**跑 7.1，**无需**附加静态检查，**无需**委派校验 agent。报告里说明结论来自干跑即可——除非任务本身涉及首屏/挂载表现，那时才补 7.1。

**A-1. 7.1 运行时验证通过**

- `success: true`
- `results` 非空
- 每个 `results[n].success === true`
- 每个 `results[n].outputData` 非空

满足上述 4 项即可输出 ✅，**无需**附加静态检查。

**B.（兜底）两条真跑路径都不可达 + 静态全 ✅**

仅当 7.0 干跑跑不起来、且 `execute_in_browser` 也因技术原因（连接异常、sdk 未挂载等）取不到运行时数据时，才能退回静态判定，且必须：

1. 每个被依赖的回调参数在 `_callback_flows` 中存在对应文件
2. `emittedBy[n].onEvents` 非空（事件已配置）
3. `consumedBy` 非空（过滤器 `callBack` 已声明该参数名）
4. **数据容器 `cbArgs` 非空时，`listenArgs` 也非空**（过滤器已绑定）
5. **所有 `listenArgs` 非空的组件**（包括数据容器）`openFilter: true`
6. **所有有 `cbArgs` 的源组件**，其 `cbArgs[].value.origin.value` 声明的字段在 `dataRemark` 的 `key` 或 `map` 中有对应项（或运行时 `outputData` 对象的 key 中存在）

且报告里必须显式标注"运行时不可达，本结论仅基于静态检查"，让上游知道结论的强度。

**禁止的情形：**

- 7.0 和 7.1 一条都没跑通 → 不允许出 ✅
- 7.0 已显示「没有组件监听该回调参数」，或 7.1 已显示 `results` 为空 / `outputData` 为空 → 不允许仅凭 7.2~7.6 静态全过就出 ✅，必须修到真跑能出结果为止
