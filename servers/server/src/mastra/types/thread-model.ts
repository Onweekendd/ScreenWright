/** 可按对话单独选择模型的角色；embedding 与向量索引维度绑定，只能全局切换 */
export type ThreadModelRole = "reasoning" | "image" | "video";

/** 对话的模型选择：角色 → ai_model.id，缺的角色用默认 */
export type ThreadModelSelection = Partial<Record<ThreadModelRole, string>>;

/**
 * 从一次 run 的 RequestContext 里取对话为某角色选的配置 id（由 buildRequestContext 放入 `models`）。
 * 工具拿到的 requestContext 没有带上 CommonRunTimeType 的类型，这里集中做一次断言，别让每个工具各写一遍。
 */
export const selectedModelConfigId = (
  requestContext: { get: (key: string) => unknown } | undefined,
  role: ThreadModelRole
): string | undefined => (requestContext?.get("models") as ThreadModelSelection | undefined)?.[role];
