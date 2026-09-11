import { formatErrorChain, retryWithBackoff } from "@/mastra/workflows/figma-to-bi/utils/async";

const DEFAULT_SEMANTIC_LAYOUT_MAX_RETRIES = 3;

const getSemanticLayoutMaxRetries = (): number => {
  const configuredMaxRetries = Number(process.env.SEMANTIC_LAYOUT_MAX_RETRIES);
  return Number.isInteger(configuredMaxRetries) && configuredMaxRetries > 0
    ? configuredMaxRetries
    : DEFAULT_SEMANTIC_LAYOUT_MAX_RETRIES;
};

export const retrySemanticLayoutGenerate = <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  const maxRetries = getSemanticLayoutMaxRetries();
  return retryWithBackoff(fn, {
    maxRetries,
    onRetry: (attempt, error, willRetry) => {
      const retryStatus = willRetry ? "将退避重试" : "不再重试";
      console.warn(`[SemanticLayout] ${label} 第 ${attempt}/${maxRetries} 次调用失败，${retryStatus}`, {
        detail: formatErrorChain(error)
      });
    }
  });
};
