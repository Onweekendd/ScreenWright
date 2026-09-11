# create-screenwright-app

用于创建 Screenwright Artifact 应用的命令行工具。生成结果统一使用 Vue 3、Vite、TypeScript 和 Tailwind CSS。

```bash
npx create-screenwright-app my-artifact-app
cd my-artifact-app
pnpm install
pnpm dev
```

模板的唯一源文件位于仓库的 `apps/artifact-app-template`。发布 CLI 时，`prepack` 会先构建命令并把该模板复制到 npm 包内。
