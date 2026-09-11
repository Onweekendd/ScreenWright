/**
 * 将路径字符串转换为去掉斜杠后的字符串
 * @param path - 路径字符串，例如 "/display"
 * @returns 去掉斜杠后的字符串，例如 "display"
 */
export const convertPathToName = (path?: string | null): string => {
  // 去掉路径字符串开头的斜杠
  if (!path) {
    return "";
  }
  return path.startsWith("/") ? path.slice(1) : path;
};
