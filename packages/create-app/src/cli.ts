#!/usr/bin/env node

import { relative, resolve } from "node:path";

import { createArtifactApp } from "./create-artifact-app.js";

const HELP_TEXT = `创建 Screenwright Artifact 应用

用法：
  npx create-screenwright-app <项目目录>

示例：
  npx create-screenwright-app sales-dashboard
`;

async function main(): Promise<void> {
  const [targetArgument] = process.argv.slice(2);
  if (
    !targetArgument ||
    targetArgument === "--help" ||
    targetArgument === "-h"
  ) {
    process.stdout.write(HELP_TEXT);
    return;
  }

  const targetDirectory = resolve(process.cwd(), targetArgument);
  await createArtifactApp({ targetDirectory });

  const displayDirectory = relative(process.cwd(), targetDirectory) || ".";
  process.stdout.write(
    `\n已创建 Artifact 应用：${displayDirectory}\n\n` +
      `下一步：\n` +
      `  cd ${displayDirectory}\n` +
      `  pnpm install\n` +
      `  pnpm dev\n\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`创建失败：${message}\n`);
  process.exitCode = 1;
});
