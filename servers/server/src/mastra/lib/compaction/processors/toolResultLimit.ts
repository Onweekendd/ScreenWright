import type { Processor, ProcessToolResultArgs } from "@mastra/core/processors";

import { compactionConfig } from "../config";
import { createResultArchiver } from "../tool-result/archive";
import { limitReadFileResult, type ToolResultPolicy } from "../tool-result/limitReadFileResult";

/** 仅处理本次新结果，不扫描或改写已发送的历史。 */
export class ToolResultLimitProcessor implements Processor {
  id = "tool-result-limit";
  private readonly policy: ToolResultPolicy;

  constructor(policy: ToolResultPolicy = limitReadFileResult) {
    this.policy = policy;
  }

  async processToolResult(context: ProcessToolResultArgs) {
    const { toolName, toolCallId, args, result, messageList } = context;
    const archiveOriginal = createResultArchiver({ toolName, toolCallId, args, result });

    try {
      // 副本防止策略在失败前原地改坏真实结果；不更改工具的调用参数。
      const replacement = await this.policy({
        toolName,
        toolCallId,
        args: structuredClone(args),
        result: structuredClone(result),
        maxBytes: compactionConfig.toolResult.maxBytes,
        archiveOriginal
      });
      if (replacement === undefined) {
        return;
      }
      // 裁剪后仍能找回完整原文；写盘失败时保留原始返回值。
      const archivePath = await archiveOriginal();
      const updated = messageList.updateToolInvocation(
        {
          type: "tool-invocation",
          toolInvocation: {
            state: "result",
            toolCallId,
            toolName,
            args,
            result: replacement.result
          }
        },
        { originalToolResultPath: archivePath }
      );
      return updated ? messageList : undefined;
    } catch (error) {
      console.error("[tool-result-limit] 保留原始结果，策略处理失败", { toolName, toolCallId, error });
      return;
    }
  }
}
