import type { EmbeddingModel } from "ai";

import { resolveEmbeddingModel } from "@/mastra/provider/model-registry";

type ConcreteEmbeddingModel = Exclude<EmbeddingModel, string>;

/**
 * 惰性代理：每次属性访问都重新 `resolveEmbeddingModel()`（读 model-registry 同步缓存），
 * 这样设置页改了嵌入模型后无需重启即可生效。
 *
 * 依赖 `warmModelConfigs()` 已在 runtime 启动时跑过；独立脚本（seed / query）需自己先调。
 * `storage.ts` 只把它作为 embedder 引用传给 Memory（semanticRecall 未启用，实际不调用）。
 */
const embeddingModel: ConcreteEmbeddingModel = new Proxy({} as ConcreteEmbeddingModel, {
  get(_target, prop, receiver) {
    return Reflect.get(resolveEmbeddingModel() as object, prop, receiver);
  }
});

export { embeddingModel };
