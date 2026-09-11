import {
  cloneDeep,
  isArray,
  isBoolean,
  isDate,
  isEmpty,
  isNil,
  isNumber,
  isObject,
  isString,
} from "lodash-es";

// 纯逻辑已迁移到 @screenwright/core，这里重新导出保持物料内部调用点零改动
export { sleep } from "@screenwright/core";

export function thousandFormat(num: number) {
  return num.toString().replace(/\d+/, (n) => {
    return n.replace(/(\d)(?=(\d{3})+$)/g, ($1) => {
      return $1 + ",";
    });
  });
}

export const validData = (val: any, defaultBoolean: boolean) => {
  if (typeof val === "boolean") {
    return val;
  }
  return !validateNull(val) ? val : defaultBoolean;
};

export const getDayText = (): string => {
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  return days[new Date().getDay()];
};

export const setPx = (val: string) => {
  if (isNil(val)) {
    return "";
  }
  val = val + "";
  if (val.indexOf("%") === -1) {
    val = val + "px";
  }
  return val;
};

/**
 * 判断值是否为空（null / undefined / 空字符串 / 空数组 / 空对象）。
 * 特殊规则：数字 0、布尔值、日期视为非空。
 * 从主应用 utils.ts 搬迁，保持行为一致。
 */
export const validateNull = (val: any): boolean => {
  // 特殊判断：如果 val 存在且为数字 0
  if (isNumber(val) && val === 0) {
    return false;
  }
  // 如果是日期、布尔值、数字类型，返回 false
  if (isDate(val) || isBoolean(val) || isNumber(val)) {
    return false;
  }
  // 判断是否为 null 或 undefined
  if (isNil(val)) {
    return true;
  }
  // 如果是字符串且为空或 'null' 或 'undefined'
  if (isString(val) && (val === "" || val === "null" || val === "undefined")) {
    return true;
  }
  // 如果是数组且长度为 0
  if (isArray(val) && isEmpty(val)) {
    return true;
  }
  // 如果是对象
  if (isObject(val)) {
    const newVal = cloneDeep(val) as Record<string, any>;
    const list = ["$parent"];
    list.forEach((ele) => {
      delete newVal[ele];
    });
    return isEmpty(newVal);
  }
  return false;
};
