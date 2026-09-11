# Step 3-4：创建过滤器与配置回调参数

数据容器需要一个过滤器来处理 API 响应，并通过 cbArgs 将数据抛出给其他组件。

---

> **前置检查：确认回调参数的触发事件**
>
> 如果该过滤器需要通过 `callbackArgs` 接收上游组件的数据（即 `callBack` 字段非空），需先确认上游组件已配置相应事件：
>
> 1. 读取 `_callback_flows/{回调参数名}.json`，查看 `emittedBy[n].onEvents`
> 2. 若 `onEvents` 为空数组，说明该组件还没有任何事件，需要补充：
>    - **数据容器**（ft-dataContainer）：用 `createEventTemplate` 添加 `dataChange` 触发器，**actions 传空数组**——数据容器没有行为，事件本身触发 `handleCallback` 即可
>    - **其他组件**（选项卡、图表等）：这些组件的事件是为自身交互目的配置的（如 click），**不要专门为抛出回调新增事件**。只要确保组件已有对应事件即可；若确实没有任何事件，再按实际交互目的补充一个，回调会随该事件自动触发
> 3. 只有事件触发后 `handleCallback` 才会将数据写入 callbackArgs，过滤器才会重新执行

---

## Step 3：创建过滤器

### 3.1 命名过滤器

过滤器名称在整个项目范围内唯一。推荐命名格式：`{数据用途}-数据容器过滤器`

示例：`销售数据-数据容器过滤器`、`用户列表-数据容器过滤器`

### 3.2 调用 create_data_filter 工具创建过滤器

使用 `create_data_filter` 工具，填写以下参数：

| 参数            | 说明                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `screenId`      | 大屏目录标识，格式 `"{screenId}_{versionCode}"`，如 `"29445_1"`                                   |
| `name`          | 过滤器名称（同 3.1 中命名）                                                                       |
| `bindComponent` | 要绑定的组件列表，格式 `[{ "label": "组件名", "id": 组件ID }]`；若尚未确定绑定对象，传空数组 `[]` |
| `callBack`      | （可选）回调变量名列表，默认为空 `[]`；可在创建后通过 `edit_files` 补充                            |

该工具会自动完成：

- 在 `screen_{screenId}/dataFilterArr/` 下写入 `{name}.json`（元数据）和 `{name}.js`（默认 formatter）
- 推送到前端，前端通过 `handleSaveFilter` 完成绑定和缓存更新

**默认生成的 JS 内容：**

```js
(data, callbackArgs) => {
  return data;
};
```

如需自定义过滤逻辑，创建后使用 `edit_files` 修改 `{name}.js`。

> 如需配 cbArgs 往下游抛数据，注意 `origin.value` 取的是**实际抛出的那个对象**上的 key，而非整个返回值（详见 4.1）。所以返回数组时，数组项必须是对象。

**示例：处理列表并抛出：**

```js
(data, callbackArgs) => {
  const list = data?.result ?? data ?? [];
  return { raw: list };
};
```

> **注意：** JS 文件内容只是函数表达式本身，不要加 `export` 或变量声明。

### 消费 `callbackArgs` 时必须写空值分支

**过滤器在组件挂载时会无条件先跑一次**（`useBaseFilter.ts` 的 `onMounted`），
那一次发生在任何上游抛出之前，`callbackArgs` 就是 `{}`。直接往下取值会当场抛错，
组件初始空白——**而且这跟回调配得对不对无关，只看配置文件查不出来**。

```js
// ❌ 首次执行必崩
(data, callbackArgs) => data.filter((d) => d.type === callbackArgs.selected.value);

// ✅ 空值时给合理的初始形态，通常是"不过滤，全量返回"
(data, callbackArgs) => {
  const selected = callbackArgs?.selected;
  if (!selected) return data;
  return data.filter((d) => d.type === selected);
};
```

过滤器的五个执行时机见 [callback-chain.md](callback-chain.md) §6。

---

## Step 4：配置数据容器的 cbArgs 和 listenArgs

### 4.1 添加 cbArgs（声明要抛出的字段）

在数据容器组件 JSON 的 `cbArgs` 数组中添加一项：

```json
{
  "id": "callback_{uuid}",
  "name": "回调",
  "type": "object",
  "method": "default",
  "value": {
    "origin": {
      "displayName": "字段值",
      "type": "input",
      "value": "raw"
    },
    "target": {
      "displayName": "变量名",
      "type": "input",
      "value": "rawData"
    }
  }
}
```

**字段解释：**

- `origin.value`：从**实际抛出的那个对象**中要取的字段名（见下方「origin.value 取的是什么」）。
- `target.value`：抛出到 callbackArgs 后的变量名。填 `"rawData"` 则其他组件用 `callbackArgs.rawData` 访问
- `id`：生成一个唯一 ID，格式 `callback_` + UUID（如 `callback_bebb3f62-7ea0-47bd-97ec-446db6d3b884`）

> **`origin.value` 取的是什么——必须是「实际抛出的那个对象」上的 key，不是整个返回值的 key。**
> 回调链路按 key 索引：源码 `CallbackArguments.handleCallback` 执行 `throwValue[origin.value]`，而 `throwValue` 是**单个对象**（不是整个数组）：
>
> - **数据是数组** → 抛出的是数组里的**单个项**（数据容器取第一项；选项卡等交互组件取点击/触发的那项）。所以**数组项必须是对象**，`origin.value` 填**项对象的 key**（如项是 `{ name, value }`，则填 `"name"` / `"value"`）。
> - **数据是对象** → 抛出的就是该对象本身，`origin.value` 填**该对象的 key**（如 `return { raw: list }` 配 `origin.value: "raw"`）。
>
> 任何情况下 `origin.value` 都不能填 `""`：抛出值恒为对象，`throwValue[""]` 必然是 `undefined`，回调参数不会被设置。

### 4.2 添加 listenArgs（绑定过滤器）

在数据容器组件 JSON 的 `listenArgs` 数组中添加一项：

```json
{
  "filterName": "{filterName}",
  "usageStatus": true,
  "callbackFields": []
}
```

- `filterName`：填写刚创建的过滤器名称
- `usageStatus`：`true` 表示启用
- `callbackFields`：**不要手填**，留 `[]`。它是派生值，由过滤器 JSON 的 `callBack` 自动对齐过来。
  注意前端**确实会读它**（`CallbackArguments.ts:205` 靠它登记监听方），只是不该由 agent 维护——
  排错时 `callBack` 非空而 `callbackFields` 为空，说明派生没跑、链路是断的。详见
  [callback-chain.md](callback-chain.md) §3。

> 过滤器依赖哪些回调参数，在**过滤器 JSON 的 `callBack` 字段**中声明。

### 4.3 配置过滤器的 callBack（如需监听回调参数）

如果该过滤器的执行依赖上游组件抛出的回调参数（即 `dataFormatter` 中用到了 `callbackArgs.xxx`），需在过滤器 JSON 的 `callBack` 数组中声明依赖的变量名：

用 `edit_files` 修改 `screen_{screenId}/dataFilterArr/{name}.json`：

```json
{
  "callBack": ["rawData"]
}
```

- 每项填写回调参数名（即上游组件 `cbArgs[].value.target.value`）
- 声明后，当对应 callbackArgs 更新时，过滤器才会重新执行

**只有确实用到了 callbackArgs 时才填写，不需要监听时保持 `[]`。**

### 4.4 更新过滤器 JSON 的 bindComponent

将数据容器的 `{ label, id }` 添加到过滤器 JSON 的 `bindComponent` 数组：

```json
{
  "bindComponent": [{ "label": "数据容器", "id": 3101064 }]
}
```

---

## 完整示例

**场景：** 数据容器 ID=3101064，过滤器名="销售数据-过滤器"，抛出字段名="salesData"

**调用 create_data_filter：**

```json
{
  "screenId": "29445_1",
  "name": "销售数据-过滤器",
  "bindComponent": [{ "label": "数据容器", "id": 3101064 }],
  "callBack": [],
  "dataFormatter": "(data) => [{ raw: data?.result ?? [] }]"
}
```

**上例一次写入 JS 并绑定组件，无需另调 edit_files。** `result` 只是响应字段示例，实际须按注册表 schema 解包（例如 `{ code, data }` 用 `data?.data`）。等价 JS：

```js
(data, callbackArgs) => {
  const list = data?.result ?? [];
  return [{ raw: list }];
};
```

**数据容器 cbArgs 追加：**

```json
{
  "id": "callback_abc123",
  "name": "回调",
  "type": "object",
  "method": "default",
  "value": {
    "origin": { "displayName": "字段值", "type": "input", "value": "raw" },
    "target": { "displayName": "变量名", "type": "input", "value": "salesData" }
  }
}
```

**数据容器 listenArgs 追加：**

```json
{
  "filterName": "销售数据-过滤器",
  "usageStatus": true,
  "callbackFields": []
}
```

> `callbackFields` 留 `[]` 不手填——它由过滤器 JSON 的 `callBack` 派生。要监听某个 callbackArg，写 `callBack`。
> 但**别理解成"前端不读"**：前端靠它登记监听方，派生没跑（`callBack` 非空而它为空）就是链路断点。见 [callback-chain.md](callback-chain.md) §3。

---

## 创建过滤器后的强制后续步骤

`create_data_filter` 调用成功后，**不要直接报告完成**，必须按顺序确认以下三项：

### ✅ 检查 1：数据容器 listenArgs 是否已写入

读取数据容器 JSON，确认 `listenArgs` 中存在该过滤器条目：

```json
{ "filterName": "过滤器名", "usageStatus": true, "callbackFields": [] }
```

若缺失，用 `edit_files` 追加到数据容器 JSON 的 `listenArgs` 数组。

### ✅ 检查 2：回调抛出组件是否已配置事件

如果数据容器配置了 `cbArgs`（要向下游抛出数据），读取 `_callback_flows/{argName}.json`（argName 为 `cbArgs[].value.target.value`）：

- `emittedBy[n].onEvents` **不为空** → 事件已配置，正常
- `emittedBy[n].onEvents` **为 `[]`** → 先看组件类型：
  - `sw-dataContainer` 在 `events` 为空时内置 `dataChange` 事件，仍会抛出过滤结果；不必为这个空数组查源码或重复补事件
  - 选项卡类组件需要 `click` 事件

若文件不存在，说明大屏尚未同步，暂不检查此项，但需提醒用户同步后验证。

### ✅ 检查 3：目标组件 openFilter 是否为 true

读取目标组件 JSON，确认 `openFilter: true`。若缺失或为 `false`，用 `edit_files` 修改：

```json
"openFilter": true
```

**三项全部通过后才可向用户报告配置完成。**
