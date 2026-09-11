/**
 * 单文件类型检查 vue-part 组件（.vue）。
 *
 * vue-tsc / tsc 没有 "-p + 单文件" 的直接 flag（命令行直接传文件会丢失 tsconfig 里的
 * paths 与 vueCompilerOptions）。本脚本用一个 **extends 主配置、只 include 目标文件**
 * 的临时 tsconfig 跑 vue-tsc --noEmit，把检查范围锁死在单文件，避免扫到 workspace 下
 * 其它历史 / 旧格式 .vue 产生噪音。详见 docs/vue-part-type-check.md。
 *
 * 用法：
 *   tsx scripts/check-vue-part.ts <path/to/component.vue>
 *   # 或（已在 package.json 注册）
 *   pnpm check-vue-part <path/to/component.vue>
 *
 * 目标路径可为绝对路径或相对当前工作目录，但必须落在 workspace 内、且以 .vue 结尾。
 * 进程退出码透传 vue-tsc：0 = 通过，非 0 = 有类型错误 / 调用失败。
 */
import { spawnSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FUNAI_ROOT = resolve(__dirname, "..");
const WORKSPACE_ROOT = process.env.MASTRA_WORKSPACE_PATH
  ? resolve(process.env.MASTRA_WORKSPACE_PATH)
  : resolve(FUNAI_ROOT, "agent-workspace");

function fail(msg: string): never {
  console.error(`[check-vue-part] ${msg}`);
  process.exit(1);
}

const input = process.argv[2];
if (!input) {
  fail("用法: tsx scripts/check-vue-part.ts <目标.vue 路径>");
}

let targetAbs = isAbsolute(input) ? resolve(input) : resolve(process.cwd(), input);
// 回退：agent 在 sandbox（cwd=workspace 根）或经 pnpm script（cwd=Screenwright）调用时，
// 传入的通常是 workspace 相对路径（如 screen_xxx/component/123.vue），按 WORKSPACE_ROOT 再解析一次
if (!existsSync(targetAbs) && !isAbsolute(input)) {
  const alt = resolve(WORKSPACE_ROOT, input);
  if (existsSync(alt)) {
    targetAbs = alt;
  }
}
if (!existsSync(targetAbs)) {
  fail(`文件不存在: ${targetAbs}`);
}
if (!targetAbs.endsWith(".vue")) {
  fail(`仅支持 .vue 文件: ${targetAbs}`);
}

// include 路径相对临时 tsconfig（位于 workspace 根），统一用 posix 分隔符
const relPosix = relative(WORKSPACE_ROOT, targetAbs).split("\\").join("/");
if (relPosix.startsWith("..")) {
  fail(`目标文件不在 workspace 内:\n  file=${targetAbs}\n  workspace=${WORKSPACE_ROOT}`);
}

const baseTsconfig = join(WORKSPACE_ROOT, "tsconfig.json");
if (!existsSync(baseTsconfig)) {
  fail(`workspace tsconfig 不存在: ${baseTsconfig}`);
}

// 临时 extends tsconfig：唯一文件名避免并发冲突，finally 清理
const tmpTsconfig = join(WORKSPACE_ROOT, `.check-${process.pid}-${Date.now()}.tsconfig.json`);
writeFileSync(tmpTsconfig, JSON.stringify({ extends: "./tsconfig.json", include: [relPosix] }, null, 2), "utf-8");

// 定位 vue-tsc 入口：从 package.json 推目录，绕开 exports 子路径限制
const require = createRequire(import.meta.url);
const vueTscBin = join(dirname(require.resolve("vue-tsc/package.json")), "bin/vue-tsc.js");

console.log(`[check-vue-part] 检查 ${relPosix} ...`);
let status = 1;
try {
  const result = spawnSync(process.execPath, [vueTscBin, "-p", tmpTsconfig, "--noEmit"], {
    cwd: FUNAI_ROOT,
    stdio: "inherit"
  });
  if (result.error) {
    console.error(`[check-vue-part] vue-tsc 调用失败: ${result.error.message}`);
  } else {
    status = result.status ?? 1;
    if (status === 0) {
      console.log(`[check-vue-part] ✓ 通过: ${relPosix}`);
    }
  }
} finally {
  rmSync(tmpTsconfig, { force: true });
}
// process.exit() 会跳过 finally，因此必须在 finally 执行（删临时 tsconfig）之后再退出
process.exit(status);
