/* eslint-disable no-console */
// 把 funAI 后端打成自包含 sidecar：
//   apps/desktop/src-tauri/resources/server/            server.mjs + 扁平 node_modules + src(资源) + generated + prisma + 干净的预seed screenwright.db
//   apps/desktop/src-tauri/binaries/node-<triple>[.exe] Node 运行时
//
// node_modules 策略：不用 pnpm deploy / npm install（前者不读 lockfile 全量重下+物化 junction 出空壳，
// 后者在这套依赖上 ERESOLVE 静默崩）。直接从 workspace 已装好的那份出发，按 package.json 的
// dependencies 图做传递闭包遍历，realpathSync 解出每个包的真实目录，扁平拷到 outDir/node_modules（首个胜出）。
// 用的就是 dev 跑通的那份，不重解析、不重下载、无版本漂移。
import { execSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const serverSrc = join(repoRoot, "servers", "server");
const outDir = join(repoRoot, "apps", "desktop", "src-tauri", "resources", "server");
const binDir = join(repoRoot, "apps", "desktop", "src-tauri", "binaries");
const outNm = join(outDir, "node_modules");

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit" });
const fwd = (p) => p.replace(/\\/g, "/");
const isDir = (p) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
};
const readPkg = (p) => {
  try {
    return JSON.parse(readFileSync(join(p, "package.json"), "utf8"));
  } catch {
    return null;
  }
};

// node 解析：从 fromDir 起逐级往上找 node_modules/<name>
const resolvePkgDir = (name, fromDir) => {
  const parts = name.split("/");
  let dir = fromDir;
  for (;;) {
    const cand = join(dir, "node_modules", ...parts);
    if (existsSync(join(cand, "package.json"))) return cand;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
};

// 1. server 代码 bundle —— 走 turbo 而不是直接 pnpm --filter：
//    server.mjs 是 --packages=external，运行时还要从 node_modules 加载 types / core /
//    figma-helper(shared) / create-screenwright-app 这几个 workspace 包，入口都在各自
//    被 gitignore 的 dist/ 下。CI 干净 checkout 里没有，不先建就会拷进空壳，装到别的机器
//    上启动即 ERR_MODULE_NOT_FOUND。这些前置及它们各自的依赖链都在 turbo.json 的
//    @screenwright/server#build:server.dependsOn 里声明，由 turbo 按图排序构建。
console.log("→ build:server（turbo，含 workspace 运行时依赖）");
run("pnpm turbo run build:server --filter=@screenwright/server", repoRoot);

// 2. 依赖闭包遍历 + 扁平拷贝
console.log("→ 遍历依赖闭包 → 扁平 node_modules");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outNm, { recursive: true });

const serverPkg = readPkg(serverSrc);
// 运行时用不到 / 只服务已删功能：devtool、Prisma CLI、React（studio 用）、pglite（走 libsql）
const DROP = new Set([
  "typescript",
  "prisma",
  "@prisma/engines",
  "@prisma/studio-core",
  "@electric-sql/pglite",
  "esbuild",
  "react",
  "react-dom",
  "@types/react",
  "@types/react-dom"
]);
const doneVersions = new Set(); // "name@version" —— 拷过的
const topVersion = new Map(); // name -> 顶层胜出的版本
const missing = [];
const workspaceDests = []; // 落地的 workspace 包（monorepo packages/ 下的），拷完要校验入口
let nested = 0;
// [名字, 解析起点目录, 父包落地目录]
const queue = Object.keys(serverPkg.dependencies).map((n) => [n, serverSrc, outDir]);

while (queue.length) {
  const [name, fromDir, parentDir] = queue.shift();
  if (DROP.has(name)) continue;

  const src = resolvePkgDir(name, fromDir);
  if (!src) {
    missing.push(name);
    continue;
  }
  const real = realpathSync(src);
  const meta = readPkg(real);
  if (!meta) {
    missing.push(name);
    continue;
  }
  const key = `${name}@${meta.version}`;

  // 落地位置：顶层没这个包 → 顶层胜出；已有同版本 → 跳过拷贝；已有别的版本 → 嵌到父包下（pnpm 式）
  let dest;
  if (!topVersion.has(name)) {
    dest = join(outNm, ...name.split("/"));
    topVersion.set(name, meta.version);
  } else if (topVersion.get(name) === meta.version) {
    dest = join(outNm, ...name.split("/"));
  } else {
    dest = join(parentDir, "node_modules", ...name.split("/"));
    nested++;
  }

  if (!existsSync(join(dest, "package.json"))) {
    if (!fwd(real).includes("/node_modules/")) workspaceDests.push([name, dest, meta]);
    mkdirSync(dirname(dest), { recursive: true });
    // 不拷包自带的 node_modules：workspace 包（packages/*）里是 dev 工具链（eslint 等），
    // .pnpm 里的包本身没有嵌套 node_modules。依赖已由本遍历扁平化 + 冲突嵌套处理。
    cpSync(real, dest, {
      recursive: true,
      dereference: true,
      filter: (p) => !p.slice(real.length).replace(/\\/g, "/").split("/").includes("node_modules")
    });
  }

  // 每个 name@version 只排一次队
  if (doneVersions.has(key)) continue;
  doneVersions.add(key);

  // 递归：deps + optionalDeps + peerDeps（peer 必须跟，如 @modelcontextprotocol/ext-apps 的 sdk）
  // 子依赖版本冲突时嵌到「本包目录/node_modules/」下
  for (const dep of Object.keys({ ...meta.dependencies, ...meta.optionalDependencies, ...meta.peerDependencies })) {
    queue.push([dep, real, dest]);
  }
}

if (missing.length) {
  console.warn(`⚠ 未解析到 ${missing.length} 个包（多为可选/平台专属，通常无碍）：${missing.slice(0, 20).join(", ")}`);
}
console.log(`  拷了 ${doneVersions.size} 个包（含 ${nested} 处版本冲突嵌套）`);

// workspace 包的入口文件（exports / main 指向的 dist）必须真实存在，否则宁可打包失败也别放出坏包
const collectEntries = (v, out) => {
  if (typeof v === "string") out.push(v);
  else if (v && typeof v === "object") for (const x of Object.values(v)) collectEntries(x, out);
  return out;
};
const broken = [];
for (const [name, dest, meta] of workspaceDests) {
  const entries = collectEntries(meta.exports ?? meta.main ?? [], []).filter((e) => /\.(m?js|cjs)$/.test(e) && !e.includes("*"));
  for (const e of entries) if (!existsSync(join(dest, e))) broken.push(`${name} → ${e}`);
}
if (broken.length) {
  throw new Error(`workspace 包入口缺失（未构建？）：\n  ${broken.join("\n  ")}`);
}
console.log(`  校验 ${workspaceDests.length} 个 workspace 包入口 ✓`);

// 3. 组装其余文件
console.log("→ 组装 resources/server");
mkdirSync(join(outDir, "dist"), { recursive: true });
mkdirSync(join(outDir, "prisma"), { recursive: true });

writeFileSync(
  join(outDir, "package.json"),
  `${JSON.stringify({ name: "screenwright-server", version: serverPkg.version, private: true, type: "module" }, null, 2)}\n`
);

copyFileSync(join(serverSrc, "dist", "server.mjs"), join(outDir, "dist", "server.mjs"));
cpSync(join(serverSrc, "generated"), join(outDir, "generated"), { recursive: true });
copyFileSync(join(serverSrc, "prisma", "schema.prisma"), join(outDir, "prisma", "schema.prisma"));

// server.mjs 运行时按相对路径读 src/ 下的 prompt / skill / swagger 等资源（esbuild 没内联）。
// 排除 static-server 的字体/CDN（~172MB，只服务 artifact-app 预览）。
cpSync(join(serverSrc, "src"), join(outDir, "src"), {
  recursive: true,
  filter: (p) => !fwd(p).includes("/lib/process-manager/static-server/public/")
});

// server 自己那份 tsconfig.json（带 `@/` 别名）：workspace.ts 里
// PROJECT_TSCONFIG_PATH = resolve(process.cwd(), "tsconfig.json")，沙箱跑
// `npx tsx --tsconfig $FUNAI_PROJECT_TSCONFIG scripts/simulateEvent.ts` 要它。
if (existsSync(join(serverSrc, "tsconfig.json"))) {
  copyFileSync(join(serverSrc, "tsconfig.json"), join(outDir, "tsconfig.json"));
}

// agent-workspace 基础设施（skills / scripts / types / tsconfig.json）——
// 首启由 Rust 侧 ensure_data 播种到 <appData>/agent-workspace/。
// 只拷这 4 个白名单条目（对齐 evals/harness/prepare-workspace.ts 的 INFRASTRUCTURE），
// 不碰 screen_* / artifact-app 等运行时产物。
const wsSeedDir = join(outDir, "agent-workspace");
mkdirSync(wsSeedDir, { recursive: true });
let wsSeeded = 0;
for (const entry of ["skills", "scripts", "types", "tsconfig.json"]) {
  const from = join(serverSrc, "agent-workspace", entry);
  if (!existsSync(from)) {
    console.warn(`⚠ 缺 agent-workspace/${entry}`);
    continue;
  }
  cpSync(from, join(wsSeedDir, entry), { recursive: true });
  wsSeeded++;
}
console.log(`  agent-workspace 基础设施播种源：${wsSeeded}/4 条`);

// 不内置 .env：模型 key 由用户首启后在「设置」页填写（ai_model 表缺行时 runtime 自动建空行）。
// Rust 侧会注入 DB/blob/workspace 路径。

// 预 seed 的 SQLite 库：不能直接拷开发库（含真实 key、会话记忆、追踪数据），
// 每次打包在临时目录从零建一份干净的 screenwright.db：建表 + 组件库 + 默认账号。
// mastra.db 不预置——Mastra 首启自建；组件 RAG 向量在设置页配好嵌入模型后可一键重建。
const seedDir = join(serverSrc, ".data", "release");
rmSync(seedDir, { recursive: true, force: true });
mkdirSync(seedDir, { recursive: true });
const seedDbUrl = `file:${fwd(join(seedDir, "screenwright.db"))}`;
const seedEnv = { ...process.env, PRISMA_DATABASE_URL: seedDbUrl };
// 清掉当前 shell 里可能带的模型 key，避免任何路径把 key 落进库
for (const k of Object.keys(seedEnv)) if (/_API_KEY$/.test(k)) delete seedEnv[k];
const runSeed = (cmd) => execSync(cmd, { cwd: serverSrc, stdio: "inherit", env: seedEnv });
runSeed("pnpm exec prisma migrate deploy");
runSeed("pnpm exec tsx scripts/seed-modules.ts");
runSeed("pnpm exec tsx scripts/seed-bi-user.ts");
mkdirSync(join(outDir, "data"), { recursive: true });
copyFileSync(join(seedDir, "screenwright.db"), join(outDir, "data", "screenwright.db"));
console.log("  预 seed screenwright.db（干净库，不含 key / 会话数据）");

// 4. Node 运行时
mkdirSync(binDir, { recursive: true });
const triple = execSync("rustc -vV").toString().match(/host:\s*(\S+)/)[1];
const nodeName = `node-${triple}${process.platform === "win32" ? ".exe" : ""}`;
copyFileSync(process.execPath, join(binDir, nodeName));

console.log(`✓ sidecar → ${outDir}  (+ binaries/${nodeName})`);
