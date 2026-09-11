import type { Ref } from "vue";

import { isArray, isPlainObject, isString } from "lodash-es";

import type { ParamsInterface } from "./constant";
import { activeNameEnum, emApiType, methodsEnum } from "./constant";

/**
 * 将数组转换为对象
 * @param arr - 要转换的数组
 * @returns 转换后的对象
 */
const arrayToObject = (arr: Array<any>) => {
  if (isPlainObject(arr)) {
    return arr;
  }
  if (isString(arr) || !isArray(arr)) {
    return {};
  }
  return arr.reduce((acc: any, cur: any) => {
    if (cur.key && cur.key.length > 0) {
      acc[cur.key] = cur.value;
    }
    return acc;
  }, {});
};

/**
 * 根据类型将数组转换为对象
 * @param params - 参数引用
 * @param type - 类型
 * @returns 转换后的对象
 */
const arrayToObjectByType = (params: Ref<ParamsInterface>, type: activeNameEnum) => {
  const arr = params.value.data[type].listData;
  return arrayToObject(arr);
};

/**
 * 获取请求头数据
 * @param params - 参数引用
 * @returns 请求头数据对象
 */
const getHeader = (params: Ref<ParamsInterface>) => {
  if (params.value.activeName === activeNameEnum.Header) {
    return arrayToObjectByType(params, activeNameEnum.Header);
  }
  return {};
};

/**
 * 获取查询参数或请求数据
 * @param params - 参数引用
 * @returns 查询参数或请求数据对象
 */
const getQueryOrData = (params: Ref<ParamsInterface>) => {
  if (params.value.activeName !== activeNameEnum.Query) {
    return {};
  }
  const queryParams = arrayToObjectByType(params, activeNameEnum.Query);
  const key = params.value.methods === methodsEnum.GET ? "params" : "data";
  return {
    [key]: queryParams
  };
};

/**
 * 根据 API 类型获取表单数据
 * @param params - 参数引用
 * @returns 表单数据对象
 */
const getFormDataByEmApiType = (params: Ref<ParamsInterface>) => {
  if (params.value.activeName !== activeNameEnum.Body) {
    return {};
  }
  const apiType = params.value.data[activeNameEnum.Body].apiType;
  if (apiType === emApiType.FormData || apiType === emApiType.Raw) {
    let rawData;
    try {
      rawData = JSON.parse(params.value.data[activeNameEnum.Body][apiType]);
    } catch (error) {
      console.error("解析 JSON 失败，使用原始字符串作为数据", error);
      rawData = params.value.data[activeNameEnum.Body][apiType];
    }
    const listData =
      apiType === emApiType.FormData ? params.value.data[activeNameEnum.Body][apiType].listData : rawData;
    const dataObject = arrayToObject(listData);
    const formData = new FormData();
    for (const k in dataObject) {
      const item = dataObject[k as keyof typeof dataObject];
      formData.append(k, item);
    }
    return {
      data: formData
    };
  }
  return {};
};

/**
 * 获取 JSON 格式的数据
 * @param params - 参数引用
 * @returns JSON 格式的数据对象
 */
const getDataByJson = (params: Ref<ParamsInterface>) => {
  if (params.value.activeName !== activeNameEnum.Body) {
    return {};
  }
  const apiType = params.value.data[activeNameEnum.Body].apiType;
  if (apiType === emApiType.Json) {
    return {
      data: JSON.parse(params.value.data[activeNameEnum.Body][emApiType.Json])
    };
  }
  return {};
};

export { getDataByJson, getFormDataByEmApiType, getHeader, getQueryOrData };
