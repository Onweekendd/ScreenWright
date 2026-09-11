/**
 * 选区相关纯函数（框架无关）。
 * 从 app 的 useEditStore 抽离，供 SelectionManager 调用；不依赖任何 UI 框架。
 */
import type { ComponentType } from "@screenwright/types";

/** 内联 isNil，避免引入 lodash。 */
const isNil = (v: unknown): v is null | undefined => v === null || v === undefined;

/**
 * 在组件树中按 id 递归查找目标组件。
 * @param componentList 组件树
 * @param id 目标组件 id（字符串）
 */
export function findTargetById(componentList: ComponentType[], id: string): ComponentType | null {
  const find = (list: ComponentType[]): ComponentType | null => {
    for (let i = 0; i < list.length; i++) {
      const element = list[i];
      if (`${element.id}` === id) {
        return element;
      }
      const children = element.children as ComponentType[] | undefined;
      if (children && children.length > 0) {
        const result = find(children);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };
  return find(componentList);
}

/**
 * 由选中 id 列表派生选中组件数据（经组件映射查表，过滤掉不存在的）。
 * @param selectId 选中 id 列表
 * @param allComponentMap 所有组件映射（由 ComponentManager 派生）
 */
export function deriveSelectTargetData(
  selectId: string[],
  allComponentMap: ReadonlyMap<string, ComponentType>
): ComponentType[] {
  return selectId.map((v) => allComponentMap.get(`${v}`) ?? null).filter((v) => !isNil(v)) as ComponentType[];
}

/**
 * 由选中组件派生其自身及子组件的 id 列表。
 * @param selectTargetData 选中组件数据
 */
export function deriveSelectTargetDataId(selectTargetData: ComponentType[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < selectTargetData.length; i++) {
    const v = selectTargetData[i];
    const children = v.children as ComponentType[] | undefined;
    const isGroup = children && children.length > 0;
    if (isGroup && children) {
      result.push(...children.map((c) => `${c.id}`));
    }
    result.push(`${v.id}`);
  }
  return result;
}

/**
 * 计算 setTargetSelectChart 后的新选中 id 列表（纯函数）。
 * 返回 null 表示“无需变更”（重复选中或无法识别的入参）。
 * @param current 当前选中 id 列表
 * @param selectId 入参（字符串 / 字符串数组 / 数字 / 空）
 * @param push 是否多选追加
 */
export function normalizeSelectChart(
  current: string[],
  selectId?: string | string[] | number,
  push = false
): string[] | null {
  // 重复选中
  if (current.find((e) => e === selectId)) {
    return null;
  }
  // 无 id 清空
  if (!selectId) {
    return [];
  }
  // 数字归一化为字符串
  const sel: string | string[] = typeof selectId === "number" ? `${selectId}` : selectId;
  if (push) {
    if (typeof sel === "string") {
      return [...current, sel];
    }
    if (Array.isArray(sel)) {
      return [...current, ...sel];
    }
  } else {
    if (typeof sel === "string") {
      return [sel];
    }
    if (Array.isArray(sel)) {
      return sel;
    }
  }
  return null;
}
