/**
 * 解析 url query 参数为对象
 * 纯函数，仅读取 window.location.href 作为缺省值，无副作用
 */
export function parseUrl(search: string): { [key: string]: string } {
  const url = search || window.location.href;
  const queryString = url.substring(url.indexOf("?") + 1);
  const queryParams = queryString.split("&");
  const obj: { [key: string]: string } = {};
  queryParams.forEach((item) => {
    const c = item.split("=");
    obj[c[0]] = c[1]?.indexOf("#%") ? c[1].split("#")[0] : c[1];
  });
  return obj;
}
