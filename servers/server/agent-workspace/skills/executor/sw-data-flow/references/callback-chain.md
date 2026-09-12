# 回调链路（权威页）

**这一页是 `cbArgs` / `callbackArgs` / `listenArgs` / `callBack` / `openFilter` 五个名字的唯一真相来源。**
其他 skill 提到这些字段时一律指回这里，不要在别处重新解释。

每条结论后面都标了源码位置（相对仓库根）。**行为有疑问时读源码，不要信任何一篇文档的转述——包括这一篇。**
本页写于 2026-09-04，依据 `packages/core` 当时的实现。

---

## 一、先分清两个最容易写混的名字

| 名字 | 是什么 | 出现在哪 | 谁写它 |
| --- | --- | --- | --- |
| `cbArgs` | **组件 JSON 的字段名**，声明"我要抛出什么" | `screen_*/component/{id}.json` 的顶层 | agent 手写 |
| `callbackArgs` | **运行时全局变量**，过滤器函数的第二个入参 | 过滤器 JS 代码里 `(data, callbackArgs) => ...` | 引擎运行时填 |

**它们不是同一个东西，也不能互相替代。**

组件 JSON 里写 `"callbackArgs": [...]` 是**无效配置**——`ComponentFlatSchema` 顶层不是 `.strict()`，
不认识的键会被静默丢弃，落盘后 `cbArgs` 仍是空数组，链路整条不通且没有任何报错。
（校验器现在会对这种情况发一条 warning，见 `src/mastra/tools/file/utils.ts` 的 `unrecognizedTopLevelKeys`，
但**警告不阻断落盘**，看到了必须自己改。）

反过来，过滤器 JS 里写 `cbArgs.xxx` 同样是错的——运行时没有这个变量，只有 `callbackArgs`。

---

## 二、完整链路

```
源组件（抛出方）                          消费组件（监听方）
─────────────                          ─────────────
events[].trigger 匹配用户操作
        ↓ 匹配上才继续（唯一门禁，见 §4）
cbArgs[].value.origin.value
        ↓ 从抛出对象里取这个 key
cbArgs[].value.target.value
        ↓ 作为变量名写入全局
   callbackArgs.{target.value}  ←──── 过滤器 JS 用 callbackArgs.xxx 读到
        ↓ 通知所有监听方                        ↑
listenArgs[].callbackFields 里            openFilter 必须为 true
含有该变量名的组件被重算                    （见 §3 的硬门禁）
        ↑
   由过滤器 JSON 的 callBack 派生而来
```

### 五个字段各自的位置

| 字段 | 写在哪个文件 | 作用 |
| --- | --- | --- |
| `cbArgs[]` | 源组件 JSON | 声明抛出：从哪取（`origin`）、叫什么名（`target`） |
| `events[]` | 源组件 JSON | 提供触发时机；没有它 `cbArgs` 永远不抛 |
| `callBack[]` | `dataFilterArr/{name}.json` | **agent 该写的地方**：过滤器依赖哪些回调变量 |
| `callbackFields[]` | 消费组件 JSON 的 `listenArgs[]` | **派生值，别手写**：真正决定组件是否被通知 |
| `openFilter` | 消费组件 JSON | 硬开关，false 则整个监听注册被跳过 |

---

## 三、`callbackFields` 是派生值，但前端确实读它

这一条过去在 `create-filter.md` 里被写成「前端不读此字段」，**那是错的**，而且错得很有害。

**前端读的正是它。** 注册监听方的代码只看 `callbackFields`，根本不看过滤器的 `callBack`：

```ts
// packages/core/src/events/CallbackArguments.ts:192-221
private registerTargetComponents(component) {
  const { listenArgs, name, id, openFilter } = component;
  if (!listenArgs || listenArgs.length === 0 || !openFilter) return;   // :199 硬门禁
  listenArgs.forEach((arg) => {
    const { callbackFields, filterName } = arg;
    callbackFields.forEach((field) => {                                 // :205 只认这个
      ... 把本组件登记为 field 的 target ...
    });
  });
}
```

`callbackFields` 为 `[]` → 内层 forEach 一次都不跑 → **该组件根本没被登记成监听方**，链路是断的。

**正确的说法是：它由过滤器的 `callBack` 自动派生，所以 agent 不该手填。**

```ts
// packages/core/src/managers/DataFilterManager.ts:248-258
addListenArgs(filter, component) {
  component.listenArgs.push({
    filterName: filter.name,
    usageStatus: true,
    callbackFields: [...filter.callBack]        // :256 从 callBack 拷过来
  });
}

// packages/core/src/managers/DataFilterManager.ts:316-332
processCallbackRelations(filterName, component) {
  const filterCallbacks = dataFilter[filterName]?.callBack ?? [];       // :324
  ... 增量对齐 ...
  this.updateComponentCallbacks(filterName, filterCallbacks, component); // :331 写回
}
```

### 排错时这个区别是决定性的

派生只在 `saveFilterWithBindings` 走过时才发生（`DataFilterManager.ts:183` 调 `processCallbackRelations`）。
agent 直接改文件、或改了 `callBack` 却没让保存流程跑过，派生就没发生。

所以看到 `callbackFields: []` 时：

- 按错误的旧说法（「前端不读」）→ 判断"正常，跳过" → **漏掉真正的断点**
- 按源码 → 判断"派生没跑，链路断了" → 去查 `callBack` 填了没、保存流程走了没

**判据**：`callBack` 非空但 `callbackFields` 为空 = 派生没发生，链路必断。

---

## 四、回调抛出的唯一门禁是 trigger 匹配

「配了 `cbArgs` 就会自动抛数据」是错的，但真实机制跟多数文档的说法不一样。

抛出动作嵌在**逐个匹配事件**的循环里：

```ts
// packages/core/src/managers/EventDispatcher.ts:126-152
const plannedEvents = planEventActions({ events, triggerType, curInfo, ... });
for (const { actions, isConditionSatisfied } of plannedEvents) {
  if (actions.length) { ...执行动作... }
  if (throwCallback && sourceComponent) {
    tasks.push(dispatchCallback({ sourceComponent, throwValue }));   // :148
  }
}
```

而 `plannedEvents` 只按 trigger 筛，**不按条件筛**：

```ts
// packages/core/src/selectors/eventPolicy.ts:61-79
return selectMatchingEvents(events, triggerType).map((event) => {
  const isConditionSatisfied = !conditions.length ? true : checkConditionSatisfied(...);
  if (isExecuteOnlyConditionSatisfied) {
    return { actions: isConditionSatisfied ? actions : [], isConditionSatisfied };  // :70
  }
  ...
});
```

由此得出三条**在别处都没写过**的行为：

1. **没有 trigger 匹配的事件 → `plannedEvents` 为空 → 循环不进 → 回调一次都不抛。**
   这才是"必须配事件"的真实原因，跟"事件里有没有动作"无关。
2. **条件不满足时，动作被清空，但回调照抛。** 条件只影响 `actions`，`throwCallback` 分支不受它管。
   想用条件卡住回调是做不到的。
3. **N 个 trigger 匹配的事件 = N 次抛出。** 同一个组件配了两个 `click` 事件，回调就抛两遍。

---

## 五、`origin.value` 到底从哪取

```ts
// packages/core/src/events/CallbackArguments.ts:268-284
public handleCallback({ sourceComponent, throwValue }) {
  const mappedValue = mapValueWithDataRemark(sourceComponent, throwValue);   // :275
  sourceComponent.cbArgs.forEach((arg) => {
    const originKey = arg.value.origin.value;
    const targetKey = arg.value.target.value;
    if (throwValue[originKey] !== undefined) {          // :280 用原始值判断存在性
      this.callbackArgs[targetKey] = mappedValue[originKey];   // :281 用映射值取值
    }
  });
}
```

### 抛出对象是什么：组件 `data` 的 schema 形状

**`throwValue` 就是该组件渲染数据里的一项，形状 = 该组件 `data` 的 schema。**
`click` 抛用户点中的那项，`dataChange` 抛第一项（`dataChart.value[0]`）。

所以配 `cbArgs` 前，先去查目标组件的 data schema，`origin.value` 从**它的字段名**里挑：

- `sw-component-schema` 的 `references/components/<族>/<prop>.md`（如 `echart/echartlineAndBar.md`）
- 通用字段见 `references/component-base-data.md`
- 或直接读组件 JSON 的 `data[0]`——落盘的就是这个形状

链路上没有任何一处做归一：`useEvent.handleEventAndCallbackEvent` 原样透传给
`handleEvents`（`packages/use/src/event/useEventHandling.ts:228-245`），再原样进 `handleCallback`，
最后落到上面第 280 行的 `throwValue[originKey]`。所以下面这条才成立：

`origin.value` 填 `""` 恒定失败：`throwValue[""]` 必然 `undefined`，第 280 行判断不过，回调不写入。

#### 排错：这些组件的 `dataChange` 抛的不是数据项

少数组件的 `dataChange` 抛的是整个数组或组件对象本身，此时 `throwValue[字段名]` 恒 `undefined`，
**回调静默不写入**（不报错，只是永远没值）。在这些组件上配回调**请改用 `click`**，
或者把数据先接进 ft-dataContainer、由容器抛（容器符合契约：`FtDataContainer/index.vue:48,54`）：

| `dataChange` 实际抛了 | 组件（路径相对 `packages/material/src/components/`） |
|---|---|
| 组件对象 `props.element` | scrollTable、ctVideoPanel、ftSwiperCard、openVideo、ftvideo `useFtVideo.ts:680` |
| 整个数组 | customTableList、ftProgresstable、ftTextWordCloud、ftcollection、ringIndicator3d(New)、verticalCard、ftvideo `useFtVideo.ts:332,603`、formNavMenu `useNavMenu.ts:254,291` |
| 非数据值 | ftTimerShaft 抛 `option.value`；ftVoiceControl 抛字符串；formNavMenu `:389` 抛 `defaultActive` 字符串 |

其余组件（全部 echart、ft-dataContainer、各类选项卡 / 表单 / 图例等）都符合契约，按 data schema 取 key 即可。

### echart 的 `click` 只抛四个键

不是 echarts 原始的 params 对象，而是现场重新组的（`Echart/useEcharts.ts:115`）：

```ts
throwValue: { name: e.name, value: e.value, seriesName: e.seriesName, data: e.data }
```

所以 `origin.value` **只能**填 `name` / `value` / `seriesName` / `data`。
`dataIndex`、`seriesIndex`、`componentType` 这些 echarts params 上有的键**抛不出来**，填了必然 `undefined`。

`origin.value` 填 `""` 恒定失败：`throwValue[""]` 必然 `undefined`，第 280 行判断不过，回调不写入。

### `dataRemark` 别名（别处没写过）

第 275 行的 `mapValueWithDataRemark` 会按组件的 `dataRemark` 规则**补充**映射键：

```ts
// packages/core/src/utils/mapValueWithDataRemark.ts:16-23
const mappedValue = { ...originalData };
dataRemark.forEach(({ key, map }) => { mappedValue[key] = originalData[map]; });
```

所以 `origin.value` 除了填真实数据的 key，**也可以填 `dataRemark[].key` 这个别名**。

但注意第 280/281 行的不对称：**存在性判断用 `throwValue`（原始值），取值用 `mappedValue`（映射后）**。
后果是：若某个 key 只存在于 `dataRemark` 映射里、原始数据里没有，第 280 行判断不过，回调不会写入。
**结论：`origin.value` 填原始数据里真实存在的 key 最稳妥**，别名只在原始 key 也在时才安全。

---

## 六、过滤器不是只在回调变化时才跑

**回调触发只是五个执行时机之一。** 只按"回调变了才重算"去理解，会漏掉最常见的那次——
**组件挂载时无条件先跑一次**。

```ts
// packages/use/src/useBaseFilter.ts
onMounted(() => {
  registerFilter();            // 先注册监听
  calculateComponentData();    // 再无条件跑一次 ← 初次执行
  if (component.autoRefresh && component.time) {
    autoRefreshInterval.value = setInterval(calculateComponentData, component.time * 1000);
  }
});
watch(() => component.data, () => { calculateComponentData(); });   // 自身数据变了也跑
```

| # | 时机 | 触发处 |
| --- | --- | --- |
| 1 | **组件挂载** | `useBaseFilter.ts` 的 `onMounted` —— 无条件跑一次 |
| 2 | 组件自身 `data` 变化 | `useBaseFilter.ts` 的 `watch(() => component.data)` |
| 3 | `autoRefresh` 定时轮询 | 同上，按 `component.time` 秒 |
| 4 | **回调参数被抛出** | `useRegisterFilter.ts:70-76` 注册的 `onCallbackFieldTrigger` |
| 5 | 外部直接触发 | `useRegisterFilter.ts:115` 的 `onFilterTrigger` |

### 后果一：过滤器 JS 必须扛得住 `callbackArgs` 为空

第 1 次执行发生在**任何上游抛出之前**，此时运行时取到的就是个空对象：

```ts
// packages/core/src/filter/CallbackArgsSource.ts:31-33
export function getRuntimeCallbackArgs(): Record<string, any> {
  return currentSource?.getCallbackArgs() ?? {};      // 初次 = {}
}
```

所以 `callbackArgs.xxx` 在首次执行时**必然是 `undefined`**。过滤器里直接往下取值会当场抛错，
组件初始就是空白或报错——而且这跟回调配得对不对完全无关，光看配置查不出来。

```js
// ❌ 首次执行必崩
(data, callbackArgs) => data.filter((d) => d.type === callbackArgs.selected.value);

// ✅ 空值时给一个合理的初始形态（通常是"不过滤，全量返回"）
(data, callbackArgs) => {
  const selected = callbackArgs?.selected;
  if (!selected) return data;
  return data.filter((d) => d.type === selected);
};
```

**写任何消费 `callbackArgs` 的过滤器，第一件事就是处理它为空的分支。**

### 后果二：`callbackFields` 为空时监听压根没注册

这是 §3 那条结论的第二个源码证据——运行时挂监听的地方同样只认 `callbackFields`：

```ts
// packages/use/src/useRegisterFilter.ts:84-91
component.listenArgs.forEach((listenArg) => {
  if (listenArg.callbackFields && listenArg.callbackFields.length > 0) {   // :85 空则跳过
    listenArg.callbackFields.forEach((field) => onListenCallbackFieldTrigger(field));
  }
});
```

`callbackFields` 为空 → 一个监听器都不注册 → 时机 4 永远不会发生。
但**时机 1 照常发生**，所以症状是：**组件首次有数据、之后再也不更新**。
看起来"过滤器是好的"，实际链路是断的——这是最容易误判成"已配好"的一种。

### 后果三：`openFilter` 在两处各拦一次

除了 §3 说的注册门禁（`CallbackArguments.ts:199`），执行时还有一道：

```ts
// packages/core/src/filter/BaseFilter.ts:56
if (target.openFilter) { ...才真正执行过滤器链... }
```

为 false 时过滤器一次都不会跑，连挂载那次也没有，组件直接拿原始数据渲染。

---

## 七、配置清单

按顺序做，每步都对应上面某一节：

1. **源组件 `cbArgs`** —— `origin.value` 取该组件 **data schema 里的字段名**（抛出对象就是 data 的一项），`target.value` 起变量名（§5）
2. **源组件 `events`** —— trigger 要匹配用户的实际操作，否则回调永不触发（§4）
3. **过滤器 JSON 的 `callBack`** —— 列出 `dataFormatter` 里用到的每个 `callbackArgs.xxx` 变量名（§3）
4. **消费组件 `openFilter: true`** —— 硬门禁，false 则前面全白配（§3 的 `:199`）
5. **消费组件 `listenArgs`** —— 挂上过滤器条目；`callbackFields` **不要手填**，由第 3 步派生（§3）

### 验证

```
simulateEvent({
  screenId: "{screenId}_{versionCode}",
  componentId: <抛出方组件 id>,
  triggerType: "<trigger>",
  throwValue: { ... }        // 抛出方 data[0] 的形状；dataChange 可传整表数组
})
```

跑的是同一份 `@screenwright/core`，`callbacks` 段的过滤结果是真算出来的。

| 症状 | 对应断点 |
| --- | --- |
| 「事件」段说没有该 trigger 的事件 | §4-1，trigger 配错 |
| 「回调参数」段说没有组件监听 | `callbackFields` 为空（§3）或 `openFilter` 为 false |
| 回调参数值为 `undefined` | `origin.value` 不在组件 data schema 里，或只在 `dataRemark` 里存在；也可能是该组件 `dataChange` 抛的不是数据项（§5 排错表） |
| 条件不满足却仍然抛了回调 | 这是**正确行为**，不是 bug（§4-2） |
| 回调重复触发 | 多个事件匹配同一 trigger（§4-3） |
| 组件 JSON 里 `cbArgs` 落盘后为空 | 写成了 `callbackArgs`，被静默丢弃（§1） |
| **组件首次有数据，之后再也不更新** | `callbackFields` 为空，监听没注册；挂载那次照跑所以看着像好的（§6-2） |
| **组件初始空白 / 控制台报 `undefined` 上取属性** | 过滤器没处理首次执行时 `callbackArgs` 为 `{}` 的分支（§6-1） |
| 过滤器一次都没跑（连初始渲染都没数据） | `openFilter` 为 false——执行处也有一道门禁（§6-3） |

> 前两条只在浏览器里看得出来，`simulateEvent` 跑的是"抛一次值"这一刻，不覆盖挂载时机。
> 要验它们得用 `execute_in_browser`（见 [verify-flow.md](verify-flow.md)）。
