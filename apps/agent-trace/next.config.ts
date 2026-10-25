import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 让 next build 额外产出 .next/standalone —— 自带精简 node_modules + server.js,
  // 这是整份 Dockerfile 能瘦身的前提(runner 段只搬它)
  output: "standalone",
  // monorepo 必填:把「文件追踪根」设为仓库根,否则住在 servers/、packages/ 的
  // workspace 依赖(Screenwright、@screenwright/types)会被排除在追踪范围外
  outputFileTracingRoot: path.join(__dirname, "../.."),
  turbopack: {
    root: path.join(__dirname, "../..")
  },
  // 会话记录已经是首页：保留旧地址的跳转，老书签 / 外部链接（带 ?thread=... 等参数）仍然可用
  async redirects() {
    return [{ source: "/sessions", destination: "/", permanent: false }];
  }
};

export default nextConfig;
