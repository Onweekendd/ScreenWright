# 核心概念

## 三个关键概念

### 1. 数据容器（ft-dataContainer）

数据容器是大屏中专门负责请求 API 的组件。**规范：其他组件不直接请求接口，统一由数据容器代理。**

数据容器本身不渲染任何可见内容，它的职责是：
- 向配置好的 API 发起请求
- 将响应数据交给绑定的过滤器处理
- 将处理结果通过回调参数（cbArgs）广播给其他组件

### 2. 过滤器（Filter）

过滤器是一段 JS 函数，负责在"原始数据"和"渲染数据"之间做转换。

**函数签名：**

```js
(data, callbackArgs) => {
  return data;
}
```

- `data`：组件自身的数据。如果组件配置了 API，则是接口返回的原始响应。
- `callbackArgs`：全局变量，包含其他组件通过 cbArgs 抛出的所有数据。
- 返回值：组件用于渲染的数据，同时也会触发 cbArgs 的更新。注意 cbArgs 的 `origin.value` 取的是**实际抛出的那个对象**上的 key——数据是数组时抛出的是其中单个项（须为对象），数据是对象时抛出该对象本身（详见 create-filter.md 的 4.1）。

**文件组成（每个过滤器两个文件）：**

```
screen_{screenId}/dataFilterArr/
  {filterName}.json    ← 过滤器配置（元数据）
  {filterName}.js      ← 过滤器函数代码
```

> 过滤器名称在项目范围内必须唯一。

### 3. 回调参数（callbackArgs）

组件间传递数据的全局响应式管道。一句话：**源组件按 `cbArgs` 把值写进 `callbackArgs`，
同一时刻触发所有消费方的过滤器用新值重跑。**

**这一段不在这里展开——机制、字段真值、排错判据全在
[callback-chain.md](callback-chain.md)，那是唯一真相来源。**

配置前必读它，尤其是这几个坑：

- `cbArgs`（组件 JSON 字段）和 `callbackArgs`（运行时全局变量）不是一回事，写混会被静默丢弃
- `listenArgs[].callbackFields` 是派生值，不手填，但前端确实读它
- 回调抛出的唯一门禁是事件的 trigger 匹配，跟条件、跟动作都无关

---

## 文件路径速查

| 文件类型 | 路径 |
|---------|------|
| 组件配置 | `screen_{screenId}/component/{componentId}.json` |
| 过滤器 JSON | `screen_{screenId}/dataFilterArr/{filterName}.json` |
| 过滤器 JS | `screen_{screenId}/dataFilterArr/{filterName}.js` |
| API 注册索引 | `api-registry/{datasourceId}/index.json` |
| API 路径详情 | `api-registry/{datasourceId}/paths/{pathFileName}.json` |

路径文件名规则：`/customApi/foo/bar` → `customApi_foo_bar.json`（去掉开头斜杠，其余斜杠换成下划线）

---

## 数据流全景

```
API 接口
  ↓ HTTP 请求（数据容器配置的 path/method/body/query）
数据容器的过滤器
  data = API 原始响应
  ↓ 返回处理后的数据
cbArgs 抛出 → callbackArgs.rawData = 处理结果
  ↓ 触发重新执行
目标组件的过滤器
  callbackArgs.rawData 可用
  ↓ 转换为组件渲染格式
目标组件渲染
```
