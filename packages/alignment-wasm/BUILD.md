# WASM 构建指南

本文档说明如何构建 WASM 包并生成 JavaScript 绑定和 TypeScript 类型定义。

## 构建方式

有两种方式构建 WASM：

### 方式 1：使用 wasm-pack（推荐）

wasm-pack 会自动处理所有构建步骤，并生成完整的 npm 包。

```bash
# 安装 wasm-pack
cargo install wasm-pack

# 构建（生成到 pkg/ 目录）
wasm-pack build --target web

# 或指定输出目录
wasm-pack build --target web --out-dir ./dist
```

**wasm-pack 支持的 target 类型：**
- `web`: 用于浏览器 ES 模块（推荐）
- `bundler`: 用于 webpack/rollup 等打包工具
- `nodejs`: 用于 Node.js
- `no-modules`: 用于传统的 `<script>` 标签

**生成的文件结构：**
```
pkg/
├── bi_alignment.d.ts         # TypeScript 类型定义
├── bi_alignment.js            # JavaScript 绑定
├── bi_alignment_bg.wasm       # WASM 二进制文件
├── bi_alignment_bg.wasm.d.ts  # WASM 类型定义
└── package.json               # npm 包配置
```

### 方式 2：手动使用 cargo + wasm-bindgen

如果你需要更细粒度的控制，可以分步构建：

```bash
# 1. 确保已安装 wasm32 target
rustup target add wasm32-unknown-unknown

# 2. 构建 WASM
cargo build --target wasm32-unknown-unknown --release

# 3. 使用 wasm-bindgen 生成绑定
wasm-bindgen target/wasm32-unknown-unknown/release/bi_alignment.wasm \
  --out-dir ./pkg \
  --target web \
  --typescript
```

## wasm-bindgen 命令行参数

### 基本参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--out-dir <DIR>` | 输出目录 | `--out-dir ./dist` |
| `--target <TARGET>` | 目标环境 | `--target web` |
| `--typescript` | 生成 TypeScript 类型定义 | - |
| `--out-name <NAME>` | 输出文件名前缀 | `--out-name alignment` |

### 目标类型（--target）

| Target | 用途 | 导入方式 |
|--------|------|---------|
| `web` | 浏览器 ES 模块 | `import init from './pkg/bi_alignment.js'` |
| `bundler` | Webpack/Rollup | `import init from 'bi-alignment'` |
| `nodejs` | Node.js | `const init = require('./pkg/bi_alignment')` |
| `no-modules` | 传统脚本 | `<script src="./pkg/bi_alignment.js"></script>` |

### 优化参数

| 参数 | 说明 |
|------|------|
| `--no-typescript` | 不生成 TS 类型（减小体积） |
| `--remove-name-section` | 移除函数名（减小体积） |
| `--remove-producers-section` | 移除构建信息（减小体积） |

## 完整构建命令示例

### 开发版本
```bash
# 使用 wasm-pack
wasm-pack build --target web --dev --out-dir ./pkg

# 或手动构建
cargo build --target wasm32-unknown-unknown
wasm-bindgen target/wasm32-unknown-unknown/debug/bi_alignment.wasm \
  --out-dir ./pkg \
  --target web \
  --typescript \
  --debug
```

### 生产版本
```bash
# 使用 wasm-pack
wasm-pack build --target web --release --out-dir ./pkg

# 或手动构建
cargo build --target wasm32-unknown-unknown --release
wasm-bindgen target/wasm32-unknown-unknown/release/bi_alignment.wasm \
  --out-dir ./pkg \
  --target web \
  --typescript
```

### 自定义输出
```bash
wasm-bindgen target/wasm32-unknown-unknown/release/bi_alignment.wasm \
  --out-dir ./dist/wasm \
  --out-name alignment \
  --target web \
  --typescript
```

生成文件：
```
dist/wasm/
├── alignment.d.ts
├── alignment.js
├── alignment_bg.wasm
└── alignment_bg.wasm.d.ts
```

## 在前端使用

### 方式 1：直接使用（target: web）

```javascript
// main.js
import init, { BIAlignmentInstance, BINode } from './pkg/bi_alignment.js';

async function main() {
  // 初始化 WASM
  await init();

  // 使用 API
  const instance = new BIAlignmentInstance();
  const node = new BINode(1, 100, 100, 50, 50);
  instance.add_node(node);
}

main();
```

### 方式 2：使用打包工具（target: bundler）

```javascript
// main.js
import init, { BIAlignmentInstance, BINode } from 'bi-alignment';

async function main() {
  await init();
  // ... 使用 API
}

main();
```

### 方式 3：传统脚本（target: no-modules）

```html
<script src="./pkg/bi_alignment.js"></script>
<script>
  wasm_bindgen('./pkg/bi_alignment_bg.wasm').then(() => {
    const instance = new wasm_bindgen.BIAlignmentInstance();
    // ... 使用 API
  });
</script>
```

## TypeScript 支持

生成的 `.d.ts` 文件提供完整的类型定义：

```typescript
import init, { BIAlignmentInstance, BINode } from './pkg/bi_alignment.js';

async function main() {
  await init();

  const instance = new BIAlignmentInstance();
  const node = new BINode(1, 100, 100, 50, 50);

  // TypeScript 会自动提示类型
  const result = instance.update_ref_line(100, 100, 150, 150);
  console.log(result.offset_x, result.offset_y); // 类型安全
}
```

## 常见问题

### Q: 如何减小 WASM 文件体积？

1. 使用 release 模式构建
2. 在 Cargo.toml 中优化配置（已配置）
3. 使用 `wasm-opt` 进一步优化：
```bash
wasm-opt -Oz -o output.wasm input.wasm
```

### Q: 如何调试 WASM？

1. 使用开发模式构建（保留符号）
2. 在浏览器 DevTools 中查看 WASM
3. 使用 `console_error_panic_hook` 获取更好的错误信息

### Q: 生成的文件名如何自定义？

使用 `--out-name` 参数：
```bash
wasm-bindgen ... --out-name my_custom_name
```

## 构建脚本

推荐创建 npm scripts 或 shell 脚本来简化构建：

参见：
- [build.sh](./scripts/build.sh) - Shell 构建脚本
- [package.json](./package.json) - npm 构建脚本（如果使用）
