# Step 5-6：目标组件绑定与数据转换

目标组件（如折线图、文本框等）需要通过过滤器接收数据容器抛出的 callbackArgs，并将其转换为自身的渲染格式。

---

## Step 5：了解目标组件的渲染数据格式

**必须先查询目标组件的 data 格式，再编写转换代码。**

激活 `sw-component-schema` skill，根据目标组件的 `prop`（如 `echartbar`、`fttext`、`echartLine`）查找对应的 schema 文档，确认：

- `data` 数组的元素结构（有哪些字段、类型是什么）
- 哪些字段是必填的

示例（fttext 文本框的 data 格式）：

```json
[{ "value": "要显示的文字" }]
```

示例（柱状图的 data 格式）：

```json
[{ "name": "分类名", "value": 数值 }]
```

---

## Step 6：创建目标组件的过滤器

### 6.1 命名过滤器

推荐命名格式：`{组件用途}-{组件类型}过滤器`

示例：`销售额-柱状图过滤器`

### 6.2 创建过滤器 JS 文件

路径：`screen_{screenId}/dataFilterArr/{filterName}.js`

过滤器从 `callbackArgs` 中读取数据容器抛出的字段，转换为目标组件渲染格式：

```js
(data, callbackArgs) => {
    // callbackArgs.salesData = 数据容器过滤器抛出的数据（数组）
    const list = callbackArgs.salesData ?? [];
    // 按目标组件 data 格式映射
    return list.map(item => ({
        name: item.category,
        value: item.amount
    }));
}
```

**注意：**

- `callbackArgs.{字段名}` 中的字段名，必须与数据容器 cbArgs 配置的 `target.value` 一致
- 返回的数组格式必须严格匹配目标组件的 data schema
- 第一次执行时 `callbackArgs` 可能为空，需做防御：`callbackArgs.rawData ?? []`

### 6.3 创建过滤器 JSON 配置文件

路径：`screen_{screenId}/dataFilterArr/{filterName}.json`

```json
{
  "name": "{filterName}",
  "callBack": ["salesData"],
  "callBackStatus": false,
  "bindComponent": [
    { "label": "目标组件中文名", "id": 目标组件ID }
  ],
  "checked": true,
  "notSaved": false,
  "tempPool": {
    "callBack": ["salesData"],
    "dataFormatter": ""
  },
  "show": true,
  "dataFormatter": "{filterName}.js"
}
```

- `callBack`：**过滤器的回调依赖声明**——`dataFormatter` 中用到的每个 `callbackArgs.xxx` 字段名都要在此列出，否则上游回调参数变更时过滤器不会重算。值与上游数据容器 `cbArgs[n].value.target.value` 一致。
- `tempPool.callBack`：保持与 `callBack` 同步（前端缓存字段）
- `bindComponent`：填写目标组件的 label 和 id

---

## Step 6.4：在目标组件 JSON 中配置 openFilter 和 listenArgs

读取目标组件文件，确保以下两处都已配置：

**1. 设置 `openFilter: true`（启用数据过滤器开关）：**

```json
"openFilter": true
```

如果组件 JSON 中没有这个字段或值为 `false`，过滤器不会执行，必须设置为 `true`。

**2. 在 `listenArgs` 数组中添加：**

```json
{
  "filterName": "{目标组件过滤器名}",
  "usageStatus": true,
  "callbackFields": []
}
```

- `filterName`：刚创建的目标组件过滤器名称
- `usageStatus`：`true` 表示启用
- `callbackFields`：**不要手填**，留 `[]`。它是派生值，由过滤器 JSON 的 `callBack` 自动对齐过来。
  前端**确实会读它**（`CallbackArguments.ts:205` 靠它登记监听方），只是不该由 agent 维护。
  详见 [callback-chain.md](callback-chain.md) §3。

> 过滤器依赖哪些回调参数，在 Step 6.3 的**过滤器 JSON 的 `callBack` 数组**里声明。

使用 `edit_files` 写回（组件路径自动触发前端推送）。

---

## 完整示例

**场景：** 数据容器抛出 `salesData`（销售列表），目标组件是折线柱形图（ID=3101069）

**目标组件过滤器 JS（销售额-折线图过滤器.js）：**

```js
(data, callbackArgs) => {
    const list = callbackArgs.salesData ?? [];
    return list.map(item => ({
        name: item.month,
        value: item.amount
    }));
}
```

**目标组件过滤器 JSON（销售额-折线图过滤器.json）：**

```json
{
  "name": "销售额-折线图过滤器",
  "callBack": ["salesData"],
  "callBackStatus": false,
  "bindComponent": [{ "label": "折线柱形图", "id": 3101069 }],
  "checked": true,
  "notSaved": false,
  "tempPool": { "callBack": ["salesData"], "dataFormatter": "" },
  "show": true,
  "dataFormatter": "销售额-折线图过滤器.js"
}
```

> `callBack: ["salesData"]` 与过滤器 JS 中读取的 `callbackArgs.salesData` 一一对应；上游数据容器抛出 `salesData` 时，本过滤器才会重新执行。

**目标组件 listenArgs 追加（通过 edit_files 修改 3101069.json）：**

```json
{
  "filterName": "销售额-折线图过滤器",
  "usageStatus": true,
  "callbackFields": []
}
```

> `callbackFields` 留 `[]` 不手填——回调依赖写在过滤器 JSON 的 `callBack` 里，由它派生。
> 但**别理解成"前端不读"**：前端靠它登记监听方。见 [callback-chain.md](callback-chain.md) §3。

---

## 检查清单

配置完成后，按以下清单验证：

- [ ] 数据容器：`path` 非空，`dataMethod` 正确，`dataSource` 已配置（走 `configureComponentData` 配的话这三项由工具保证）
- [ ] 数据容器：`listenArgs` 包含数据容器过滤器，`cbArgs` 包含对应的回调配置
- [ ] 数据容器过滤器：JS 文件存在；若该过滤器消费上游 callbackArgs（罕见），其 JSON 的 `callBack` 数组列出依赖的字段名
- [ ] 目标组件过滤器：JS 文件存在，从 `callbackArgs.{字段名}` 正确读取数据
- [ ] **目标组件过滤器 JSON 的 `callBack` 数组**：列出 `dataFormatter` 中用到的所有 `callbackArgs.xxx` 字段名（如 `["salesData"]`），`tempPool.callBack` 与之同步
- [ ] 目标组件：`openFilter` 为 `true`（过滤器开关已开启）
- [ ] 目标组件：`listenArgs` 包含目标组件过滤器（依赖声明写在过滤器 JSON 的 `callBack` 上，`callbackFields` 由它派生，不手填）
- [ ] 目标组件：`openFilter` 为 `true`——为 false 时监听注册整段被跳过（`CallbackArguments.ts:199`）
- [ ] 两个过滤器 JSON 的 `bindComponent` 分别包含各自绑定的组件
