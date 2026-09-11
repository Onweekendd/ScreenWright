/**
 * BaseFilter 已迁移到 @screenwright/core（框架无关的模板方法基类）。
 * 此处再导出以保持原有导入路径不变；并把 FilterResultCollector
 * （含 Vue ref 的响应式收集器）注入 core，使 core 的 BaseFilter 能写回过滤结果。
 *
 * 所有数据源过滤器都从 "./baseFilter" 引入 BaseFilter，故此副作用注入会在
 * 过滤子系统加载时执行，保证过滤运行前收集器已就位。
 */
import { type FilterResultSink, setFilterResultSink } from "@screenwright/core";

import { FilterResultCollector } from "../FilterResultCollector";

export { BaseFilter } from "@screenwright/core";

setFilterResultSink(FilterResultCollector.getInstance() as FilterResultSink);
