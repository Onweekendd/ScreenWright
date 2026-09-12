# ComponentSchema - 事件、动作与条件字段

> Source: `packages/type/src/schemas/event-action-condition.ts`

## 目录
1. [events 字段结构](#1-events-字段结构)
2. [EventSchema - 事件对象](#2-eventschema---事件对象)
3. [ConditionSchema - 条件对象](#3-conditionschema---条件对象)
4. [ActionSchema - 动作对象](#4-actionschema---动作对象)
5. [encodes - 加密事件](#5-encodes---加密事件)
6. [ActionTypeEnum 常用动作类型](#6-actiontypeenum-常用动作类型)

---

## 1. events 字段结构

```ts
events: EventSchema[]   // 事件列表，每个事件包含触发器、条件和动作
encodes?: EncodeEventSchema[]  // 加密事件列表（可选）
```

每个组件可以绑定多个事件，每个事件的结构：触发器 → 条件判断 → 执行动作列表。

---

## 2. EventSchema - 事件对象

```ts
{
  id: string,             // 事件唯一 ID（UUID）
  name: string,           // 事件显示名称
  trigger: any,           // 触发器配置（点击、数据变化、定时等）
  conditionType: string,  // 条件逻辑类型，见下方警告。只有 "all" 是与，其余一律是或
  conditions: Condition[], // 条件列表
  actions: Action[],       // 动作列表
  btnObjs: any[]           // 按钮对象列表（部分组件使用）
  // + catchall: 允许任意扩展字段
}
```

> **`conditionType` 有个陷阱值：不要写 `"and"`。**
>
> 枚举 `ConditionLogicTypeEnum`（`packages/type/src/types/action.ts:703`）定义了三个值
> `One = "one"` / `And = "and"` / `All = "all"`，但运行时只做一次相等判断：
>
> ```ts
> // packages/core/src/selectors/conditionChecking.ts:103-107
> if (conditionType === "all") return conditions.every(...);   // 与
> return conditions.some(...);                                  // 其余全是或
> ```
>
> 所以 `"and"` 虽然名字叫 AND，实际走的是**或**分支——与字面意思相反，且不报错。
> **与用 `"all"`，或用 `"one"`，`"and"` 一个字都别写。** `"or"` 不在枚举里，也别用。

---

## 3. ConditionSchema - 条件对象

```ts
{
  id: string,
  name: string,
  type: "field" | "custom",    // field=字段条件，custom=自定义代码条件
  compare: ConditionCompareEnum, // 比较操作符
  expected: string,            // 预期值
  field: string,               // 条件判断的字段名
  code: string,                // 自定义条件代码（type="custom" 时用）
  notSaved: boolean,
  isExists: boolean,
  tempPool: any
}
```

**ConditionCompareEnum 常用值：**
`"=="` `"!="` `">"` `"<"` `">="` `"<="` `"contains"` `"notContains"` `"isEmpty"` `"isNotEmpty"`

---

## 4. ActionSchema - 动作对象

```ts
{
  id: string,
  name: string,
  action: ActionTypeEnum,           // 动作类型（见下方枚举）
  component: string[],              // 目标组件引用列表，格式：["$component(1305156)"]
  actionData?: Record<string, any>, // 动作扩展数据
  animation?: ActionAnimation,      // 动画配置（可选）

  // 以下为各动作类型的专属字段（可选）
  stateId?: string,                 // 状态面板 ID（切换状态时使用）
  sceneStatusName?: string,
  switchSceneStatusDelay?: number,  // 场景状态切换延迟（ms）
  sceneLevelId?: number,
  keyframesName?: string,           // 关键帧动画名称
  stateAnimationName?: string,      // 状态动画名称
  animationState?: number,
  panelStatusAnimationId?: string,
  panelStatusId?: string,
  apiInstructionDetail?: string,    // API 指令详情
  apiInstructionDelay?: number,
  scale?: { lock, origin, originGrid, x, y },  // 缩放配置
  translate?: { toX, toY },                     // 位移配置
  encodeKey?: string | null,                   // 加密密钥
  ue4Config?: { messageName, messageJson, messageContent, messageType },
  customActionType?: "component" | "message" | "statusAnimation",
  tcpudpConfig?: { dataType, dataSourceId, dataSourceObj, sendData, sendType, dataDelay },
  projectFunName?: string,          // 项目函数名称
  mapBox?: { boxOffsetX, boxOffsetY },
  layerInfo?: { color, name, callBackField, childNodeField },
  sceneObject?: { nameList, name?, objInfoList, visible },
  sceneObjectExplosion?: { index, lidName, baseName, type },
  sceneChildComponent?: { nameList, childComponentInfoList, visible },
  videoStartTime?: number,
  videoEndTime?: number,
  currentpage?: number,
  option?: Record<string, any>,     // 事件选择模型集合
  setBroadcastId?: string | null,
  screenThemeId?: number,
  screenThemePages?: any[],
  swiperCardTabsName?: string,
  aiManMsgContent?: string,         // 数字人消息内容
  translation?: string
}
```

**组件引用格式：** `"$component(数字ID)"` — 例如 `"$component(1305156)"`

---

## 5. encodes - 加密事件

```ts
encodes?: Array<{
  id: string,
  name: string,
  trigger: any,
  conditionType: string,
  conditions: Condition[],
  actions: Action[],         // 注意：EncodeAction 不含 animation 等扩展字段
  // EncodeAction 专属字段:
  encodeLabel: string | null,
  encodeKey: string | null,
  encodeValue: number[]
}>
```

---

## 6. ActionTypeEnum 常用动作类型

> 完整枚举见 `packages/type/src/types/index.ts` 的 `ActionTypeEnum`

| 分类 | 常用值（示例） |
|------|---------------|
| 显隐控制 | `"show"` `"hide"` `"toggle"` |
| 数据刷新 | `"refresh"` `"updateData"` |
| 状态切换 | `"switchStatus"` `"switchPanelStatus"` |
| 场景控制 | `"switchScene"` `"switchSceneStatus"` |
| 动画播放 | `"playAnimation"` `"playKeyframes"` `"playStateAnimation"` |
| 导航跳转 | `"jump"` `"openUrl"` |
| 广播消息 | `"broadcast"` `"setBroadcast"` |
| API 指令 | `"apiInstruction"` |
| 缩放位移 | `"scale"` `"translate"` |
| 视频控制 | `"videoPlay"` `"videoPause"` `"videoSeek"` |
