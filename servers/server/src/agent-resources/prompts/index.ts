import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
// .mastra/output/（上2级=项目根），dist/（上2级=项目根），
// 源码 src/agent-resources/prompts/（上3级=项目根）。
const projectRoot = __dir.includes(".mastra")
  ? join(__dir, "../../")
  : __dir.endsWith("/dist") || __dir.endsWith("\\dist")
    ? join(__dir, "../")
    : join(__dir, "../../../");

export function loadPrompt(filename: string): string {
  return readFileSync(join(projectRoot, "src/agent-resources/prompts", filename), "utf8");
}
