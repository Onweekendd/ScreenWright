import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadPrompt } from "@/agent-resources/prompts";
import { createPiResourceLoader } from "@/artifact-app/agent/resources/pi-resource-loader";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, {
        recursive: true,
        force: true
      })
    )
  );
});

describe("Pi ResourceLoader", () => {
  it("createPiResourceLoader：创建资源加载器时，应追加 Artifact App 系统提示词", async () => {
    // Arrange
    const directories = await createResourceDirectories();
    const expectedPrompt = loadPrompt("pi/artifact-app-agent.md").trim();

    // Act
    const resourceLoader = await createPiResourceLoader(directories);

    // Assert
    expect(resourceLoader.getAppendSystemPrompt()).toContain(expectedPrompt);
  });

  it("createPiResourceLoader：工作区存在 AGENTS.md 时，应加载项目上下文", async () => {
    // Arrange
    const directories = await createResourceDirectories();
    await writeFile(path.join(directories.workspacePath, "AGENTS.md"), "使用 Vue 3 和 TypeScript。", "utf8");

    // Act
    const resourceLoader = await createPiResourceLoader(directories);

    // Assert
    expect(resourceLoader.getAgentsFiles()).toMatchObject({
      agentsFiles: [{ content: "使用 Vue 3 和 TypeScript。" }]
    });
  });
});

async function createResourceDirectories(): Promise<{
  workspacePath: string;
  agentDir: string;
}> {
  const root = await mkdtemp(path.join(tmpdir(), "screenwright-pi-resources-"));
  const workspacePath = path.join(root, "workspace");
  const agentDir = path.join(root, "agent");
  temporaryDirectories.push(root);

  await Promise.all([mkdir(workspacePath, { recursive: true }), mkdir(agentDir, { recursive: true })]);

  return { workspacePath, agentDir };
}
