/**
 * 把可能是 JSON 字符串的值解析成对象；如果已经是对象则原样返回；解析失败返回兜底值。
 * 纯函数，框架无关。
 *
 * @param val 可能为对象、JSON 字符串或 undefined
 * @param fallback 解析失败/为空时的兜底值
 */
export function parseIfNeeded<T>(val: T | string | undefined, fallback: T): T {
  if (typeof val === "object" && val !== null) {
    return val as T;
  }
  try {
    return val ? (JSON.parse(val as string) as T) : fallback;
  } catch {
    return fallback;
  }
}
