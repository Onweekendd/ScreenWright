import * as monaco from "monaco-editor";

/**
 * 给数据过滤器编辑器注入 callbackArgs 和 data 的动态类型。
 *
 * 编辑器里写的是整段箭头函数 `(data, callbackArgs) => {...}`,两个都是它自己的形参。
 * TS 要给形参上类型必须有「上下文」,这里用 JSDoc 类型断言包一层(见
 * FILTER_FN_WRAP_HEADER/FOOTER),断言里引用全局接口 FunbiCallbackArgs / FunbiFilterRow。
 *
 * - FunbiCallbackArgs:callbackArgs 的动态 key,来自回调参数管理器(可枚举)。
 * - FunbiFilterRow:data 每行的列名,来自 FilterResultCollector 里的样本行 / 组件 data
 *   (数据源/SQL 决定,不可静态枚举,所以是「尽力推断」,带 index signature 兜底)。
 */
const URI = "file:///screenwright-callback-args.d.ts";
let disposables: monaco.IDisposable[] = [];

/**
 * MonacoEditor 的 wrapHeader/wrapFooter:用 JSDoc 类型断言给箭头函数形参上类型。
 * 断言语法要求把箭头函数用 `()` 包起来,所以 header 以 `(` 结尾、footer 是 `)`。
 * 头尾会被 setHiddenAreas 隐藏,保存时按行剥掉,不进 dataFormatter。
 */
export const FILTER_FN_WRAP_HEADER =
  "/** @type {(data: FunbiFilterRow[], callbackArgs: FunbiCallbackArgs) => any} */ (";
export const FILTER_FN_WRAP_FOOTER = ")";

const buildKeyMembers = (keys: string[]) => keys.map((k) => `    ${JSON.stringify(k)}: any;`).join("\n");
const buildFieldMembers = (fields: Record<string, string>) =>
  Object.entries(fields)
    .map(([k, t]) => `    ${JSON.stringify(k)}: ${t};`)
    .join("\n");

/**
 * @param callbackKeys callbackArgs 的动态 key
 * @param dataFields data 每行推断出的「列名 -> TS 类型」(按样本值推断 number/string/...,
 *   可空,空则只有 index signature)
 */
export const setupCallbackArgsTypes = (callbackKeys: string[], dataFields: Record<string, string> = {}) => {
  const dts = `
export {};
declare global {
  interface FunbiCallbackArgs {
    [key: string]: any;
${buildKeyMembers(callbackKeys)}
  }
  interface FunbiFilterRow {
    [key: string]: any;
${buildFieldMembers(dataFields)}
  }
}
`;

  disposables.forEach((d) => d.dispose());
  disposables = [
    monaco.languages.typescript.javascriptDefaults.addExtraLib(dts, URI),
    monaco.languages.typescript.typescriptDefaults.addExtraLib(dts, URI)
  ];
};
