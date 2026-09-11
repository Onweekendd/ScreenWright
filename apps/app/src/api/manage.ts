import { ElMessage } from "element-plus";

import { request } from "@/utils/service";

/**
 * 常规接口请求
 * @param {*} url
 * @param {*} params
 * @param {*} method
 * @returns
 */
export const httpAction = (url: string, params: any, method: string, headers?: any) => {
  return request({
    url,
    method,
    data: params,
    headers
  });
};
export const postAction = (url: string, params: any, headers?: any) => {
  return request({
    url,
    method: "post",
    data: params,
    headers
  });
};
export const getAction = (url: string, params: any, headers?: any) => {
  return request({
    url,
    method: "get",
    data: params,
    headers
  });
};
export const putAction = (url: string, params: any) => {
  return request({
    url,
    method: "put",
    data: params
  });
};
export const deleteAction = (url: string, params: any) => {
  return request({
    url,
    method: "delete",
    data: params
  });
};
/**
 * 下载文件 用于excel导出
 * @param url
 * @param parameter
 * @returns {*}
 */
export const downFile = (url: string, parameter: any) => {
  return request({
    url,
    method: "get",
    params: parameter,
    responseType: "blob"
  });
};

/**
 * 下载文件
 * @param url 文件路径
 * @param fileName 文件名
 * @param parameter
 * @returns {*}
 */
export const downloadFile = async (url: string, fileName: string, parameter: any) => {
  const data = (await downFile(url, parameter)) as any;
  if (!data || data.size === 0) {
    ElMessage({ type: "warning", message: "文件下载失败" });
    return;
  }
  if (typeof (window.navigator as any).msSaveBlob !== "undefined") {
    (window.navigator as any).msSaveBlob(new Blob([data.data]), fileName);
  } else {
    const objUrl = window.URL.createObjectURL(new Blob([data.data]));
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = objUrl;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // 下载完成移除元素
    window.URL.revokeObjectURL(objUrl); // 释放掉blob对象
  }
  return downFile(url, parameter).then((data: any) => {
    if (!data || data.size === 0) {
      ElMessage({ type: "warning", message: "文件下载失败" });
      return;
    }
    if (typeof (window.navigator as any).msSaveBlob !== "undefined") {
      (window.navigator as any).msSaveBlob(new Blob([data]), fileName);
    } else {
      const objUrl = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = objUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link); // 下载完成移除元素
      window.URL.revokeObjectURL(objUrl); // 释放掉blob对象
    }
  });
};
