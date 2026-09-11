import type { ChildComponent, ComponentType } from "@screenwright/types";

/**
 * 根据组件的 dataRemark 映射数据（保留原有键值对，额外补充映射键）。
 * 纯函数，框架无关。
 *
 * @param component 组件对象
 * @param originalData 原始值
 * @returns 映射后的值
 */
export const mapValueWithDataRemark = (
  component: ComponentType | ChildComponent,
  originalData: Record<string, any>
): Record<string, any> => {
  const { dataRemark } = component;
  const mappedValue: Record<string, any> = { ...originalData };

  if (dataRemark && dataRemark.length) {
    dataRemark.forEach((remarkRule) => {
      const { key, map } = remarkRule;
      mappedValue[key] = originalData[map];
    });
  }

  return mappedValue;
};
