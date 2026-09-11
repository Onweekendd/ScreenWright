import { cloneDeep, isBoolean, isDate, isEmpty, isArray, isNil, isNumber, isObject, isString } from "lodash-es";

/**
 * 校验值是否为「空」（null / undefined / 空串 / 空数组 / 空对象）。
 * 数字 0、false、Date、非空字符串/数组/对象视为非空。
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

/**
 * 处理系类 line bar 数据：提取 axisName 并对齐每个系列的取值。
 */
export const getEchartsAxisNameAndSeriesData = (optionData: any[]): { axisName: string[]; optionData: any[] } => {
  // 获取所有的 axisName
  let axisName: any[] = optionData.flatMap((item) => item.list.map((ele: any) => ele.name));
  axisName = [...new Set(axisName)];
  optionData = optionData.map((item) => {
    const seriesData: any[] = [];
    axisName.forEach((ele) => {
      let flag = 0;
      for (const { name, value } of item.list) {
        if (ele === name) {
          seriesData.push({
            seriesName: item.name,
            name: ele,
            value: value || 100
          });
          flag = 1;
          break;
        }
      }
      if (flag !== 1) {
        seriesData.push({
          seriesName: item.name,
          name: ele,
          value: 2000
        });
      }
    });
    return {
      name: item.name,
      list: seriesData
    };
  });
  return {
    axisName,
    optionData
  };
};

// 将数组根据字段拆分成二维数组
export const splitArray = (array: any[], field: any) => {
  if (array?.length < 1) {
    return [];
  }
  try {
    const newArr: any[] = [];
    array.map((mapItem) => {
      if (newArr.length == 0) {
        newArr.push({ name: mapItem[field], list: [mapItem] });
      } else {
        const res = newArr.some((item) => {
          //判断相同的部门，有就添加到当前项
          if (item.name === mapItem[field]) {
            item.list.push(mapItem);
            return true;
          }
        });
        if (!res) {
          //如果没找相同的部门添加一个新对象
          newArr.push({ name: mapItem[field], list: [mapItem] });
        }
      }
    });
    return newArr;
  } catch (error) {
    console.log("数组拆分失败:", error);
    return [];
  }
};

/**
 * 安全执行用户配置的函数字符串；解析失败时返回空函数。
 */
export const getFunction = (fun: any, def: any) => {
  if (!validateNull(fun)) {
    try {
      return eval(fun);
    } catch {
      return () => {};
    }
  }
  if (def) {
    return () => {};
  }
};
