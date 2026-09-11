import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getModelConfigSync } from "@/mastra/provider/model-registry";
import { embeddingModel } from "@/mastra/vector/embeddingModel";
import { vector } from "@/mastra/vector/index";

/**
 * 组件文档 RAG 向量的写入逻辑（可复用：CLI 脚本 + 换嵌入模型后的「重建索引」路由）。
 *
 * 索引维度取 `ai_model` 表 embedding 行的 `dimensions`（换模型后维度不一致会自动删索引重建）。
 */

const INDEX_NAME = "component_docs";
const BATCH_SIZE = 20;
// bge-large-zh-v1.5 最大输入 512 token（中文约 1 字/token），留余量截断避免上游 400
const MAX_CHARS = 480;
const DEFAULT_DIMENSION = 1024;

const __dir = path.dirname(fileURLToPath(import.meta.url));
// .mastra/output/（上2级=根）、dist/（上1级=根）、源码 src/mastra/vector/（上3级=根）
const serverRoot = __dir.includes(".mastra")
  ? path.join(__dir, "../../")
  : __dir.endsWith("/dist") || __dir.endsWith("\\dist")
    ? path.join(__dir, "../")
    : path.join(__dir, "../../../");
const DOCS_DIR = path.join(serverRoot, "src/mastra/vector/component-docs");

interface ComponentDoc {
  filePath: string;
  componentId: string;
  category: string;
  content: string;
}

function readAllDocs(dir: string): ComponentDoc[] {
  const docs: ComponentDoc[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      docs.push(...readAllDocs(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      docs.push({
        filePath: fullPath,
        componentId: path.basename(entry.name, ".md"),
        category: path.basename(path.dirname(fullPath)),
        content: fs.readFileSync(fullPath, "utf-8")
      });
    }
  }
  return docs;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function truncate(doc: ComponentDoc): string {
  if (doc.content.length <= MAX_CHARS) {
    return doc.content;
  }
  console.warn(`  ⚠ ${doc.category}/${doc.componentId} 内容 ${doc.content.length} 字符，截断至 ${MAX_CHARS}`);
  return doc.content.slice(0, MAX_CHARS);
}

async function embedAndUpsert(docs: ComponentDoc[]): Promise<void> {
  const result = await embeddingModel.doEmbed({ values: docs.map(truncate) });
  await vector.upsert({
    indexName: INDEX_NAME,
    vectors: result.embeddings,
    ids: docs.map((d) => d.componentId),
    metadata: docs.map((d) => ({ componentId: d.componentId, category: d.category, text: d.content }))
  });
}

async function ensureIndex(dimension: number, reset: boolean): Promise<void> {
  const indexes = await vector.listIndexes();
  const exists = indexes.includes(INDEX_NAME);

  // 已存在且不 reset：维度一致就原地 upsert，不一致则删重建
  if (exists && !reset) {
    const stats = await vector.describeIndex({ indexName: INDEX_NAME });
    if (stats.dimension === dimension) {
      console.log(`索引 "${INDEX_NAME}" 已存在（维度 ${stats.dimension}，现有 ${stats.count} 条），原地 upsert`);
      return;
    }
    console.log(`索引维度不符（${stats.dimension} → ${dimension}），删除重建`);
  }

  if (exists) {
    await vector.deleteIndex({ indexName: INDEX_NAME });
  }
  await vector.createIndex({ indexName: INDEX_NAME, dimension });
  console.log(`索引 "${INDEX_NAME}" 就绪（维度 ${dimension}）`);
}

export interface SeedEmbeddingsResult {
  embedded: number;
  failed: number;
}

/**
 * 读组件文档 → 生成 embedding → 写向量库。幂等（按 componentId upsert）。
 * `reset` 时先删索引重建（文档被重命名 / 删除后清残留）。
 */
export async function seedComponentEmbeddings(opts: { reset?: boolean } = {}): Promise<SeedEmbeddingsResult> {
  const dimension = getModelConfigSync("embedding").dimensions ?? DEFAULT_DIMENSION;
  console.log(`=== 嵌入组件文档（维度 ${dimension}）===`);

  const docs = readAllDocs(DOCS_DIR);
  console.log(`找到 ${docs.length} 个组件文档 @ ${DOCS_DIR}`);
  if (docs.length === 0) {
    return { embedded: 0, failed: 0 };
  }

  await ensureIndex(dimension, !!opts.reset);

  let embedded = 0;
  let failed = 0;
  const batches = chunk(docs, BATCH_SIZE);
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`[批次 ${i + 1}/${batches.length}] ${batch.length} 篇`);
    try {
      await embedAndUpsert(batch);
      embedded += batch.length;
    } catch {
      console.warn(`  ⚠ 批次 ${i + 1} 整批失败，降级逐条`);
      for (const doc of batch) {
        try {
          await embedAndUpsert([doc]);
          embedded += 1;
        } catch (e) {
          failed += 1;
          console.error(`  ✗ ${doc.category}/${doc.componentId}:`, (e as Error).message);
        }
      }
    }
  }

  console.log(`=== 完成：成功 ${embedded}，失败 ${failed} ===`);
  return { embedded, failed };
}
