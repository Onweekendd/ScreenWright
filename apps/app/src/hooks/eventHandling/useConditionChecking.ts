import { checkCodeCondition, checkCondition, checkConditionSatisfied, checkFieldCondition } from "@screenwright/core";

/**
 * 条件检查 hook（适配层）。
 * 逻辑已迁移到 @screenwright/core 的 conditionChecking 纯函数；此处保持原 hook API 不变。
 */
export function useConditionChecking() {
  return {
    checkConditionSatisfied,
    checkCondition,
    checkFieldCondition,
    checkCodeCondition
  };
}
