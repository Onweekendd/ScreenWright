# 数据容器 (ft-dataContainer)

> **它的正事是取数，不是显示文本。** 下面那些 option 字段（字号、颜色…）是它作为一个
> 可见组件的外观配置，实际用法里数据容器通常摆在画布外、不给人看——它存在的意义是
> 发请求、把响应抛给下游组件。

## 怎么配它请求哪个接口

**用 `configureComponentData`，不要手写组件 JSON、也不要 grep 找字段名：**

```
configureComponentData({
  componentRef: "{screenId}_{versionCode}/{componentId}",
  datasourceId: 501,
  apiPath: "/api/production/lines",
  dataSite: "data"
})
```

参数留空调用会报错并列出全部可选数据源 / 接口路径。回执里的 `fields` 是这个接口能取出的
字段清单，写过滤器的 `dataFormatter` 时照它取值。

完整流程见 `sw-data-flow` skill 的 `references/configure-container.md`。

## 请求相关字段（由上面的工具写入，列在这里供排查用）

| 字段 | 类型 | 说明 |
|------|------|------|
| dataType | number | API 为 `2`；新建默认是静态 `0` |
| dataSource | object | `{ id, name, config }`，`config` 是含 `baseUrl` 的 JSON 字符串 |
| url | string | 必须**严格等于** `dataSource.config` 里的 `baseUrl`，不等会被 apiFilter 拼接成打不通的地址 |
| path | string | 接口路径；为空或以 `/` 结尾时 apiFilter 拒发请求 |
| dataMethod | string | `get` / `post` / `put` / `delete`，小写 |
| dataQuery | string | GET 的 query 串，如 `page=1&size=20` |
| requestBody | object | POST/PUT 的 body |
| requestHeader | object | 请求头 |
| openFilter | boolean | 容器**自己也要**设 true，否则响应进不了过滤器 |

`requestBody` / `requestHeader` / `dataQuery` 支持 `${变量名}` 与 `${变量名||默认值}`，
取值来自 `callbackArgs`。

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| text | string | 文本内容 |

## option 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | string | "" | 文本内容 |
| fontFamily | string | "Source Han Sans CN-Normal, Source Han Sans CN" | 字体 |
| fontSize | number | 32 | 字号 |
| color | string | "rgba(255, 255, 255, 1)" | 字体颜色 |
| fontStyle | string | "normal" | 字体样式 |
| fontWeight | string | "normal" | 字重 |
| backgroundColor | string | "rgba(0, 0, 0, 0)" | 背景颜色 |
