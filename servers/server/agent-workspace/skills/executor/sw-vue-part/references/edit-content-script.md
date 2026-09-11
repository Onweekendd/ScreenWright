# 修改 vue2 片段的脚本（编辑 `<script>` / `generate` 时必读）

本文件只讲 **`.vue` 里 `<script>` 的 `generate` 函数体怎么写**。文件定位、改 → 检查循环、类型锚点的总规则见 [edit-content.md](edit-content.md) 与 [concepts.md](concepts.md)，不再重复。

## 1. generate 工厂的固定骨架

`<script>` 是一个 `function generate(info) { ... return <Vue2 Options 对象> }` 工厂。运行时由 funBI 注入真实 `info` 并调用，返回值是一份 **Vue 2 Options API** 组件选项（`name` / `data()` / `computed` / `watch` / `methods` / 生命周期）。

```js
function generate(info) {
  // 1) 解构 info，按需取字段（见下方 info 字段表）
  const { id, list, emitEvent, defaultFun } = info || {};

  // 2) 这里可写工具函数、常量、screenwright.sdk 调用等

  // 3) 必须 return 一个 Vue2 Options 对象
  return {
    name: "customCode",
    inject: ["main"],
    data() {
      return { dataList: list };
    },
    mounted() {},
    beforeDestroy() {}, // 注意 vue2 是 beforeDestroy，不是 vue3 的 beforeUnmount
    methods: {}
  };
}
```

硬性约束（违反会失去类型提示或导致回推失败）：

- 必须保持 `function generate(info) { ... }` 形式——**不要改成箭头函数、不要改函数名**。
- 必须 `return` 一个对象字面量；模板里用到的每个变量都要能在该对象（`data` / `computed` / `methods`）里找到来源，否则 `check-vue-part` 会报模板变量未定义。（`el-button` 等 Element Plus 组件已全局注册，不属于"模板变量"，可直接用。）
- 生命周期、`this` 取值一律按 **Vue 2 Options API**；`this` 指向组件实例，箭头函数内无法拿到 `this`。
- **不要动**顶部带 `@__vp_types__` 的 JSDoc 与末尾带 `@__vp_anchor__` 的 `export default generate(...)` 行（类型锚点，系统自动维护，回推时自动剥除）。

## 2. info 字段：数据过滤器结果在 `list`

`info` 是 funBI 注入的入参，类型来自 `@vue-part`（`types/vue-part.ts` 的 `VuePartInfo`）：

| 字段         | 类型                                | 说明                                                         |
| ------------ | ----------------------------------- | ------------------------------------------------------------ |
| `id`         | `number`                            | 组件 id                                                      |
| `list`       | `Record<string, any>[]`             | **绑定数据 / 数据过滤器执行后的结果**（来自组件 dataSource） |
| `emitEvent`  | `(eventName, payload?) => void`     | 触发交互事件的通信函数（见第 3 节）                          |
| `defaultFun` | `{ cloneDeep, debounce, throttle, axios, setMinioUrl, html2canvas, ElMessage, ElLoading }` | 内置工具：深拷贝 / 防抖 / 节流 / axios 实例 / minio 地址拼接 / 截图 / Element Plus 的消息提示(`ElMessage`)与 Loading(`ElLoading`) |

**规则：** `info.list` 是 vue2 组件执行数据过滤器后得到的结果。即便当前没直接用，也要**保留解构** `const { id, list } = info || {};`，以便后续逻辑/用户需要消费数据过滤器结果。用 `|| {}` 兜底，避免 `info` 为空时解构报错。

> 取数据后通常放进 `data()` 返回值（如 `dataList: list`）再到模板里渲染；过滤器结果结构以实际绑定数据为准，不要凭空假设字段名。

## 3. 触发交互事件：`emitEvent`

组件要把交互（点击、选中等）抛给大屏事件系统时，用 `info.emitEvent`，事件名固定为 `` `fireCustomCode_${id}` ``（也可用配置的自定义函数名 `` `fireCustomCode_${自定义名}` ``）：

```js
methods: {
  onClick(item) {
    if (id && emitEvent) {
      emitEvent(`fireCustomCode_${id}`, item); // 第二个参数是抛给下游的 payload
    }
  },
}
```

这是 vue-part 最常用、也最推荐的对外通信方式——大多数交互场景用 `emitEvent` 即可，无需动用下面的 SDK。

## 4. 大屏自定义 API：`screenwright.sdk`

vue2 片段运行在大屏环境中，全局注入了 `screenwright` 对象，可通过 `screenwright.sdk.<hook>()` 调用大屏的各类 hooks（该全局对象在 workspace tsconfig 下已声明类型，可被 `check-vue-part` 检查）：

```js
function generate(info) {
  const { id, list } = info || {};

  // 例：拿到全局组件实例 Map，按 id 访问其他组件
  const componentMap = screenwright.sdk.useGlobalComponentData();

  return {
    name: "customCode",
    mounted() {
      // ...在生命周期里使用 sdk 返回值
    }
  };
}
```

**使用 SDK 前的强制前提：**

> 这些大屏 hooks 的文档在 **`sw-bigscreen-hooks`** 这个 skill 里。动手前**必须**先查那份 skill——不能只读它的 `SKILL.md`，还要打开你要用的那个 hook 的具体 reference（如 `references/02-useGlobalComponentData.md`），确认它的**返回值结构、参数签名、调用时机**，再实现。否则极易写出签名/字段错误的代码。

常用 hook（用途/签名一律以 `sw-bigscreen-hooks` skill 文档为准，下表仅作索引）：

| Hook                                        | 一句话用途                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `screenwright.sdk.useGlobalComponentData()` | 获取全局组件树的各类 Map（如 `allComponentMap`，key 为组件 id，value 为组件实例），用于跨组件访问 |
| `screenwright.sdk.useEvent()`               | 事件触发入口（facade），主动触发其他组件的事件/行为                                               |
| `screenwright.sdk.useEventCallbacks()`      | 注册/执行全局事件回调（事件处理完成后并发执行），用于埋点、状态同步等横切逻辑                     |
| `screenwright.sdk.useDataFilter()`          | 全局数据过滤器的增删改查与组件绑定                                                                |

## 5. 改完务必跑类型检查

每次 `edit_files` 改完 `.vue` 后，**必须**按 [edit-content.md](edit-content.md) 的「类型检查（必须）」一节跑 `pnpm check-vue-part <相对路径>`，以退出码 0 为唯一通过依据。
