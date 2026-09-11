import type { MastraDBMessage, MastraMessagePart } from "@mastra/core/agent";
import type { Processor, ProcessorMessageContext } from "@mastra/core/processors";

/**
 * Mastra streamUntilIdle 在后台任务终态触发续接轮时，会注入一条这样开头的 user 消息
 * (packages/core/src/agent/stream-until-idle.ts: buildContinuationDirective)：
 *   "Background task(s) you previously dispatched have completed. ... IMPORTANT: The
 *    following tool-call IDs are suspended: xxx. Do not attempt to resume them; ..."
 *
 * 问题：不管这批终态里是不是全是 suspended，开头永远是 "have completed" 这句强断言，
 * suspended 的提示只是后半句的补充。主 agent 读到的第一句话先把"已完成"这个结论锚定住，
 * 容易在没意识到任务其实没做完的情况下去抢着把活接着干完(重复调用工具/越权操作)。
 */
const DIRECTIVE_PREFIX = "Background task(s) you previously dispatched have completed.";
const COMPLETED_LIST_RE = /results are now in the conversation\):\s*([^.]*)\./;
const SUSPENDED_LIST_RE = /are suspended:\s*([^.]*)\./;

/** 返回 null 表示不需要改写(不是这条 directive，或这批里没有 suspended 项)。 */
function rewriteDirectiveText(text: string): string | null {
  if (!text.startsWith(DIRECTIVE_PREFIX)) {
    return null;
  }

  const suspendedList = text.match(SUSPENDED_LIST_RE)?.[1]?.trim() ?? "";
  if (!suspendedList) {
    return null; // 这批全部真完成，原文案没有歧义，不用动
  }

  const completedList = text.match(COMPLETED_LIST_RE)?.[1]?.trim() ?? "";

  const segments: string[] = [];
  if (completedList) {
    segments.push(
      `以下后台任务已经真正完成，结果已经在对话中，直接用这些结果回答用户即可，不要重复调用同样的工具：${completedList}。`
    );
  }
  segments.push(
    `以下后台任务目前只是【挂起 suspended，不是完成】，正在等待用户提供 resume 数据：${suspendedList}。` +
      `不要尝试自己继续执行，不要替它生成结果，也不要重复调用相关工具；只需要用一句简短的话告诉用户这些任务在等待其输入即可，然后停止。`
  );
  return segments.join("\n");
}

export class rewriteSuspendedContinuationDirective implements Processor {
  id = "rewrite-suspended-continuation-directive";

  async processInput({ messages }: ProcessorMessageContext): Promise<MastraDBMessage[]> {
    return messages.map((msg) => {
      if (msg.role !== "user") {
        return msg;
      }

      const parts = msg.content?.parts;
      if (!Array.isArray(parts)) {
        return msg;
      }

      let changed = false;
      const newParts = parts.map((part: MastraMessagePart) => {
        const p = part as { type: string; text?: string };
        if (p.type !== "text" || typeof p.text !== "string") {
          return part;
        }
        const rewritten = rewriteDirectiveText(p.text);
        if (rewritten === null) {
          return part;
        }
        changed = true;
        return { ...part, text: rewritten };
      });

      if (!changed) {
        return msg;
      }
      return { ...msg, content: { ...msg.content, parts: newParts } };
    }) as MastraDBMessage[];
  }
}
