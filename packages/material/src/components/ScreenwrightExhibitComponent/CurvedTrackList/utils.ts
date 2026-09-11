/**
 * 工具函数
 */

/**
 * 取模运算（支持负数）
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
