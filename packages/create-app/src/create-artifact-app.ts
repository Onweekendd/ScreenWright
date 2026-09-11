import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface CreateArtifactAppOptions {
  targetDirectory: string;
  templateDirectory?: string;
}

interface TemplatePackageJson {
  name: string;
  private?: boolean;
  [key: string]: unknown;
}

const DEFAULT_TEMPLATE_DIRECTORY = fileURLToPath(
  new URL("./template", import.meta.url),
);

function createPackageName(targetDirectory: string): string {
  const packageName = basename(targetDirectory)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (packageName.length === 0) {
    throw new Error("无法从目标目录生成合法的项目名称");
  }

  return packageName;
}

async function assertTargetDirectoryAvailable(
  targetDirectory: string,
): Promise<void> {
  try {
    const entries = await readdir(targetDirectory);
    if (entries.length > 0) {
      throw new Error(`目标目录不是空目录：${targetDirectory}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function copyTemplateDirectory(input: {
  sourceDirectory: string;
  targetDirectory: string;
}): Promise<void> {
  await mkdir(input.targetDirectory, { recursive: true });
  const entries = await readdir(input.sourceDirectory, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const sourcePath = join(input.sourceDirectory, entry.name);
      const targetPath = join(input.targetDirectory, entry.name);

      if (entry.isDirectory()) {
        await copyTemplateDirectory({
          sourceDirectory: sourcePath,
          targetDirectory: targetPath,
        });
        return;
      }

      if (entry.isFile()) {
        await copyFile(sourcePath, targetPath);
      }
    }),
  );
}

async function renameTemplateGitignore(targetDirectory: string): Promise<void> {
  const templateGitignore = join(targetDirectory, "_gitignore");
  try {
    await stat(templateGitignore);
    await rename(templateGitignore, join(targetDirectory, ".gitignore"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function updatePackageName(input: {
  packageName: string;
  targetDirectory: string;
}): Promise<void> {
  const packageJsonPath = join(input.targetDirectory, "package.json");
  const packageJson = JSON.parse(
    await readFile(packageJsonPath, "utf8"),
  ) as TemplatePackageJson;
  packageJson.name = input.packageName;
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

/**
 * 从随 CLI 发布的标准模板创建一个 Artifact Vue 应用。
 *
 * 为保护已有文件，目标目录存在且非空时会直接失败。
 */
export async function createArtifactApp(
  options: CreateArtifactAppOptions,
): Promise<string> {
  const targetDirectory = resolve(options.targetDirectory);
  const templateDirectory = resolve(
    options.templateDirectory ?? DEFAULT_TEMPLATE_DIRECTORY,
  );
  const packageName = createPackageName(targetDirectory);

  await assertTargetDirectoryAvailable(targetDirectory);
  await copyTemplateDirectory({
    sourceDirectory: templateDirectory,
    targetDirectory,
  });
  await renameTemplateGitignore(targetDirectory);
  await updatePackageName({ packageName, targetDirectory });

  return targetDirectory;
}
