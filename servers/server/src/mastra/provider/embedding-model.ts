import { createOpenAI } from "@ai-sdk/openai";
import type { EmbeddingModel } from "ai";
import { wrapEmbeddingModel } from "ai";

interface EmbeddingConfig {
  baseUrl: string;
  apiKey: string;
  modelId: string;
  dimensions: number | null;
}

/** 写索引、检索和连接测试共用维度参数与输出校验。 */
export function createConfiguredEmbeddingModel(config: EmbeddingConfig): Exclude<EmbeddingModel, string> {
  const provider = createOpenAI({ baseURL: config.baseUrl || undefined, apiKey: config.apiKey || "missing" });
  const model = provider.embeddingModel(config.modelId);
  const dimensions = config.dimensions;
  if (dimensions == null) {
    return model;
  }
  if (!Number.isInteger(dimensions) || dimensions <= 0) {
    throw new Error("嵌入模型的向量维度必须是正整数");
  }
  return wrapEmbeddingModel({
    model,
    middleware: {
      specificationVersion: "v3",
      transformParams: async ({ params }) => ({
        ...params,
        providerOptions: {
          ...params.providerOptions,
          openai: { ...params.providerOptions?.openai, dimensions }
        }
      }),
      wrapEmbed: async ({ doEmbed }) => {
        const result = await doEmbed();
        const mismatch = result.embeddings.find((embedding) => embedding.length !== dimensions);
        if (mismatch) {
          throw new Error(
            `嵌入模型 "${config.modelId}" 请求 ${dimensions} 维，但返回 ${mismatch.length} 维；请检查服务商是否支持 dimensions 参数，并保持模型配置与索引维度一致`
          );
        }
        return result;
      }
    }
  });
}
