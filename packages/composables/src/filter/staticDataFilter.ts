/**
 * 静态数据源过滤器已下沉到 @screenwright/core（取数就是读组件自己的 data，零 IO）。
 * 此处再导出以保持原有导入路径与导出名不变。
 *
 * 不要在这里另留一份实现——两份会各自漂移，而 Node 侧跑的是 core 那份。
 * `./baseFilter` 的结果收集器注入由 index.ts 与其余数据源策略的 import 保证已执行。
 */
export { StaticDataFilter as staticDataFilter } from "@screenwright/core";
