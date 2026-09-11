const isNumber = (v: unknown): v is number => typeof v === "number";
const isString = (v: unknown): v is string => typeof v === "string";

/**
 * 从组件标识中提取数字组件ID。
 * 支持：数字直接返回；普通字符串转数字；`$component(123)` 形式提取括号内数字。
 * 纯函数，框架无关。
 */
export const extractComponentId = (component: string | number): number => {
  // 如果是数字，直接返回
  if (isNumber(component)) {
    return component;
  }

  // 如果是字符串
  if (isString(component)) {
    // 如果不包含 $component，直接返回
    if (!component.includes("$component")) {
      return Number(component);
    }

    // 如果包含 $component，提取括号中的数字
    const match = component.match(/\$component\((\d+)\)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  // 其他情况，尝试转换为数字
  return Number(component);
};
