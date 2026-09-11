# @screenwright/asset-server

Screenwright静态文件服务器，用于提供dist目录的静态文件服务。

## 功能特性

- 🚀 快速启动静态文件服务器
- 🔧 支持自定义端口和URL前缀
- 📁 自动处理SPA路由
- 🌐 支持CORS跨域
- ⚡ 便捷的命令行工具

## 安装

```bash
pnpm install
```

## 使用方法

### 基本用法

```bash
# 启动服务器，默认端口3000，前缀为/
pnpm server start

# 指定端口
pnpm server start --port 8080

# 指定前缀路径
pnpm server start --prefix /devBI

# 指定dist目录
pnpm server start --dist ./custom-dist
```

### 便捷命令

```bash
# 启动开发环境BI服务 (localhost:3000/devBI)
pnpm server devBI

# 启动生产环境BI服务 (localhost:3000/prodBI)
pnpm server prodBI
```

### 完整示例

```bash
# 启动开发环境，端口3000，前缀/devBI
pnpm server start --port 3000 --prefix /devBI

# 启动后访问: http://localhost:3000/devBI
```

## 命令行选项

| 选项       | 简写 | 默认值       | 描述         |
| ---------- | ---- | ------------ | ------------ |
| `--port`   | `-p` | `3000`       | 服务器端口号 |
| `--prefix` | -    | `/`          | URL前缀路径  |
| `--dist`   | -    | `../../dist` | dist目录路径 |

## 项目结构

```
packages/server/
├── src/
│   └── index.ts          # 主服务器脚本
├── dist/                 # 编译输出目录
├── package.json
├── tsconfig.json
└── README.md
```

## 开发

```bash
# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build

# 启动编译后的版本
pnpm start
```
