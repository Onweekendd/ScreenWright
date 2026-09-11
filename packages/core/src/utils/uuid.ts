/**
 * 生成 UUID。优先使用 crypto.randomUUID，运行时不支持时回退到伪随机生成。
 * @param len 返回长度，默认 36（标准 UUID 含连字符）；指定其他长度则去掉连字符后截断到指定长度。
 * 纯函数，框架无关。
 */
export const uuid = (len = 36): string => {
  const standard =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
  if (len === 36) {
    return standard;
  }
  return standard.replace(/-/g, "").slice(0, len);
};
