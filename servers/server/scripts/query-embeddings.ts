import { warmModelConfigs } from "@/mastra/provider/model-registry";
import { embeddingModel } from "@/mastra/vector/embeddingModel";
import { vector } from "@/mastra/vector/index";

const INDEX_NAME = "component_docs";

async function main() {
  await warmModelConfigs();
  // 1. 查看索引基本信息
  const stats = await vector.describeIndex({ indexName: INDEX_NAME });
  console.log("=== 索引信息 ===");
  console.log(`  维度: ${stats.dimension}`);
  console.log(`  向量数量: ${stats.count}`);
  console.log(`  距离度量: ${stats.metric}`);

  // 2. 用自然语言语义搜索测试
  const query = process.argv[2] ?? "柱状图";
  console.log(`\n=== 语义搜索: "${query}" ===`);

  const { embeddings } = await embeddingModel.doEmbed({ values: [query] });
  const results = await vector.query({
    indexName: INDEX_NAME,
    queryVector: embeddings[0],
    topK: 5
  });

  results.forEach((r, i) => {
    console.log(`\n[${i + 1}] score: ${r.score.toFixed(4)}`);
    console.log(`  componentId: ${r.metadata?.componentId}`);
    console.log(`  category:    ${r.metadata?.category}`);
    // 只打印前 100 字
    const preview = (r.metadata?.text as string)?.slice(0, 100).replace(/\n/g, " ");
    console.log(`  text:        ${preview}...`);
  });
}

main().catch(console.error);
