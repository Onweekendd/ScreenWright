/**
 * 回调/过滤器事件的 key 规则（框架无关，单一事实来源）。
 *
 * CallbackEventManager 的 on/off/emit 全部按 key 字符串寻址，而 key 是「事件名-组件id」
 * 这种约定拼出来的。规则过去散在两处：@screenwright/composables 的 useCallbackArguments 拼一份，
 * core 的 DataFilterManager.emitFilterTrigger 又拼一份。
 *
 * 两处必须逐字一致，否则「前端注册的监听」与「后端触发的事件」落在不同 key 上——
 * 表现是事件发出去了却没人响应，且不报错。所以规则收在这里，谁要用谁引。
 */

export const callbackEventKey = {
  /** 组件新增回调字段 */
  addField: (id: number | string): string => `onAddCallbackField-${id}`,
  /** 组件移除回调字段 */
  removeField: (id: number | string): string => `onRemoveCallbackField-${id}`,
  /** 某个回调字段触发了某个组件重算（targetKey 是回调参数名） */
  fieldTrigger: (targetKey: string, id: number | string): string => `onCallbackFieldTrigger-${targetKey}-${id}`,
  /** 直接触发某组件的过滤器执行（不经回调参数） */
  filterTrigger: (id: number | string): string => `onFilterTrigger-${id}`
} as const;
