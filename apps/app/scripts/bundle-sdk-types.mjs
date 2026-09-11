/**
 * 后处理脚本: 把 tsup 生成的 hooks.d.ts 里对 @screenwright/types 的 import 替换为内联类型定义。
 *
 * 用法: node scripts/bundle-sdk-types.mjs
 * 输出: public/lib/sdk/hooks.bundled.d.ts
 *
 * 原理:
 *   hooks.d.ts 顶部有:
 *     import * as _funbi_type from '@screenwright/types';
 *     import { Xxx, Yyy } from '@screenwright/types';
 *     import * as _funbi_type_types_action from '@screenwright/types/types/action';
 *   这些 import 在 monaco 编辑器里无法解析,导致组件类型塌成 any。
 *   本脚本用 monaco 能理解的 declare module 形式替换这些 import:
 *     1. 把 @screenwright/types 的 dist .d.ts 文件内容拼接为一个 declare module 块
 *     2. 删掉原 import 语句
 *     3. 保留 vue import 不动(在 monaco 里走 stub)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

const INPUT = join(ROOT, "public/lib/sdk/hooks.d.ts");
const OUTPUT = join(ROOT, "public/lib/sdk/hooks.bundled.d.ts");

// ─── 1. 读取 hooks.d.ts ───
let hooksDts = readFileSync(INPUT, "utf-8");

// ─── 2. 收集 @screenwright/types dist 下所有 .d.ts 文件内容,合并成一个 declare module ───
const typePkgRoot = resolve(ROOT, "../../packages/types");
const typeDistRoot = join(typePkgRoot, "dist");

/**
 * 递归收集目录下所有 .d.ts 文件(排除 .d.ts.map)
 */
function collectDtsFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectDtsFiles(fullPath));
    } else if (entry.name.endsWith(".d.ts") && !entry.name.endsWith(".d.ts.map")) {
      results.push(fullPath);
    }
  }
  return results;
}

const dtsFiles = collectDtsFiles(typeDistRoot);
console.log(`[bundle-sdk-types] 收集到 ${dtsFiles.length} 个 .d.ts 文件 from @screenwright/types/dist`);

// 将所有 .d.ts 文件内容拼接,去掉各自的 export 语句中的文件相对路径引用
// 策略:直接把每个文件的内容原样放入 declare module "@screenwright/types" 块中,
// 但要把内部 re-export (export * from './xxx') 转成内联定义。
// 更简单的做法:把所有 .d.ts 内容拼起来,去掉 export 语句中的 from '...' 部分,
// 让所有类型都在同一个作用域内可见。

const allTypeDeclarations = [];
for (const file of dtsFiles) {
  let content = readFileSync(file, "utf-8");
  // 去掉 sourcemap 引用
  content = content.replace(/\/\/# sourceMappingURL=.*$/gm, "");
  // 把 "export * from './xxx'" 类的 re-export 去掉(类型已经在其他文件里定义了)
  // 保留 "export type { X }" 和 "export { X }" (这些是本文件的真正导出)
  // 但对于 declare module 内部,我们不需要 export,所有类型都直接可见
  content = content.replace(/^export\s+\*\s+from\s+['"][^'"]+['"];?\s*$/gm, "");
  // 把 "export type { ... } from '...'" 转成 "type ... = ..." 形式不需要,直接删掉 from
  // 实际上更简单:把所有 "export" 关键字去掉,让所有声明都变成顶层可用的
  content = content.replace(/^export\s+(type|interface|enum|const|declare|function|class|abstract)\s/gm, "$1 ");
  // 处理 "export { X, Y }" 行 - 在内联场景下不需要这些
  content = content.replace(/^export\s+\{[^}]*\}\s*;?\s*$/gm, "");
  // 处理 "export type { X, Y }" 行
  content = content.replace(/^export\s+type\s+\{[^}]*\}\s*;?\s*$/gm, "");

  allTypeDeclarations.push(content.trim());
}

// ─── 3. 也内联 @screenwright/types/types/action ───
const actionDtsPath = join(typeDistRoot, "types/action.d.ts");
let actionContent = "";
try {
  actionContent = readFileSync(actionDtsPath, "utf-8");
  // actionContent 已经在 allTypeDeclarations 里了(被 collectDtsFiles 收集)
  // 不需要重复添加
} catch {
  // 如果不存在也没关系
}

// ─── 4. 构建 declare module 块 ───
const inlineBlock = `
// ─── @screenwright/types 内联类型定义 (由 scripts/bundle-sdk-types.mjs 自动生成) ───
${allTypeDeclarations.join("\n\n")}
// ─── @screenwright/types 内联结束 ───
`;

// ─── 5. 替换 hooks.d.ts 中的 @screenwright/types import ───
// 删除 @screenwright/types 相关的 import 行
hooksDts = hooksDts.replace(/^import\s+.*from\s+['"]@screenwright\/types[^'"]*['"];?\s*$/gm, "");

// 在文件开头插入内联类型(在剩余的 vue import 之前)
hooksDts = inlineBlock + "\n\n" + hooksDts;

// ─── 6. 写入输出 ───
writeFileSync(OUTPUT, hooksDts, "utf-8");

const lines = hooksDts.split("\n").length;
const sizeKB = Math.round(hooksDts.length / 1024);
console.log(`[bundle-sdk-types] 生成 hooks.bundled.d.ts: ${lines} 行, ${sizeKB} KB`);
console.log(`[bundle-sdk-types] 输出: ${relative(ROOT, OUTPUT)}`);
