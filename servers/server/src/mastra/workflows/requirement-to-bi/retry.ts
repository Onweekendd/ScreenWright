import { formatErrorChain, retryWithBackoff } from "@/mastra/workflows/figma-to-bi/utils/async";

/**
 * 模型调用的退避重试。
 *
 * 补的是一个实测出来的缺口：从零构建这条链路最初两步模型调用都没包重试，
 * 而 `foreach(concurrency: 4)` 并发打同一个 provider 时**必然**会偶发
 * `Cannot connect to API: other side closed`（undici `UND_ERR_SOCKET`）。
 * 连跑两轮 eval，两轮都命中——第二轮直接让「kpi-strip」整块区被跳过，
 * 上游 agent 只好多花四次 `create_component` 去补。
 *
 * figma 那条链路早就有同样的包装（`retrySemanticLayoutGenerate`），
 * 这里不复用它只是因为不想让两条工作流共享同一个 env 开关：
 * 并发度不同，合适的重试次数也不该被绑在一起。
 */
const MAX_RETRIES = 3;

export const retryGenerate = <T>(label: string, fn: () => Promise<T>): Promise<T> =>
  retryWithBackoff(fn, {
    maxRetries: MAX_RETRIES,
    onRetry: (attempt, error, willRetry) => {
      console.warn(
        `[requirement-to-bi] ${label} 第 ${attempt}/${MAX_RETRIES} 次模型调用失败，${willRetry ? "将退避重试" : "不再重试"}`,
        { detail: formatErrorChain(error) }
      );
    }
  });
