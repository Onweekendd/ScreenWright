import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createArtifactApp } from "./create-artifact-app";

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "create-screenwright-app-"));
  temporaryDirectories.push(directory);
  return directory;
}

async function createTestTemplate(rootDirectory: string): Promise<string> {
  const templateDirectory = join(rootDirectory, "template");
  await mkdir(join(templateDirectory, "src"), { recursive: true });
  await writeFile(
    join(templateDirectory, "package.json"),
    JSON.stringify(
      { name: "@screenwright/artifact-app-template", private: true },
      null,
      2,
    ),
  );
  await writeFile(join(templateDirectory, "src", "main.ts"), "export {};\n");
  await writeFile(join(templateDirectory, "_gitignore"), "node_modules\n");
  return templateDirectory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("createArtifactApp", () => {
  it("目标目录不存在时，复制模板并写入项目名称", async () => {
    // Arrange
    const rootDirectory = await createTemporaryDirectory();
    const templateDirectory = await createTestTemplate(rootDirectory);
    const targetDirectory = join(rootDirectory, "sales-dashboard");

    // Act
    await createArtifactApp({ targetDirectory, templateDirectory });

    // Assert
    const packageJson = JSON.parse(
      await readFile(join(targetDirectory, "package.json"), "utf8"),
    ) as {
      name: string;
    };
    expect(packageJson.name).toBe("sales-dashboard");
    await expect(
      readFile(join(targetDirectory, ".gitignore"), "utf8"),
    ).resolves.toBe("node_modules\n");
  });

  it("目标目录包含文件时，拒绝覆盖已有项目", async () => {
    // Arrange
    const rootDirectory = await createTemporaryDirectory();
    const templateDirectory = await createTestTemplate(rootDirectory);
    const targetDirectory = join(rootDirectory, "existing-app");
    await mkdir(targetDirectory);
    await writeFile(join(targetDirectory, "README.md"), "existing");

    // Act
    const action = createArtifactApp({ targetDirectory, templateDirectory });

    // Assert
    await expect(action).rejects.toThrow("目标目录不是空目录");
  });
});
