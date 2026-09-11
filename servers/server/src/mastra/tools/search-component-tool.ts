import { createTool } from "@mastra/core/tools";
import z from "zod";

import { vector } from "../vector";
import { embeddingModel } from "../vector/embeddingModel";

export const searchComponentTool = createTool({
  id: "search-component",
  description: `
    根据用户的自然语言描述，在 Screenwright 平台的组件库中搜索最匹配的可视化组件。
    当用户提到需要添加图表、组件、可视化元素，或询问"有没有 xxx 类型的组件"时，
    必须先调用此工具确认平台支持的组件，再进行创建或推荐操作。
    返回最相关的组件列表，包含组件 ID、分类和描述文档。
  `,
  inputSchema: z.object({
    query: z.string().describe("用户对组件的自然语言描述，如'展示各地区销售额对比的图表'"),
    topK: z.number().optional().default(3).describe("返回最相关的组件数量，默认 3 个")
  }),
  execute: async ({ query, topK }) => {
    const { embeddings } = await embeddingModel.doEmbed({ values: [query] });
    const embedding = embeddings[0];

    const results = await vector.query({
      indexName: "component_docs",
      queryVector: embedding,
      topK: topK ?? 3
    });

    return results.map((r) => ({
      componentId: r.metadata?.componentId as string,
      category: r.metadata?.category as string,
      score: r.score,
      doc: r.metadata?.text as string
    }));
  }
});
