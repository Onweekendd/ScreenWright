import type { Condition } from "@screenwright/types";
import { ConditionTypeEnum } from "@screenwright/types";

const isNil = (v: unknown): v is null | undefined => v === null || v === undefined;

/**
 * 检查字段类型的条件是否满足。纯函数。
 */
export const checkFieldCondition = (item: Condition, throwValue: Record<string, any>): boolean => {
  if (isNil(throwValue[item.field])) {
    console.error(`字段"${item.field}"不存在`);
    return false;
  }
  // 特殊比较运算符：包含（判断字段值转字符串后是否包含 expected）
  if (item.compare === "include") {
    if (typeof item.expected !== "string") {
      return false;
    }
    // const arr = item.expected.split(",").map((i: any) => Number(i));
    // if (!arr) {
    //   return false;
    // }
    if (throwValue[item.field]) {
      // return arr.includes(throwValue[item.field]);
      return throwValue[item.field].toString().includes(item.expected);
    }
    return false;
  }
  // 特殊比较运算符：不包含
  if (item.compare === "exclude") {
    if (typeof item.expected !== "string") {
      return false;
    }
    // const arr = item.expected.split(",").map((i: any) => i.toString());
    // if (!arr) {
    //   return false;
    // }
    if (throwValue[item.field]) {
      // return !arr.includes(throwValue[item.field]);
      return !throwValue[item.field].toString().includes(item.expected);
    }
    return false;
  }

  // 获取字段值，如果不存在则默认为 0
  const fieldValue = throwValue[item.field] ?? 0;
  // 准备期望值
  const expectedValue = isNaN(Number(item.expected))
    ? item.expected || "" // 字符串值
    : Number(item.expected || 0); // 数字值

  const expression = `"${fieldValue}" ${item.compare} "${expectedValue}"`;

  // 使用 Function 安全执行比较
  try {
    return new Function(`return ${expression}`)();
  } catch (e) {
    console.error("条件比较出错:", e);
    return false;
  }
};

/**
 * 检查代码类型的条件是否满足。纯函数。
 */
export const checkCodeCondition = (item: Condition, throwValue: Record<string, any>): boolean => {
  try {
    return new Function("data", `${item.code}`)(throwValue);
  } catch (e) {
    console.error("代码执行出错:", e);
    return false;
  }
};

/**
 * 检查单个条件是否满足。纯函数。
 */
export const checkCondition = (item: Condition, throwValue: Record<string, any>): boolean => {
  if (item.type == ConditionTypeEnum.Field) {
    return checkFieldCondition(item, throwValue);
  } else if (item.type == ConditionTypeEnum.Custom) {
    return checkCodeCondition(item, throwValue);
  }
  return false;
};

/**
 * 按 conditionType（all=与/否则=或）检查一组条件是否满足。纯函数。
 */
export const checkConditionSatisfied = ({
  conditionType,
  conditions,
  curInfo
}: {
  conditionType: string;
  conditions: Condition[];
  curInfo: Record<string, any>;
}): boolean => {
  if (!conditions.length) {
    return true;
  }

  if (conditionType === "all") {
    return conditions.every((item) => checkCondition(item, curInfo));
  }

  return conditions.some((item) => checkCondition(item, curInfo));
};
