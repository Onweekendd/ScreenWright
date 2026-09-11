/**
 * 把未知异常转换为可读的错误信息。
 *
 * @param error 捕获到的未知异常。
 * @param fallback 值不是 Error 时使用的固定信息；省略时退回该值的字符串形式。
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback ?? String(error);
}
