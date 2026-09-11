/**
 * 标题生成服务
 *
 * 负责：流式生成对话标题并返回
 */

import { toAISdkStream } from "@mastra/ai-sdk";
import type { UIMessage } from "ai";
import { createUIMessageStreamResponse } from "ai";

import { titleAgent } from "../agents/title-agent";
import { memory } from "../storage/storage";

// ========== 类型定义 ==========

/** 标题生成请求参数 */
export interface TitleGenerationRequest {
  messages: UIMessage[];
  threadId: string;
}

// ========== 工具函数 ==========

/** 提取 UIMessage 的纯文本内容 */
const extractTextContent = (msg: UIMessage | undefined): string => {
  if (!msg) {
    return "";
  }

  const content = "content" in msg ? msg.content : undefined;
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(msg.parts)) {
    return "";
  }

  return msg.parts
    .filter((p) => typeof p === "object" && p !== null && "text" in p)
    .map((p) => (p as { text: string }).text)
    .join("");
};

// ========== Input 构建 ==========

/** 将用户问题格式化为 user 消息文本（指令由 Agent instructions 承载） */
const buildTitleGenerationPrompt = (userContent: string): string => {
  return `用户问题：
${userContent || "（无用户问题）"}`;
};

/** 从对话消息构建标题生成 Agent 的 messages 输入 */
const buildTitleGenerationInput = (messages: UIMessage[]): UIMessage[] => {
  const userContent = extractTextContent(messages.find((m) => m.role === "user"));
  const prompt = buildTitleGenerationPrompt(userContent);

  return [
    {
      id: "title-generation-prompt",
      role: "user",
      content: prompt,
      parts: [{ type: "text", text: prompt }]
    } as UIMessage
  ];
};

// ========== Handler ==========

export async function handleGenerateTitle(body: TitleGenerationRequest): Promise<Response> {
  try {
    const { messages, threadId } = body;

    if (!threadId) {
      return new Response(JSON.stringify({ error: "缺少 threadId 参数" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const titleMessages = buildTitleGenerationInput(messages);

    const mastraTitleStream = await titleAgent.stream(titleMessages as Parameters<typeof titleAgent.stream>[0], {
      onFinish: async ({ text }: { text: string }) => {
        const thread = await memory.getThreadById({ threadId });
        if (thread) {
          await memory.updateThread({
            ...(thread as { id: string; title: string; metadata: Record<string, unknown> }),
            title: text
          });
        }
      }
    });

    const titleStream = toAISdkStream(mastraTitleStream, { from: "agent", sendReasoning: false });

    return createUIMessageStreamResponse({ stream: titleStream as ReadableStream });
  } catch (error) {
    console.error("[title-generation] error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
