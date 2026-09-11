# 数据结构

> 基于 `packages/type/src/schemas/event-action-condition.ts` 的 Zod Schema 定义。

## Event

存储在组件 JSON 的 `events` 数组中：

```typescript
{
  id: string,                    // "event_<uuid>"
  name: string,                  // 事件名称
  trigger: EventTypeEnum,        // 触发类型，由 listAvailableEvents 返回
  conditionType: string,         // "all" = 与；"one" = 或。别写 "and"（枚举里有，运行时却是或）
  conditions: Condition[],       // 条件列表
  actions: Action[],             // 行为列表，至少包含一个
  btnObjs: any[],                // 按钮对象列表
  // 支持扩展字段（catchall）
}
```

## Action

挂载在 Event.actions 数组上：

```typescript
{
  id: string,                    // "action_<uuid>"
  name: string,                  // 动作显示名称
  action: ActionTypeEnum,        // 具体行为，由 listAvailableActions 返回
  component: string[],           // 目标组件，格式: ["$component(1234567)"]，正则: /^\$component\(\d+\)$/
  customActionType?: "component" | "message" | "statusAnimation",
  animation?: ActionAnimation,    // 动画配置，见 action/common-animation.md
  // 其他可选字段按 action 类型填写，见 action-config-map.md
  // 可选字段包括: stateId, scale, translate, sceneObject, sceneObjectExplosion,
  //   sceneChildComponent, mapChildComponent, ue4Config, apiInstructionDetail 等
}
```

## Condition

挂载在 Event.conditions 数组上：

```typescript
{
  id: string,                    // 条件唯一标识符
  name: string,                  // 条件名称
  type: "field" | "custom",      // 条件类型
  code: string,                  // 条件代码
  compare: ConditionCompareEnum, // 比较类型: "=="|"!="|"<"|">"|"<="|">="|"include"|"exclude"
  expected: string,              // 预期值
  field: string,                 // 字段名
  notSaved: boolean,             // 是否未保存
  isExists: boolean,             // 是否存在
  tempPool: any                  // 临时池
}
```
