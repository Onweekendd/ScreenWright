import { getRuntimeCallbackArgs } from "@screenwright/core";
import type { ChildComponent, ComponentType, DbItem, Filter } from "@screenwright/types";
import type { Canceler } from "axios";
import axios from "axios";
import { ElMessage } from "element-plus";
import {
  cloneDeep,
  endsWith,
  get,
  isBoolean,
  isEmpty,
  isNil,
  isNull,
  isNumber,
  isObject,
  isString,
  isUndefined
} from "lodash-es";

import { BaseFilter } from "./baseFilter";
import { queryAPIData } from "./ports";

class apiFilter extends BaseFilter {
  /**
   * 回调参数运行时值。必须是 getter：clearCallbackArguments() 会整个替换内部对象，
   * 构造时捕获引用会让本实例此后一直读到一个不再更新的死对象。
   */
  get callbackArgs(): Record<string, any> {
    return getRuntimeCallbackArgs();
  }
  dataQuery = "";
  requestCbArgs: Record<string, any> = {};
  cancelTokenSource = {
    token: null as Canceler | null
  };

  async run(filterConfig: Record<string, Filter>, target: ComponentType | ChildComponent): Promise<any[]> {
    const transformData = await this.transformDataByFilter(filterConfig, target);
    return transformData;
  }

  params = {
    size: 100,
    groupId: -2,
    current: 1,
    status: -2,
    name: ""
  };

  async getInputData(target: ComponentType): Promise<any[]> {
    const sourceConfig = target.dataSource;
    if (isEmpty(sourceConfig) || !sourceConfig.id) {
      return Promise.resolve(target.data);
    }
    const res = await this.getData(target);
    if (res && res.status !== 200 && res.status !== 201) {
      ElMessage.error(get(res, "data.message"));
      return [];
    }
    return get(res, "data") as unknown as any[];
  }

  async getData(target: ComponentType) {
    const sourceConfig = target.dataSource as DbItem;
    const apiBaseUrl = get(sourceConfig, "config") ? JSON.parse(sourceConfig.config!).baseUrl : "";
    if (target.url != apiBaseUrl) {
      target.url = apiBaseUrl + target.url;
    }
    let dataUrl = this.getFullDataUrl(target.url + (target.path ?? ""));
    if (endsWith(dataUrl, "/")) {
      return false;
    }
    let parameter: string | string[] = this.getDataQuery(target);
    if (isString(parameter) && parameter.length > 0) {
      parameter = parameter.split("&");
    }
    if (target.dataMethod === "get") {
      if (parameter.length > 0) {
        dataUrl = dataUrl + "?" + (Array.isArray(parameter) ? parameter.join("&") : parameter);
      }
    }

    const requestHeader = !isEmpty(target.requestHeader) ? this.handleRequest(this.getJson(target.requestHeader)) : {};
    const requestData =
      target.dataMethod === "post" ? Object.assign(this.handleRequest(this.getJson(target.requestBody)) || {}) : {};

    if (target.crossOrigin) {
      const paramsQuery: Record<string, any> = {};
      if (parameter && parameter.length > 0) {
        paramsQuery.params =
          target.dataMethod === "get"
            ? JSON.stringify(parameter)
            : JSON.stringify(
                Object.assign(this.handleRequest(target.requestBody) || "", target.propQuery || "", parameter)
              );
      }
      const res = await queryAPIData({
        dataSite: "",
        headers: JSON.stringify(this.handleRequest(target.requestHeader)),
        method: target.dataMethod,
        data: requestData,
        ...paramsQuery,
        url: dataUrl
      });
      if (res && typeof res === "object" && "status" in res && "data" in res) {
        return { status: (res as any).status, data: (res as any).data };
      }
      return { status: 200, data: (res as any).result ? (res as any).result.values : [] };
      // .then((res: unknown) => {
      //   if (res && typeof res === "object" && "status" in res && "data" in res) {
      //     return { status: (res as any).status, data: (res as any).data }
      //   }
      //   return false
      // })
    } else {
      const res = await axios({
        url: dataUrl,
        method: target.dataMethod,
        data: requestData,
        headers: requestHeader,
        cancelToken: new axios.CancelToken((c) => {
          this.cancelTokenSource.token = c;
        })
      });
      return { status: res.status, data: res.data };
    }
  }
  getJson(str: any) {
    if (isNil(str)) {
      return {};
    }
    if (isString(str)) {
      try {
        return JSON.parse(str);
      } catch {
        return {};
      }
    }
    return str;
  }
  /**
   * 处理请求参数，替换其中的变量为实际值
   * @param request 请求参数
   * @param type 处理类型，默认为 "params"
   * @returns 处理后的请求参数
   */
  handleRequest(request: any, type = "params"): any {
    const curRequest = cloneDeep(request);
    if (isEmpty(curRequest)) {
      return;
    }

    // 预处理：收集所有变量名
    this.collectVariableNames(request);

    // 根据类型处理请求
    if (type !== "body" && isObject(request)) {
      return this.handleObjectRequest(curRequest);
    } else {
      return this.handleStringRequest(curRequest);
    }
  }

  /**
   * 收集请求中的所有变量名
   * @param request 请求对象
   */
  private collectVariableNames(request: any): void {
    const regxAll = /\${(.+?)}/g;
    let result = null;

    while ((result = regxAll.exec(JSON.stringify(request))) !== null) {
      this.requestCbArgs[result[1]] = null;
    }
  }

  /**
   * 处理对象类型的请求参数
   * @param curRequest 当前请求对象
   * @returns 处理后的请求对象
   */
  private handleObjectRequest(curRequest: Record<string, any>): Record<string, any> {
    const regxAll = /\${(.+?)}/g;
    const regxDetail = /(?<=\$\{)(.+?)(?=\})/g;

    Object.keys(curRequest).forEach((key) => {
      const value = curRequest[key];
      const processedValue = this.processObjectValue(value, regxAll, regxDetail);
      curRequest[key] = processedValue;
    });

    return curRequest;
  }

  /**
   * 处理对象中的单个值
   * @param value 要处理的值
   * @param regxAll 全匹配正则
   * @param regxDetail 详细匹配正则
   * @returns 处理后的值
   */
  private processObjectValue(value: any, regxAll: RegExp, regxDetail: RegExp): any {
    if (!isString(value)) {
      return value;
    }

    let res = value;
    const matchAll = value.match(regxAll);
    const matchList = value.match(regxDetail);

    // 检查是否为数字或布尔类型
    const isNum = matchList?.length === 1 && isNumber(get(this.callbackArgs, matchList[0]));
    const isBool = matchList?.length === 1 && isBoolean(get(this.callbackArgs, matchList[0]));

    // 处理所有匹配的变量
    (matchList || []).forEach((params, index) => {
      res = this.replaceVariable(res, params, matchAll?.[index]);
    });

    return this.convertValueType(res, isNum, isBool);
  }

  /**
   * 替换单个变量
   * @param res 当前结果字符串
   * @param params 变量参数
   * @param matchStr 匹配的字符串
   * @returns 替换后的结果
   */
  private replaceVariable(res: any, params: string, matchStr?: string): any {
    const [match, defaultVal] = params.split("||");
    const cbArgs = get(this.callbackArgs, match);

    if (!isUndefined(cbArgs) && !isNull(cbArgs)) {
      res = isObject(cbArgs) ? cbArgs : res.replace(matchStr || "${" + params + "}", cbArgs);
    } else if (defaultVal) {
      res = res.replace(matchStr || "${" + params + "}", defaultVal);
    } else {
      res = cbArgs;
    }

    return !isUndefined(res) ? res || defaultVal || "" : res;
  }

  /**
   * 转换值类型
   * @param res 要转换的值
   * @param isNum 是否为数字类型
   * @param isBool 是否为布尔类型
   * @returns 转换后的值
   */
  private convertValueType(res: any, isNum: boolean, isBool: boolean): any {
    let resValue;

    try {
      if (res === "''") {
        resValue = "";
      } else if (res === "null") {
        resValue = null;
      } else if (res === "undefined") {
        resValue = undefined;
      } else {
        resValue = isNum ? Number(res) : res;
      }

      if (isBool && !isUndefined(resValue)) {
        resValue = JSON.parse(resValue);
      }
    } catch (error) {
      console.error("解析值时出错:", error);
      resValue = null;
    }

    return resValue;
  }

  /**
   * 处理字符串类型的请求参数
   * @param curRequest 当前请求字符串
   * @returns 处理后的请求
   */
  private handleStringRequest(curRequest: any): any {
    const regxDetail = /(?<=\$\{)(.+?)(?=\})/g;
    const matchList = isString(curRequest) ? curRequest.match(regxDetail) : null;

    if (!matchList) {
      return curRequest;
    }

    matchList.forEach((item) => {
      const callbackValue = get(this.callbackArgs, item);
      curRequest = Array.isArray(callbackValue) ? callbackValue : curRequest.replace("${" + item + "}", callbackValue);
    });

    return curRequest;
  }

  removeEmptyKeys(obj: Record<string, any>) {
    return Object.entries(obj).reduce(
      (acc, [key, value]) => {
        if (!isEmpty(value) && !isNull(value) && !isUndefined(value)) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>
    );
  }

  /**
   * 验证数据查询字符串是否有效
   * @param {string | undefined} dataQuery - 数据查询字符串
   * @returns {boolean} 是否为有效的查询字符串
   * @description 检查数据查询字符串是否为空或未定义
   */
  private validateDataQuery(dataQuery: string | undefined): boolean {
    return !isEmpty(dataQuery);
  }

  /**
   * 解析查询字符串为参数数组
   * @param {string} dataQuery - 数据查询字符串
   * @returns {string[]} 查询参数数组
   * @description 将查询字符串按 & 分割成参数数组
   */
  private parseQueryString(dataQuery: string): string[] {
    return dataQuery.split("&");
  }

  /**
   * 从查询参数值中提取变量信息
   * @param {string} value - 查询参数值
   * @returns {{ regxData: string; hasDefault: boolean; variable: string; defaultValue: string }} 变量信息对象
   * @description 使用正则表达式提取变量名和默认值信息
   */
  private extractVariableInfo(value: string): {
    regxData: string;
    hasDefault: boolean;
    variable: string;
    defaultValue: string;
  } {
    const regx = /\${(.+?)}/;
    const [_, regxData = ""] = regx.exec(value) || [];
    const val = regxData.split("||");
    const hasDefault = regxData.includes("||");
    const variable = val[0] || "";
    const defaultValue = hasDefault ? val[1] || "" : value.replace("${" + regxData + "}", "");

    return {
      regxData,
      hasDefault,
      variable,
      defaultValue
    };
  }

  /**
   * 解析变量的实际值
   * @param {string} variable - 变量名
   * @param {string} defaultValue - 默认值
   * @returns {string} 解析后的变量值
   * @description 从回调参数中获取变量值，如果不存在则使用默认值
   */
  private resolveVariableValue(variable: string, defaultValue: string): string {
    return get(this.callbackArgs, variable) ?? defaultValue;
  }

  /**
   * 处理单个查询参数
   * @param {string} param - 单个查询参数字符串 (key=value 格式)
   * @returns {string} 处理后的查询参数
   * @description 解析查询参数中的变量并替换为实际值
   */
  private processQueryParam(param: string): string {
    const [key, value = ""] = param.split("=");
    const variableInfo = this.extractVariableInfo(value);
    const resolvedValue = this.resolveVariableValue(variableInfo.variable, variableInfo.defaultValue);
    return `${key}=${resolvedValue}`;
  }

  /**
   * 获取处理后的数据查询字符串
   * @param {ComponentType} target - 组件对象，包含 dataQuery 属性
   * @returns {string} 处理后的查询字符串
   */
  getDataQuery(target: ComponentType) {
    const { dataQuery } = target;
    console.log(dataQuery, "dataQuery", isEmpty(dataQuery));
    if (isEmpty(dataQuery)) {
      return "";
    }
    if (!this.validateDataQuery(dataQuery)) {
      return "";
    }

    const queryParams = this.parseQueryString(dataQuery!);
    const processedParams = queryParams.map((param) => this.processQueryParam(param));

    return processedParams.join("&");
  }

  getFullDataUrl(path: string) {
    const regx = /\${(.+?)}/;
    let fullPath = path;
    if (regx.test(path)) {
      const regex = /\$\{([^}]+)\}/g;
      let match;
      while ((match = regex.exec(path)) !== null) {
        const params = match[1].split("||");
        const defaultVal = params[1] ?? "";
        fullPath = fullPath.replace(match[0], get(this.callbackArgs, params[0]) ?? defaultVal);
      }
    }
    return fullPath;
  }
}

export { apiFilter };
