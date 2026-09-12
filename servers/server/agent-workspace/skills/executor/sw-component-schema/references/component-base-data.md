# ComponentSchema - 数据源与数据配置字段

> Source: `packages/type/src/schemas/component.ts` + `packages/type/src/schemas/data.ts`

## 目录
1. [dataType - 数据类型枚举](#1-datatype---数据类型枚举)
2. [dataSource - 数据源对象](#2-datasource---数据源对象)
3. [data / dataQuery - 数据内容](#3-data--dataquery---数据内容)
4. [dataRemark - 数据映射配置](#4-dataremark---数据映射配置)
5. [url / path - 接口地址](#5-url--path---接口地址)
6. [listenArgs - 监听参数（过滤器输入）](#6-listenargs---监听参数过滤器输入)
7. [cbArgs - 回调参数（过滤器输出）](#7-cbargs---回调参数过滤器输出)
8. [openFilter - 过滤器开关](#8-openfilter---过滤器开关)
9. [数据分析字段](#9-数据分析字段)

---

## 1. dataType - 数据类型枚举

```ts
dataType: "STATIC" | "SQL" | "CSV" | "API" | "WEBSOCKET" | "IOT"
// 对应数值: 0        1       3       2       4             5
```

| 值 | 含义 |
|----|------|
| `"STATIC"` (0) | 静态数据，直接写在 `data` 字段中 |
| `"SQL"` (1) | SQL 数据库查询，需配置 `dataSource` 和 SQL 语句 |
| `"CSV"` (3) | CSV 文件数据 |
| `"API"` (2) | HTTP API 接口请求，需配置 `url` |
| `"WEBSOCKET"` (4) | WebSocket 实时数据推送 |
| `"IOT"` (5) | TCP/UDP 设备数据源，`dataSource` 使用下方 IoT 类型配置 |

---

## 2. dataSource - 数据源对象

`dataSource` 是一个联合类型，根据 `dataType` 存储不同的数据源配置：

### 数据库类型 (SQL/CSV)
```ts
{
  id: number,           // 数据库项 ID
  name: string,         // 数据库名称
  type: string,         // 数据库类型（mysql/postgresql等）
  url: string,          // 数据库连接 URL
  description: string,
  userId: number,
  dataGroupId: number | null,
  fileName: string,     // CSV 文件名
  size: number,
  charsetName: string,
  layerIds: string,
  createdBy/updatedBy/createdTime/updatedTime: string
}
```

### WebSocket 类型
```ts
{
  id: number,
  name: string,
  type: string,
  description: string,
  config: string,       // WebSocket 配置 JSON
  baseUrl: string,      // WebSocket 基础 URL
  dataGroupId: number | null,
  layerIds: string,
  ...审计字段
}
```

### IoT 类型
```ts
{
  id: number,
  name: string,
  type: string,
  desIp: string,        // 目标 IP 地址
  desPort: number,      // 目标端口
  localPort: number,
  charsetName: string,
  layerIds: number[],   // 注意：IoT 的 layerIds 是 number[] 而非 string
  dataGroupId: number | null,
  ...审计字段
}
```

静态数据时 `dataSource` 可为空记录 `{}`。

---

## 3. data / dataQuery - 数据内容

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | `any` | 静态数据或接口返回的缓存数据 |
| `dataQuery` | `string?` | 数据查询字符串（如 SQL 语句或 API 路径参数） |

---

## 4. dataRemark - 数据映射配置

```ts
dataRemark: Array<{
  key: string,          // 数据字段键名（来自数据源）
  map: string,          // 映射目标字段名（组件 option 中的字段）
  description?: string, // 字段描述（两种拼写均存在：description / decription）
  decription?: string   // 注意：存在历史拼写错误字段
}>
```

**作用**：将数据源字段映射到组件 `option` 中对应的配置项，实现数据驱动渲染。

---

## 5. url / path - 接口地址

| 字段 | 类型 | 说明 |
|------|------|------|
| `url` | `string?` | API 请求完整 URL（`dataType = "API"` 时使用） |
| `path` | `string?` | 资源路径，部分组件用于指定静态资源路径 |

---

## 6. listenArgs - 监听参数（过滤器输入）

```ts
listenArgs: Array<{
  filterName: string,       // 过滤器名称（对应画布中定义的 Filter.name）
  usageStatus: boolean,     // 该过滤器是否启用
  callbackFields: string[], // 监听的回调字段列表
  filterType?: boolean      // 过滤器类型
}>
```

**作用**：声明该组件监听哪些过滤器的输出，当过滤器触发时自动刷新组件数据。

---

## 7. cbArgs - 回调参数（过滤器输出）

```ts
cbArgs: Array<{
  id: string,       // 回调唯一 ID
  name: string,     // 回调名称
  type: string,     // 回调类型
  method: string,   // 回调方法名
  value: {
    origin: {
      displayName: "字段值",
      type: "input",
      value: string   // 原始数据字段名
    },
    target: {
      displayName: "变量名",
      type: "input",
      value: string   // 目标变量名（写入过滤器的字段）
    }
  }
}>
```

**作用**：当组件作为过滤器触发源时，定义将哪些字段值作为参数传出，驱动其他组件更新。

---

## 8. openFilter - 过滤器开关

```ts
openFilter?: boolean  // 是否启用过滤器联动功能
```

**这是消费侧的开关，跟"能不能抛"无关。**

- 组件作为**消费方**（`listenArgs` 里挂了过滤器）时必须为 `true`，否则监听整段不注册
  （`packages/core/src/events/CallbackArguments.ts:199`）、过滤器也不执行
  （`packages/core/src/filter/BaseFilter.ts:56`），两道门各拦一次
- 组件作为**发射方**（配了 `cbArgs`）时**不需要**为 `true`：发射路径
  `useEvent.handleEventAndCallbackEvent → handleEvents → dispatch → handleCallback`
  全程不检查 `openFilter`

> 一个组件既发射又消费时（典型是数据容器）当然要开——那是因为它在消费，不是因为它在发射。

---

## 9. 数据分析字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `enableDataAnalysis` | `boolean?` | 是否启用数据分析功能 |
| `dataAnalysisName` | `string?` | 数据分析配置名称（对应平台内的分析任务名） |

