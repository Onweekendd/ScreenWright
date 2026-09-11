/**
 * 回调参数「运行时值」的注入点（框架无关）。
 *
 * 与关系图（callbackArgumentsManager / eventMappingTarget）不同，callbackArgs 是过滤器执行时
 * 注入到用户函数里的变量值——它属于**运行时**关注点，只有前端在跑过滤器时才需要，
 * 且全应用只有一份（当前正在编辑/预览的那块大屏）。
 *
 * 而 CallbackArguments 实例本身是**按大屏**的（Node 侧一个进程可能同时持有多块大屏的编辑器），
 * 因此它不能再是单例。过滤器运行时又深在调用链里、拿不到编辑器引用，故沿用
 * FilterResultSink 的做法：core 只定义最小接口 + 注入点，由 UI 层在装配编辑器时注入。
 *
 * 未注入时返回空对象，保证 headless（无 app、不跑过滤器）环境下不崩——Node 侧正是这种情况。
 */
export interface CallbackArgsSource {
  getCallbackArgs(): Record<string, any>;
}

let currentSource: CallbackArgsSource | null = null;

/** 注入回调参数来源（UI 层装配编辑器时调用一次）。 */
export function setCallbackArgsSource(source: CallbackArgsSource): void {
  currentSource = source;
}

/**
 * 读取当前的回调参数值。
 *
 * 必须**用时才调**、不要把返回值缓存成字段：`clearCallbackArguments()` 会整个替换内部对象，
 * 缓存下来的引用会变成一个再也不更新的死对象。
 */
export function getRuntimeCallbackArgs(): Record<string, any> {
  return currentSource?.getCallbackArgs() ?? {};
}
