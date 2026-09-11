import fs from "fs";
import type { Plugin } from "vite";

// import { exec } from "child_process"
import { runGitWithFallback } from "./webUpdateNotice/utils/git";

// Git 命令常量（增强兼容性，优先使用更基础的命令）
const COMMIT_HASH_COMMANDS = [
  "rev-parse --short HEAD",
  "log -1 --pretty=format:%h",
  "rev-list --max-parents=0 HEAD --abbrev-commit"
];
const BRANCH_COMMANDS = ["rev-parse --abbrev-ref HEAD", "symbolic-ref --short HEAD", "name-rev --name-only HEAD"];
const COMMIT_AUTHOR_COMMANDS = ["log -1 --pretty=format:%an", "show -s --format='%an' HEAD"];

// 【优化】提交时间命令：简化格式，增加基础命令备选
const COMMIT_TIME_COMMANDS = [
  // 优先：基础格式（避免复杂参数）
  "log -1 --pretty=format:%Y-%m-%d %H:%M:%S",
  // 备选：使用 show 命令（浅克隆更兼容）
  "show -s --format=%Y-%m-%d %H:%M:%S HEAD",
  // 备选：原始时间戳（最坏情况可转换）
  "log -1 --pretty=format:%ct",
  "show -s --format=%ct HEAD"
];

// 提交信息命令
const COMMIT_MESSAGE_COMMANDS = ["log -1 --pretty=format:%s", "show -s --format=%s HEAD", "log -1 --pretty=format:%B"];

/**
 * 执行 Git 命令（增强错误处理）
 */
const execGitCommandWithFallback = async (commands: string[], cwd?: string): Promise<string> =>
  runGitWithFallback(commands, {
    cwd,
    timeoutMs: 8000,
    transform: (output) => {
      if (commands === COMMIT_TIME_COMMANDS && /^\d+$/.test(output)) {
        const date = new Date(Number(output) * 1000);
        return date
          .toLocaleString("zh-CN", {
            timeZone: "Asia/Shanghai",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
          })
          .replace(/\//g, "-");
      }
      return output;
    }
  });

/**
 * 获取 Git 信息（兼容更多场景）
 */
const getGitInfo = async (gitWorkTree?: string) => {
  const cwd = gitWorkTree || process.cwd();
  return {
    commitHash: await execGitCommandWithFallback(COMMIT_HASH_COMMANDS, cwd),
    branch: await execGitCommandWithFallback(BRANCH_COMMANDS, cwd),
    commitAuthor: await execGitCommandWithFallback(COMMIT_AUTHOR_COMMANDS, cwd),
    commitTime: await execGitCommandWithFallback(COMMIT_TIME_COMMANDS, cwd), // 提交时间
    commitMessage: await execGitCommandWithFallback(COMMIT_MESSAGE_COMMANDS, cwd)
  };
};

/**
 * 获取应用信息
 */
const getAppInfo = (timezone = "Asia/Shanghai") => {
  try {
    const pkgPath = `${process.cwd()}/package.json`;
    const pkgContent = fs.readFileSync(pkgPath, "utf-8");
    const { name, version } = JSON.parse(pkgContent);

    const buildTime = new Date()
      .toLocaleString("zh-CN", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      })
      .replace(/\//g, "-");

    return { name, version, buildTime };
  } catch (error) {
    console.warn("获取应用信息失败，使用默认值");
    return { name: "unknown-app", version: "0.0.0", buildTime: new Date().toISOString() };
  }
};

// 插件配置选项
interface Options {
  gitWorkTree?: string;
  timezone?: string;
  injectTo?: "head" | "body";
}

/**
 * 兼容 Jenkins 的构建信息插件（修复提交时间 unknown 问题）
 */
export default (option?: Options): Plugin => {
  const { gitWorkTree, timezone = "Asia/Shanghai", injectTo = "body" } = option || {};

  if (!gitWorkTree) {
    return { name: "build-info-plugin: missing gitWorkTree" };
  }

  return {
    name: "vite-plugin-build-info-jenkins",

    async transformIndexHtml(html: string) {
      const gitInfo = await getGitInfo(gitWorkTree);
      const appInfo = getAppInfo(timezone);

      const commentLines = [
        "构建信息（增强兼容版）:",
        `  应用名称: ${appInfo.name}`,
        `  应用版本: ${appInfo.version}`,
        `  构建时间: ${appInfo.buildTime}（${timezone}）`,
        `  提交分支: ${gitInfo.branch}`,
        `  提交哈希: ${gitInfo.commitHash}`,
        `  提交内容: ${gitInfo.commitMessage}`,
        `  最后提交人: ${gitInfo.commitAuthor}`,
        `  提交时间: ${gitInfo.commitTime}（${timezone}）`
      ];
      const commentHtml = `<!--\n  ${commentLines.join("\n  ")}\n-->`;

      if (injectTo === "head") {
        return html.replace(/<\/head>/i, `${commentHtml}\n</head>`);
      } else {
        return html.replace(/<\/body>/i, `${commentHtml}\n</body>`);
      }
    }
  };
};
