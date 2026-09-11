/**
 * BaseFilter 来自 @screenwright/core（框架无关的模板方法基类）。
 *
 * 注意：app 侧会在启动时通过 setFilterResultSink 注入全局的 FilterResultCollector
 * （含 Vue ref 的响应式收集器），过滤结果会写回 app 的响应式状态。
 * 物料包不重复注入 sink——core 中的 sink 是进程级单例，app 注入一次即可被
 * 物料包内的过滤器共享。
 */
export { BaseFilter } from "@screenwright/core";
