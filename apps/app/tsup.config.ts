import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/views/view/exportEntry/sdk/hooks.ts"],
  outDir: "public/lib/sdk",
  // tsup/rollup-plugin-dts 无法内联采用 barrel re-export 结构的 @screenwright/types。
  // 此处仅生成保留 import 的 hooks.d.ts，随后由 build:sdk:types 中的
  // dts-bundle-generator 内联 @screenwright/types，最终生成 hooks.bundled.d.ts。
  dts: {
    only: true,
    resolve: true,
    compilerOptions: {
      skipLibCheck: true,
      noEmitOnError: false
    }
  },
  format: ["esm"],
  clean: false, // 保留 public/lib/sdk/index.umd.js
  skipNodeModulesBundle: false
});
