import { cp, mkdir, rename, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(scriptDirectory, "..");
const sourceDirectory = resolve(
  packageDirectory,
  "../../apps/artifact-app-template",
);
const targetDirectory = join(packageDirectory, "dist", "template");
const excludedNames = new Set([".git", ".turbo", "dist", "node_modules"]);

await rm(targetDirectory, { force: true, recursive: true });
await mkdir(dirname(targetDirectory), { recursive: true });
await cp(sourceDirectory, targetDirectory, {
  filter: (source) => !excludedNames.has(basename(source)),
  recursive: true,
});
await rename(
  join(targetDirectory, ".gitignore"),
  join(targetDirectory, "_gitignore"),
);
