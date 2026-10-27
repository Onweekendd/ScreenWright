const toError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)));

/** 保留 Error.cause 链上的网络错误码，例如 UND_ERR_CONNECT_TIMEOUT / ECONNRESET。 */
export const formatErrorChain = (error: unknown): string => {
  const messages: string[] = [];
  const visited = new Set<Error>();
  let current = error;

  while (current instanceof Error && !visited.has(current)) {
    visited.add(current);
    const code = (current as Error & { code?: unknown }).code;
    const label = typeof code === "string" ? `${current.name} [${code}]` : current.name;
    messages.push(`${label}: ${current.message}`);
    current = current.cause;
  }

  return messages.length > 0 ? messages.join(" <- ") : String(error);
};

/**
 * 带指数退避的重试函数
 * @param fn 需要执行的异步函数
 * @param options 配置选项
 * @returns 函数执行结果
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: Error, willRetry: boolean) => void;
    onSuccess?: (attempt: number) => void;
    shouldRetry?: (attempt: number, error: Error) => boolean;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      options?.onSuccess?.(attempt);
      return result;
    } catch (error) {
      lastError = toError(error);
      const willRetry = attempt < maxRetries && (options?.shouldRetry?.(attempt, lastError) ?? true);
      options?.onRetry?.(attempt, lastError, willRetry);

      if (!willRetry) {
        throw new Error(`操作失败,第 ${attempt}/${maxRetries} 次后停止重试: ${formatErrorChain(lastError)}`, {
          cause: lastError
        });
      }

      // 指数退避: 1秒, 2秒, 3秒...
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error(`操作异常结束: ${lastError ? formatErrorChain(lastError) : "未知错误"}`, {
    cause: lastError ?? undefined
  });
}
