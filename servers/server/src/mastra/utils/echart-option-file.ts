import { randomUUID } from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";

import { WORKSPACE_BASE } from "../tools/file/state";

const ECHART_OPTIONS_DIR = path.resolve(WORKSPACE_BASE, "echart-options");

export function getEchartOptionDir(threadId: string): string {
  return path.join(ECHART_OPTIONS_DIR, threadId);
}

export function getEchartOptionFilePath(threadId: string, uuid: string): string {
  return path.join(getEchartOptionDir(threadId), `${uuid}.ts`);
}

export async function saveEchartOption(threadId: string, content: string): Promise<string> {
  const dir = getEchartOptionDir(threadId);
  await fsp.mkdir(dir, { recursive: true });
  const uuid = randomUUID();
  const filePath = getEchartOptionFilePath(threadId, uuid);
  await fsp.writeFile(filePath, content, "utf-8");
  return filePath;
}

export async function readEchartOption(filePath: string): Promise<string | null> {
  try {
    return await fsp.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}
