#!/bin/bash

# WASM 构建脚本
# 使用方法: ./scripts/build.sh [dev|release] [output-dir]

set -e

# 配置
MODE="${1:-release}"
OUT_DIR="${2:-pkg}"
TARGET="web"

echo "🔧 构建 WASM 包..."
echo "模式: $MODE"
echo "输出目录: $OUT_DIR"
echo "目标平台: $TARGET"
echo ""

# 检查工具
if ! command -v rustup &> /dev/null; then
    echo "❌ 错误: 未找到 rustup，请先安装 Rust"
    exit 1
fi

if ! command -v wasm-bindgen &> /dev/null; then
    echo "⚠️  未找到 wasm-bindgen CLI，正在安装..."
    cargo install wasm-bindgen-cli
fi

# 确保 wasm32 target 已安装
if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo "📦 安装 wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# 清理旧文件
if [ -d "$OUT_DIR" ]; then
    echo "🧹 清理旧文件..."
    rm -rf "$OUT_DIR"
fi

mkdir -p "$OUT_DIR"

# 构建 WASM
echo "🔨 编译 Rust 代码..."
if [ "$MODE" = "dev" ]; then
    cargo build --target wasm32-unknown-unknown
    WASM_FILE="target/wasm32-unknown-unknown/debug/bi_alignment.wasm"
    BINDGEN_FLAGS="--debug"
else
    cargo build --target wasm32-unknown-unknown --release
    WASM_FILE="target/wasm32-unknown-unknown/release/bi_alignment.wasm"
    BINDGEN_FLAGS=""
fi

# 生成 JS 绑定和 TS 类型
echo "📝 生成 JavaScript 绑定和 TypeScript 类型..."
wasm-bindgen "$WASM_FILE" \
    --out-dir "$OUT_DIR" \
    --target "$TARGET" \
    --typescript \
    $BINDGEN_FLAGS

echo ""
echo "✅ 构建完成！"
echo ""
echo "生成的文件:"
ls -lh "$OUT_DIR"
echo ""
echo "文件大小:"
du -h "$OUT_DIR"/*.wasm
echo ""
echo "使用方式:"
echo "import init from './$OUT_DIR/bi_alignment.js';"
