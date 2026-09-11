import { vector } from "@/mastra/vector/index";

/**
 * 判断组件向量库是否已就绪（有数据）。
 * 退出码 0 = 已有数据（可跳过灌库）；非 0 = 空或不存在（需要灌库）。
 * 供 docker-entrypoint.sh 按数据判断是否执行 seed，取代不持久的容器内标记文件。
 */
const INDEX_NAME = "component_docs";

async function main(): Promise<void> {
  const indexes = await vector.listIndexes();
  if (!indexes.includes(INDEX_NAME)) {
    console.log(`索引 "${INDEX_NAME}" 不存在，需要灌库`);
    process.exit(1);
  }

  const stats = await vector.describeIndex({ indexName: INDEX_NAME });
  if (stats.count > 0) {
    console.log(`索引 "${INDEX_NAME}" 已有 ${stats.count} 条向量`);
    process.exit(0);
  }

  console.log(`索引 "${INDEX_NAME}" 为空，需要灌库`);
  process.exit(1);
}

main().catch((error) => {
  console.error("检查向量库失败:", error);
  // 检查失败按「需要灌库」处理，交由后续 seed 决定成败
  process.exit(1);
});
