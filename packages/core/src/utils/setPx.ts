/**
 * 为数值/字符串补上 px 单位：已含 % 原样返回，null/undefined 返回空串。
 * 纯函数，框架无关。
 */
export const setPx = (val: string | null | undefined): string => {
  if (val == null) {
    return "";
  }
  let result = val + "";
  if (result.indexOf("%") === -1) {
    result = result + "px";
  }
  return result;
};
