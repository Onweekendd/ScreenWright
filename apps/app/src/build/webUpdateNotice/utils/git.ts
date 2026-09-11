import { exec } from "child_process";

export interface RunGitOptions {
  cwd?: string;
  timeoutMs?: number;
  transform?: (raw: string) => string;
}

/**
 * 依次尝试多条 Git 子命令，返回首个成功结果
 */
export const runGitWithFallback = async (commands: string[], options?: RunGitOptions): Promise<string> => {
  const cwd = options?.cwd || process.cwd();
  const timeout = options?.timeoutMs ?? 8000;
  const transform = options?.transform;

  for (const sub of commands) {
    try {
      const sh = `git ${sub}`;
      const result = await new Promise<string>((resolve, reject) => {
        exec(sh, { cwd, timeout }, (error, stdout, stderr) => {
          if (error) return reject(error);
          if (stderr) console.debug(`Git 命令警告: ${sh}, 警告: ${stderr}`);
          const output = stdout.toString().trim();
          if (!output) return reject(new Error(`命令无输出: ${sh}`));
          resolve(transform ? transform(output) : output);
        });
      });
      return result;
    } catch (_) {
      continue;
    }
  }

  return "获取失败（检查仓库状态）";
};
