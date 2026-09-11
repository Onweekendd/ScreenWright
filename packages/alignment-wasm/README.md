# BI Alignment WASM

高性能的图形对齐线计算库，使用 Rust + WASM 实现，提供 R树空间索引和实时对齐线功能。

## ✨ 特性

- 🚀 **高性能**: 使用 Rust 编写，编译为 WebAssembly
- 🌲 **R树索引**: 高效的空间查询和碰撞检测  
- 📏 **对齐线**: 支持左/右/上/下/中心对齐
- 💼 **类型安全**: 完整的 TypeScript 类型定义
- 📦 **零依赖**: 独立的 WASM 模块，无需其他依赖

## 📦 快速开始

### 构建 WASM 包

使用 PowerShell 脚本构建：

\`\`\`powershell
# 构建生产版本
.\scripts\build.ps1 release pkg

# 构建开发版本  
.\scripts\build.ps1 dev pkg
\`\`\`

或使用 npm scripts：

\`\`\`bash
npm run build          # 生产版本
npm run build:dev      # 开发版本
\`\`\`

### 在项目中使用

\`\`\`html
<script type="module">
  import init, { BIAlignmentInstance, BINode } from './pkg/bi_alignment.js';

  async function main() {
    await init();
    
    const instance = new BIAlignmentInstance();
    const nodes = [
      new BINode(1, 100, 100, 100, 80),
      new BINode(2, 250, 150, 120, 90)
    ];
    
    instance.initialize(nodes);
  }

  main();
</script>
\`\`\`

## 📖 详细文档

- [构建文档](./BUILD.md) - 完整的构建选项和配置
- [JavaScript 示例](./examples/alignment-example.js) - 完整的使用示例  
- [TypeScript 类型](./examples/alignment.d.ts) - 类型定义参考

## 🎯 使用流程

详见之前提供的完整流程图和代码示例。

---

**作者**: Onweekend <weijianwang74@gmail.com>
