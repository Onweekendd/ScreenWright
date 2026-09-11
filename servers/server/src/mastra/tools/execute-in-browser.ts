import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { AgentMode } from "../types/bi-chat";
import { SuspendDefs, SuspendType } from "../types/suspend";

export const executeInBrowserTool = createTool({
  id: "execute_in_browser",
  description: `Execute JavaScript in the Screenwright browser page context and return the result.

The script runs via window.screenwright.sdk. Return values are JSON-serialized.
Supports async expressions (the result will be awaited).

**Script 写法要求（重要）：**

执行器会把 \`script\` 包进一个外层 async 函数后执行，等价于：

\`\`\`js
const fn = new Function(\`return (async () => { \${script} })()\`);
const result = await fn();
\`\`\`

因此 \`script\` 必须**直接写语句体**，并以 \`return\` 显式返回结果。**不要自己再包一层 \`(async () => { ... })()\` IIFE**，否则外层 wrapper 没有 \`return\`，最终 \`result\` 为 \`undefined\`，序列化后 \`result\` 字段会被省略，调用方只能拿到 \`{ ok: true }\`，看不到任何数据。

✅ 正确：
\`\`\`js
const df = window.screenwright.sdk.useDataFilter();
const containerResult = await df.getFilterResultsByComponentId('3184964');
return { container: containerResult };
\`\`\`

❌ 错误（自包 IIFE，结果会丢失）：
\`\`\`js
(async () => {
  const df = window.screenwright.sdk.useDataFilter();
  return { container: await df.getFilterResultsByComponentId('3184964') };
})()
\`\`\`

**Before writing a script**, activate the SDK hook reference via the skill tool (sw-bigscreen-hooks) to get correct method names and signatures. Do not guess hook APIs — wrong field names silently return undefined or throw.`,

  inputSchema: z.object({
    script: z
      .string()
      .describe(
        "JavaScript code to evaluate in the browser. Has access to window.screenwright.sdk and all window globals. **写法：直接写语句体并以 `return` 返回结果**（例如 `const x = await ...; return x;`）。执行器会自动包一层 async wrapper，**不要**自己再写 `(async () => { ... })()` IIFE —— 那样外层 wrapper 拿不到返回值，`result` 字段会丢失，调用方只会看到 `{ ok: true }`。"
      ),
    purpose: z
      .string()
      .optional()
      .describe("Brief description of what this script does, shown to user in ASK mode for approval.")
  }),

  outputSchema: z.object({
    ok: z.boolean(),
    result: z.string().optional().describe("JSON-serialized return value of the script"),
    error: z.string().optional().describe("Error message if execution failed")
  }),

  suspendSchema: z.discriminatedUnion("type", [
    SuspendDefs[SuspendType.ExecuteInBrowser].suspend,
    SuspendDefs[SuspendType.AskApprovalExecuteInBrowser].suspend
  ]),

  resumeSchema: SuspendDefs[SuspendType.AskApprovalExecuteInBrowser].resume,

  execute: async ({ script, purpose }, context) => {
    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;
    const { resumeData, suspend } = context?.agent ?? {};

    // 从 suspend 恢复
    if (resumeData) {
      if ("approved" in resumeData && resumeData.approved === false) {
        return { ok: false, error: "用户取消了执行操作" };
      } else if ("ok" in resumeData) {
        return {
          ok: (resumeData.ok as boolean) ?? false,
          result: resumeData.result as string | undefined,
          error: resumeData.error as string | undefined
        };
      }
    }

    if (!suspend) {
      return { ok: false, error: "suspend not available" };
    }

    if (mode === AgentMode.ASK_BEFORE_EDIT) {
      return suspend({
        type: SuspendType.AskApprovalExecuteInBrowser,
        purpose: purpose ?? `在浏览器执行脚本: ${script.slice(0, 60)}`,
        script
      }) as never;
    }

    return suspend({
      type: SuspendType.ExecuteInBrowser,
      script
    }) as never;
  }
});
