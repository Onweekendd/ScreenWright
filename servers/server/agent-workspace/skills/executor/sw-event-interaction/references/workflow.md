# 操作流程

### Step 1：定位源组件文件

从 `<screen-info>` 获取 workspace 目录（`screen_{screenId}_{versionCode}`），然后读取源组件的 JSON 文件：

```
workspace/screen_{id}/component/{componentId}.json
```

组件 JSON 中的 `events` 数组即为该组件的事件列表，`component.prop` 字段是组件标识。

### Step 2：批量查询可用事件和行为

收集所有涉及的源组件 prop 和目标组件 prop，分别批量调用：

- `listAvailableEvents([prop1, prop2, ...])` 一次查询所有源组件支持的触发事件
- `listAvailableActions([prop1, prop2, ...])` 一次查询所有目标组件支持的行为

- 根据用户描述，从返回列表中选择合适的 `value`（即 EventTypeEnum / ActionTypeEnum 值）
- 若列表中没有用户期望的触发类型或行为 → **告知用户**

> 如需了解某个触发类型的含义，可查阅 [event-types.md](event-types.md)。
> 如需了解某个行为类型的含义，可查阅 [action-types.md](action-types.md)。

### Step 3：创建完整事件

**创建新事件时，优先使用 `createEventTemplate` 一次性完成事件/条件/行为的配置**，不要拆散成多步调用：

调用 `createEventTemplate({ eventName?, triggerType?, conditions?, actions? })` 传入对象参数，工具会返回完整的、经过 `EventSchema` 校验的事件对象。

- `conditions`：条件列表，按需传入（可选）
- `actions`：行为列表，传入目标组件 ID 和行为类型即可（可选）

将返回的事件对象 push 进组件 JSON 的 `events[]` 数组。

> 只有在向**已有事件**中追加行为或条件时，才单独使用 `createActionTemplate` 或 `createConditionTemplate`。

### Step 4：写回组件文件并校验

将完整的事件对象 push 进组件 JSON 的 `events[]` 数组，然后用 `edit_files` 写回：

```
edit_files({ files: [{ path: "…/component/{componentId}.json", edits: [{ old_string: "…", new_string: "…" }] }] })
```

路径含 `/component/` 时会在写入前对整个组件 JSON 进行 Zod 校验：

- **校验失败** → 返回字段错误，文件不变，修正后重试
- **校验通过** → 写入文件并自动同步到前端

### Step 5：模拟验证（必须执行）

事件配置完成后，**必须**调 `simulateEvent` 工具验证事件是否按预期触发：

```
simulateEvent({
  screenId: "29464_1",
  componentId: 2920414,          // 源组件（触发事件的那个）
  triggerType: "click",
  throwValue: { "value": "bar" } // 源组件 data[0] 的形状，取真实数据
})
```

- `throwValue` 从源组件的 `data[]` 或 `dataRemark[]` 中取实际数据构造，直接传 JSON 对象，不要编
- 它跑的是前端那份编排（@screenwright/core）。回执的 `summary` 是人话版三段：**事件**（trigger 匹配情况、
  条件是否满足）、**动作**（哪些组件会响应）、**回调参数**（消费方真算出来的过滤结果）；
  `events` / `actions` / `callbacks` 是同一内容的结构化版。动作本身不执行——Node 里没有 DOM，
  显隐/动画/跳转只报告会被触发
- **不要去 `scripts/` 下找脚本跑**，那条路已经不存在了

**判断依据**（按「事件 → 动作 → 回调参数」三段逐段往下看）：

- 「事件」段显示 `没有 trigger 为 xxx 的事件` → 事件的 `trigger` 类型配错了
- 「事件」段显示 `条件不满足` → 检查条件的字段名、compare、expected 是否与实际数据匹配
- 目标组件出现在「动作」段 → 事件配置正确 ✅
- 配了回调参数，但「回调参数」段说没有组件监听 → 检查消费方 `listenArgs.callbackFields` 与源组件 `cbArgs` 的 target 是否对得上
- 「回调参数」段有输出但条数不对 → 过滤器的 `dataFormatter` 逻辑问题，不是事件配置问题

### Step 6：删除/修改操作

**修改已有事件/行为/条件**：

1. 读取组件 JSON 文件
2. 在 `events` 数组中找到对应 `id` 的事件
3. 直接修改对象字段（或其 `actions[]`/`conditions[]` 中的对应项）
4. 用 `edit_files` 写回

**删除事件**：从 `events[]` 中 filter 掉对应 `id` 的事件，用 `edit_files` 写回

**删除行为**：从事件的 `actions[]` 中 filter 掉对应 `id` 的行为，写回

**删除条件**：从事件的 `conditions[]` 中 filter 掉对应 `id` 的条件，写回
