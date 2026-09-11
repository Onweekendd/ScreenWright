#!/usr/bin/env node

import { Command } from "commander";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 启动静态文件服务器
 * @param prefix - URL前缀
 * @param port - 端口号
 * @param distPath - dist目录路径
 */
function startServer(prefix: string, port: number, distPath: string) {
  const app = express();

  // 启用CORS
  app.use(cors());

  // 设置静态文件服务，使用更严格的配置
  app.use(
    prefix,
    express.static(distPath, {
      // 不要fallback到index.html，让静态文件404就是404
      fallthrough: true,
      // 允许提供隐藏文件（以点开头的文件，如.pnpm-xxx.js）
      dotfiles: "allow",
      // 设置正确的MIME类型
      setHeaders: (res, filePath) => {
        // JavaScript 模块文件
        if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
          res.setHeader(
            "Content-Type",
            "application/javascript; charset=utf-8",
          );
        }
        // CSS 文件
        else if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css; charset=utf-8");
        }
        // JSON 文件
        else if (filePath.endsWith(".json")) {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
        }
        // WebAssembly
        else if (filePath.endsWith(".wasm")) {
          res.setHeader("Content-Type", "application/wasm");
        }
        // Source maps
        else if (filePath.endsWith(".map")) {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
        }

        // 设置 CORS 头，允许跨域加载模块
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    }),
  );

  // 只对HTML页面请求返回index.html（不包括静态资源）
  app.get(`${prefix}*`, (req, res, next) => {
    // 如果请求的是静态资源（有文件扩展名），则不处理
    const ext = path.extname(req.path);
    if (ext && ext !== ".html") {
      // 对于静态资源，如果文件不存在，返回404
      return next();
    }
    // 对于HTML页面请求，返回index.html（SPA路由）
    res.sendFile(path.join(distPath, "index.html"));
  });

  // 根路径重定向到带前缀的路径
  app.get("/", (_req, res) => {
    res.redirect(prefix);
  });

  app.listen(port, () => {
    console.log(`🚀 服务器已启动`);
    console.log(`📁 服务目录: ${distPath}`);
    console.log(`🌐 访问地址: http://localhost:${port}${prefix}`);
    console.log(`📋 前缀路径: ${prefix}`);
  });
}

// 创建命令行程序
const program = new Command();

program
  .name("screenwright-server")
  .description("Screenwright静态文件服务器")
  .version("0.0.0");

program
  .command("start")
  .description("启动静态文件服务器")
  .option("-p, --port <port>", "端口号", "3000")
  .option("--prefix <prefix>", "URL前缀路径", "/")
  .option("--dist <dist>", "dist目录路径", "../../../dist")
  .action((options) => {
    const port = parseInt(options.port, 10);
    const prefix = options.prefix.endsWith("/")
      ? options.prefix
      : `${options.prefix}/`;
    // 从编译后的 dist/index.js 位置解析路径
    const distPath = path.resolve(__dirname, options.dist);

    console.log(`🔧 配置信息:`);
    console.log(`   端口: ${port}`);
    console.log(`   前缀: ${prefix}`);
    console.log(`   目录: ${distPath}`);

    startServer(prefix, port, distPath);
  });

// 添加便捷命令
program
  .command("devBI")
  .description("启动开发环境BI服务 (localhost:3000/devBI)")
  .action(() => {
    // 从编译后的 dist/index.js 位置，需要回退到项目根目录
    const distPath = path.resolve(__dirname, "../../../apps/app/dist");
    startServer("/devBI/", 3000, distPath);
  });

program
  .command("screenwright")
  .description("启动生产环境BI服务 (localhost:3000/screenwright)")
  .action(() => {
    // 从编译后的 dist/index.js 位置，需要回退到项目根目录
    const distPath = path.resolve(__dirname, "../../../apps/app/dist");
    startServer("/screenwright/", 3000, distPath);
  });

program
  .command("prodBI")
  .description("启动生产环境BI服务 (localhost:3000/prodBI)")
  .action(() => {
    // 从编译后的 dist/index.js 位置，需要回退到项目根目录
    const distPath = path.resolve(__dirname, "../../../dist");
    startServer("/prodBI/", 3000, distPath);
  });

// 解析命令行参数
program.parse();
