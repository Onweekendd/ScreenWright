import { warmModelConfigs } from "@/mastra/provider/model-registry";
import { seedComponentEmbeddings } from "@/mastra/vector/seed-embeddings";

// CLI 包装：核心逻辑在 src/mastra/vector/seed-embeddings.ts（路由「重建索引」也复用它）。
// --reset：先删索引再重建（文档被重命名 / 删除后清残留 id）。
const reset = process.argv.includes("--reset") || process.env.RESET_INDEX === "1";

(async () => {
  await warmModelConfigs();
  const { embedded, failed } = await seedComponentEmbeddings({ reset });
  if (failed > 0) {
    console.error(`\n✗ 有 ${failed} 个文档嵌入失败`);
    process.exit(1);
  }
  console.log(`\n✓ 全部完成（${embedded} 条）`);
  process.exit(0);
})().catch((error) => {
  console.error("\n✗ 脚本执行失败:", error);
  process.exit(1);
});
