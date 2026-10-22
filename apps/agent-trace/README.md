# Agent Trace

LLM 往返与评估结果的查看器，读取后端 `/customApi/llm-exchanges` 与 `/customApi/evals`。

## 连接后端

后端接口需要登录，agent-trace 在 Next 服务端用环境变量里的账号自动登录（令牌缓存在进程内，过期自动重登）。
在本目录新建 `.env.local`（已被 .gitignore 忽略）：

```bash
FUNAI_USERNAME=admin
FUNAI_PASSWORD=你的管理员口令
# 后端地址，默认 http://localhost:4111
# FUNAI_API_BASE=http://localhost:4111
```

改完 `.env.local` 需要重启 `pnpm dev`。

## 端口被占用

`pnpm dev` 默认监听 3000。如果浏览器打开 `localhost:3000` 是空白页，先确认没有别的进程抢了 `127.0.0.1:3000`
（例如 WSL 里的服务经 wslrelay 转发到 Windows），换个端口即可：

```bash
pnpm dev -p 3100
```

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
