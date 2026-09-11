import * as monaco from "monaco-editor";

let injected: Promise<void> | null = null;

/**
 * 把 SDK 的 screenwright 类型注入 monaco 的 TS/JS 语言服务(全局只做一次)。
 * 对应运行时 window.screenwright(见 useMountGlobalHooks)。
 */
export const setupSdkTypes = () => {
  if (injected) {
    return injected;
  }

  injected = (async () => {
    // hooks.bundled.d.ts 是 build:sdk:types 里 dts-bundle-generator 内联 @screenwright/types 后的产物,
    // 在 public 下运行时 fetch,不进主 bundle(文件较大)
    const url = `${import.meta.env.BASE_URL}lib/sdk/hooks.bundled.d.ts`;
    const dts = await fetch(url).then((r) => r.text());

    const SDK_MODULE = "@screenwright/sdk-hooks";
    // 1) 外部依赖 stub:
    //    @screenwright/types 已由 dts-bundle-generator 内联进 hooks.bundled.d.ts,不需要 stub。
    //    vue 只用到 Ref/ComputedRef/WritableComputedRef,给真类型保住 .value 链路。
    //    zod 是 @screenwright/types 的传递依赖,dts-bundle-generator 保留为 import,需要 any stub。
    const stubPath = `file:///node_modules/@screenwright/sdk-hooks-stub/index.d.ts`;
    const stub = `
declare module "vue" {
  export interface Ref<T = any> { value: T; }
  export interface ComputedRef<T = any> { readonly value: T; }
  export interface WritableComputedRef<T = any> { value: T; }
}
declare module "zod" { const z: any; export { z }; }
`;
    // 2) bundled dts 作为一个虚拟包
    const sdkPath = `file:///node_modules/${SDK_MODULE}/index.d.ts`;
    // 3) 桥接:把 module 导出提升为全局,匹配 window.screenwright
    const bridgePath = `file:///node_modules/${SDK_MODULE}/global.d.ts`;
    const bridge = `
import type { ScreenwrightSdkInstance } from "${SDK_MODULE}";
declare global {
  const screenwright: ScreenwrightSdkInstance;
  interface Window { screenwright: ScreenwrightSdkInstance; }
}
export {};
`;

    for (const d of [monaco.languages.typescript.typescriptDefaults, monaco.languages.typescript.javascriptDefaults]) {
      // 让 export = any 的 stub 在 named/namespace import 下都解析为 any
      d.setCompilerOptions({
        ...d.getCompilerOptions(),
        allowJs: true,
        allowNonTsExtensions: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs
      });
      d.addExtraLib(stub, stubPath);
      d.addExtraLib(dts, sdkPath);
      d.addExtraLib(bridge, bridgePath);
      // 关掉语义红线(外部依赖的叶子类型可能仍是 any),只留语法校验
      d.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
    }
  })().catch((e) => {
    injected = null; // 失败允许下次重试
    console.warn("[monaco] 注入 SDK 类型失败", e);
  });

  return injected;
};
