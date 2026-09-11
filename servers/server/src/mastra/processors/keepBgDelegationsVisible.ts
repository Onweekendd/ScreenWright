import type { Processor, ProcessorMessageContext } from "@mastra/core/processors";

export class keepBgDelegationsVisible implements Processor {
  id = "keep-bg-delegations-visible";

  processInputStep({ messageList, messages }: ProcessorMessageContext) {
    for (const msg of messages) {
      if (msg.role !== "assistant") {
        continue;
      }

      const bg = msg.content?.metadata?.backgroundTasks as Record<string, any> | undefined;
      if (!bg) {
        continue;
      }

      for (const part of msg.content.parts ?? []) {
        if (part.type !== "tool-invocation") {
          continue;
        }

        const ti = part.toolInvocation;
        if (!ti || ti.state === "result") {
          continue;
        } // 已有结果就别动

        const info = bg[ti.toolCallId];
        if (!info) {
          continue;
        } // 只补"确属 background 派发"的，避免误伤真孤儿

        messageList.updateToolInvocation({
          type: "tool-invocation",
          toolInvocation: {
            state: "result",
            toolCallId: ti.toolCallId,
            toolName: ti.toolName,
            args: ti.args,
            result: info.suspendedAt
              ? `[后台任务已挂起] taskId=${info.taskId}，正在等待审批/输入，请勿重复委派。`
              : `[后台任务运行中] taskId=${info.taskId}，已在后台执行，请勿重复委派。`
          }
        });
      }
    }
    return messageList;
  }
}
