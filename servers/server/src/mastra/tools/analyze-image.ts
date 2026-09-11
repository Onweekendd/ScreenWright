import { createTool } from "@mastra/core/tools";
import z from "zod";

import { visionAgent } from "../agents/vision-agent";
import { fetchChatImageAsDataUrl } from "../services/chat-image.server";

const extractTag = (raw: string, tag: string): string | undefined => {
  const match = raw.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : undefined;
};

/** vision-agent 只输出 <description>;若模型没按契约包标签,则把整段文本兜底当描述。 */
const parseDescription = (raw: string): string => extractTag(raw, "description") ?? raw.trim();

export const analyzeImageTool = createTool({
  id: "analyze-image",
  description: [
    "使用视觉模型识别图片内容,只返回自然语言描述(不生成 echart、不写文件、不建组件)。",
    "主模型 DeepSeek 不具备视觉能力,凡是用户上传图片并询问其样式/数据/布局时,",
    "必须调用本工具,把消息中所有 file part 的 URL 收集成数组传给 imageUrls。",
    "工具会为每张图分别调用 vision-agent,返回与输入顺序一致的 results 数组。",
    "拿到 results[i].description 后,由你(主 agent)决策后续:单个图表/局部走 image-to-component,",
    "整屏设计稿走图片转大屏工作流;需要 echart 通用组件兜底时再调 generate_echart_option。"
  ].join(""),
  inputSchema: z.object({
    imageUrls: z
      .array(z.string())
      .min(1)
      .describe(
        "图片可访问 URL 数组(顺序与用户消息中的 file part 一致,均为 MinIO URL)。每张图会独立走一次 vision-agent。"
      ),
    instruction: z
      .string()
      .optional()
      .describe(
        "主 agent 对 vision-agent 的具体指令,作为 text part 同时传给所有图片对应的 vision-agent 调用。例如:'重点描述图中的柱状图样式与系列'。可选,留空则由 vision-agent 自身 instructions 决定行为。"
      )
  }),
  outputSchema: z.object({
    success: z.boolean(),
    results: z
      .array(
        z.object({
          imageUrl: z.string().describe("对应输入 imageUrls 中的原始 URL"),
          success: z.boolean(),
          description: z.string().describe("视觉模型给出的自然语言描述;失败时为空字符串"),
          error: z.string().optional().describe("失败原因,仅在 success=false 时存在")
        })
      )
      .describe("与输入 imageUrls 顺序一致的逐图结果"),
    error: z.string().optional().describe("整体失败原因(例如所有图片都失败时的概述)")
  }),
  execute: async ({ imageUrls, instruction }, context) => {
    const results = await Promise.all(
      imageUrls.map(async (imageUrl) => {
        // onError 里拿到的才是模型/接口真实报错(如鉴权失败、内容被拦截、超时),
        // 必须收集起来透传给主 agent,否则只剩"输出为空"这种无信息量的兜底文案。
        let agentError: string | undefined;
        try {
          const dataUrl = await fetchChatImageAsDataUrl(imageUrl);
          const content: Array<{ type: "image"; image: string } | { type: "text"; text: string }> = [
            { type: "image", image: dataUrl }
          ];

          if (instruction) {
            content.push({ type: "text", text: instruction });
          }
          const stream = await visionAgent.stream(
            [
              {
                role: "user",
                content
              }
            ],
            {
              onError: (error) => {
                const err = error as unknown;
                const message =
                  err instanceof Error
                    ? err.message
                    : typeof err === "object" && err !== null && "error" in err
                      ? String((err as { error: unknown }).error)
                      : String(err);
                agentError = message;
                console.error("Vision Agent error:", error);
              }
            }
          );

          // 把 vision-agent 的 fullStream 直接管道到上层 tool writer，让前端能实时看到识图过程
          // 即使 pipe 失败也不抛错，继续尝试获取已生成的部分文本
          let streamError: string | undefined;
          try {
            const writer = context?.writer;
            if (writer) {
              await stream.fullStream.pipeTo(writer);
            }
          } catch (pipeError) {
            streamError = pipeError instanceof Error ? pipeError.message : String(pipeError);
            console.error("Vision Agent stream pipe error:", pipeError);
          }

          let raw = "";
          try {
            raw = ((await stream.text) ?? "").trim();
          } catch (textError) {
            streamError = streamError
              ? `${streamError}; ${textError instanceof Error ? textError.message : String(textError)}`
              : textError instanceof Error
                ? textError.message
                : String(textError);
            console.error("Vision Agent text retrieval error:", textError);
          }

          const description = parseDescription(raw);

          // 即使流式处理出错，只要拿到有效描述就返回；完全没描述才算失败
          if (!description) {
            const parts: string[] = [];
            if (agentError) {
              parts.push(`vision-agent 报错: ${agentError}`);
            }
            if (streamError) {
              parts.push(`vision-agent 流式处理出错: ${streamError}`);
            }
            // 只有在既没有底层报错、也没有流式错误时,才使用"输出为空"的兜底描述
            if (parts.length === 0) {
              parts.push("vision-agent 输出为空(可能在流式处理中被截断)");
            }
            return {
              imageUrl,
              success: false,
              description: "",
              error: parts.join("; ")
            };
          }

          const warnings = [
            agentError ? `vision-agent 报错: ${agentError}` : undefined,
            streamError ? `vision-agent 流式处理出错: ${streamError}` : undefined
          ].filter(Boolean);
          return {
            imageUrl,
            success: true,
            description,
            ...(warnings.length > 0 ? { error: `已获取描述但存在异常: ${warnings.join("; ")}` } : {})
          };
        } catch (error) {
          return {
            imageUrl,
            success: false,
            description: "",
            error: error instanceof Error ? error.message : String(error)
          };
        }
      })
    );

    const anySuccess = results.some((r) => r.success);
    return {
      success: anySuccess,
      results,
      error: anySuccess ? undefined : "全部图片识别失败,详见 results[i].error"
    };
  }
});
