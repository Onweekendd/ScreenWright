import { isArray, isNumber, isObject } from "lodash-es";

import type { TranslationProps } from "./type";

export const handleComponentData = (option: TranslationProps) => {
  const { com, translationData, key } = option;

  const componentData = com.data;
  const translation = translationData[key] || null;
  if (!translation) return componentData;
  const data = handleData(componentData, translation);
  com.data = data;
};

// 字符串翻译
const translateString = (text: string, translation: any) => {
  // 预留翻译逻辑：后续可在这里接 translationData/key 或接口请求
  const res = translation[text] || text;
  return res;
};

// 数组对象处理
const handleAssignValue = (value: unknown, translation: any) => {
  // 预留处理规则：对象/数组/数字直接返回，不做处理
  if (isObject(value) || isArray(value) || isNumber(value)) {
    return value;
  }
  // 仅非对象/数组（字符串、number、boolean、null、undefined）才进入这里
  const res = translation[value as string] || value;
  return res;
};

// 数据处理入口
export const handleData = (data: unknown, translation: any) => {
  const seen = new WeakMap<object, unknown>();

  const walk = (value: unknown, path: string): unknown => {
    // 1) null/undefined
    if (value === null || value === undefined) {
      return value;
    }

    // 2) 字符串（可翻译）
    if (typeof value === "string") {
      return translateString(value, translation);
    }

    // 3) 其他基础类型
    if (!isObject(value)) {
      return value;
    }

    // 4) 循环引用保护（防止极端数据死递归）
    if (seen.has(value)) {
      return seen.get(value);
    }

    // 5) 数组
    if (isArray(value)) {
      const arr = value as unknown[];
      const clonedArr: unknown[] = [];
      seen.set(value, clonedArr);
      for (let i = 0; i < arr.length; i++) {
        const nextValue = walk(arr[i], `${path}[${i}]`);

        clonedArr[i] = handleAssignValue(nextValue, translation);
      }
      return clonedArr;
    }

    // 6) 对象（你当前业务数据仅对象/数组/基础类型）
    const sourceObj = value as Record<string, unknown>;

    const clonedObj: Record<string, unknown> = {};
    seen.set(value, clonedObj);
    Object.keys(sourceObj).forEach((key) => {
      const nextValue = walk(sourceObj[key], `${path}.${key}`);

      clonedObj[key] = handleAssignValue(nextValue, translation);
    });
    return clonedObj;
  };

  return walk(data, "root");
};

// 处理富文本内的文本进行翻译
export const handleRichTest = (richTest: string, translation: any) => {
  // 处理富文本 富文本格式如下注释 我只想替换除标签内的文字内容 忽略 标签样式内容等等
  // "<p><span style=\"font-size: 20px;\"><span style=\"font-family: 旁门正道标题体; letter-spacing: 2px; text-align: justify;\">Screenwright<span style=\"color: #b96ad9; font-family: DY追光体;\">Screenwright</span></span><span style=\"font-family: 旁门正道标题体; letter-spacing: 2px; text-align: justify;\">大屏应用编辑器是</span><span style=\"font-family: 旁门正道标题体; letter-spacing: 2px; text-align: justify;\">数字孪生<span style=\"color: #f1c40f;\"><strong>零代码</strong></span>平</span><span style=\"font-family: 旁门正道标题体; letter-spacing: 2px; text-align: justify;\">台</span><span style=\"font-family: 旁门正道标题体; letter-spacing: 2px; text-align: justify;\">的关键组成，助力用户轻松构建魅力大屏。用户可便捷地将</span><em><strong><span style=\"font-family: 旁门正道标题体; letter-spacing: 2px; text-align: justify; color: #843fa1;\">三维场景与图表、柱状图</span></strong></em><span style=\"font-family: 旁门正道标题体; letter-spacing: 2px; text-align: justify;\">等联动，创造信息丰富、引人入胜的大屏应用。通过简单的拖拉拽操作，用户能快速布置元素，实现</span><span style=\"font-family: 旁门正道标题体; letter-spacing: 2px; text-align: justify;\"><strong><span style=\"color: #3598db; font-family: 造字工房悦黑;\">动态、互动</span></strong>和多媒体内容的精彩展示，满足<strong><span style=\"color: #e67e23; font-family: 造字工房悦黑;\">个性化需求</span></strong>。</span></span></p>"
  if (!richTest) return richTest;

  // 仅匹配标签外文本：捕获前导 `>` 和后导 `<`，只替换中间文本
  return richTest.replace(/(^|>)([^<>]+?)(?=<|$)/g, (fullMatch, prefix: string, text: string) => {
    const trimmed = text.trim();
    // 纯空白文本不处理，避免影响原始排版
    if (!trimmed) return fullMatch;

    const startSpacesLength = text.length - text.trimStart().length;
    const endSpacesLength = text.length - text.trimEnd().length;
    const leading = text.slice(0, startSpacesLength);
    const trailing = text.slice(text.length - endSpacesLength);
    const translated = translateString(trimmed, translation);
    return `${prefix}${leading}${translated}${trailing}`;
  });
};
