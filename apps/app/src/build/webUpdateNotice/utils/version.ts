import packageJson from "../../../../package.json";
import { FUNBI_SCRIPT_TAG_ID, FUNBI_UPDATE_NOTICE_DIRECTORY_NAME, JSON_FILE_NAME } from "./constant";
import { runGitWithFallback } from "./git";

/**
 * 获取 Git 提交哈希（仅接口占位）
 */
export async function resolveGitCommit(): Promise<string> {
  return await runGitWithFallback(["rev-parse --short HEAD"], {
    cwd: process.cwd(),
    timeoutMs: 8000,
    transform: (output) => {
      return output;
    }
  });
}

/**
 * 获取 package.json 的版本号（仅接口占位）
 */
export function resolvePackageVersion(): string {
  return packageJson.version;
}

/**
 * 获取时间戳（仅接口占位）
 */
export function resolveTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 选择版本号（优先 Git，自定义可覆盖，仅接口占位）
 */
export async function pickVersion(_custom?: string): Promise<string> {
  try {
    return await resolveGitCommit();
  } catch (error) {
    return resolvePackageVersion();
  }
}

export function getLocalVersion(): string {
  const script = document.querySelector(`script[data-id="${FUNBI_SCRIPT_TAG_ID}"]`);
  if (!script) {
    return "";
  }

  const version = script.getAttribute("data-version");

  if (!version) {
    return "";
  }

  return version;
}

export async function getRemoteVersion(): Promise<string> {
  const res = await fetch(`${FUNBI_UPDATE_NOTICE_DIRECTORY_NAME}/${JSON_FILE_NAME}.json?t=${Date.now()}`);
  if (!res.ok) {
    return "";
  }
  const data = (await res.json()) as { version: string };
  return data.version;
}
