import fsp from "node:fs/promises";
import path from "node:path";

import { WORKSPACE_BASE } from "../tools/file/state";

const PLAN_DIR = path.resolve(WORKSPACE_BASE, "plan");

export function getPlanFilePath(threadId: string): string {
  return path.join(PLAN_DIR, `${threadId}.md`);
}

export async function savePlan(threadId: string, content: string): Promise<string> {
  await fsp.mkdir(PLAN_DIR, { recursive: true });
  const filePath = getPlanFilePath(threadId);
  await fsp.writeFile(filePath, content, "utf-8");
  return filePath;
}

export async function getPlan(threadId: string): Promise<string | null> {
  const filePath = getPlanFilePath(threadId);
  try {
    return await fsp.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function editPlan(
  threadId: string,
  oldContent: string,
  newContent: string
): Promise<{ success: boolean; filePath: string; occurrences?: number }> {
  const filePath = getPlanFilePath(threadId);
  const content = await fsp.readFile(filePath, "utf-8");

  const occurrences = content.split(oldContent).length - 1;
  if (occurrences === 0) {
    return { success: false, filePath, occurrences: 0 };
  }
  if (occurrences > 1) {
    return { success: false, filePath, occurrences };
  }

  await fsp.writeFile(filePath, content.replace(oldContent, newContent), "utf-8");
  return { success: true, filePath };
}
