# Step 2：配置数据容器请求参数

数据容器（sw-dataContainer）组件已创建并推送到画布后，需要配置它请求哪个接口。

---

## 用 `configureComponentData` 一步配完

```
configureComponentData({
  componentRef: "{screenId}_{versionCode}/{componentId}",
  datasourceId: 501,
  apiPath: "/api/production/lines",
  method: "get",          // 该路径只声明了一种方法时可省
  dataSite: "data"        // 响应形如 { code, data: [...] } 时填 data
})
```

工具会校验数据源与路径、写全 `dataType` / `dataSource`（含 `config`）/ `url` / `path` /
`dataMethod` / `requestHeader` / `requestBody`，并推送到前端。

**不要自己拼这些字段**，也不要为了确认字段名去 `grep` skills 或组件文件——
`url` 与 `dataSource.config.baseUrl` 必须严格相等（`apiFilter` 不等就会把两段拼起来，
拼出一个打不通的地址），这类约束由工具保证，手写很容易错。

### 不知道有哪些数据源 / 哪些接口？

**别去列 `api-registry` 目录，也别猜。** 把参数留空调用，工具会报错并列出全部可选项：

- 不传 `datasourceId` → 列出当前可用的全部 API 数据源
- 不传 `apiPath` → 列出该数据源已注册的全部接口路径
- `method` 与该路径声明的不符 → 列出它支持的方法

路径写错是最常见也最隐蔽的错：`/api/production/list` 比真实的 `/api/production/lines`
更「像」一个接口，写进磁盘完全合法，Zod 一个字都不会说，只有真发请求时才 404。
交给工具校验，这类错当场就被挡住。

---

## 回执里的 `fields` 才是重点

```jsonc
{
  "success": true,
  "fields": [
    { "name": "name",   "type": "string" },
    { "name": "output", "type": "number", "description": "当日已产（件）" },
    { "name": "target", "type": "number", "description": "当日目标（件）" }
  ],
  "sample": [{ "id": "L01", "name": "SMT 一线", "output": 5280 }],
  "probed": true
}
```

**Step 3 写 `dataFormatter` 时按 `fields` 里的名字取值。** 不要凭接口名或业务语义去猜字段名——
猜出来的 `dataFormatter` 在磁盘上完全合法、校验也全过，只有真取数时才发现一片空白。

`probed` 说明这份字段表的来路，必须区别对待：

| `probed` | 含义 | 怎么用 |
|---|---|---|
| `true` | 真发过一次请求，字段与类型是实测的 | 直接照着写 |
| `false` | 接口没探通，字段来自接口文档声明 | 照着写，但要告诉用户「真实请求尚未验证」 |

---

## 动态参数：变量占位符

`requestBody` / `requestHeader` / `dataQuery` 里支持从 `callbackArgs` 取值：

```
${变量名}          ← 无值时为空
${变量名||默认值}   ← 无值时用默认值
```

示例：`requestBody: { "screenId": "${screenId||30028}" }`

---

## 要改已经配好的请求

再调一次 `configureComponentData` 覆盖即可。只改某一个字段（比如换个 `dataQuery`）时，
用 `edit_files` 直接改组件 JSON 也可以——但凡是动到 `dataSource` / `url` / `path` /
`dataMethod` 的，一律走工具，避免破坏 `url` 与 `baseUrl` 的一致性。

---

## 注意事项

- 数据容器自己也要 `openFilter: true`，否则响应进不了过滤器（见 Step 3）
- 没有浏览器运行时的环境里画布不会真发请求；此时以工具回执的 `fields` 为准，
  并在交付说明里写明真实请求尚未验证
