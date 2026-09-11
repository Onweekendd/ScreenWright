import type { Action, Event, EventTypeEnum } from "@screenwright/types";
import { ActionTypeEnum } from "@screenwright/types";

import { checkConditionSatisfied } from "./conditionChecking";

/**
 * 过滤出"条件不满足时仍需执行"的 actions。纯函数。
 * 仅保留 显示/隐藏/显隐 且 customActionType 为 "component" 的动作。
 */
export const filterActionsOnConditionNotSatisfied = (actions: Action[], conditionSatisfied: boolean): Action[] => {
  if (conditionSatisfied) {
    return actions;
  }

  /** 条件不成立仍执行的动作 */
  const actionOnConditionNotSatisfied = [ActionTypeEnum.Show, ActionTypeEnum.Hide, ActionTypeEnum.ShowHide];
  /** 条件不成立仍执行的类型 */
  const actionTypeOnConditionNotSatisfied = ["component"];

  return actions.filter(
    (action) =>
      actionOnConditionNotSatisfied.includes(action.action) &&
      actionTypeOnConditionNotSatisfied.includes(action.customActionType as string)
  );
};

/**
 * 从事件列表中筛选出 trigger 与给定触发类型匹配的事件。纯函数。
 */
export const selectMatchingEvents = (events: Event[], triggerType: EventTypeEnum): Event[] => {
  return events.filter((event) => event.trigger === triggerType);
};

/** 单个匹配事件经策略求值后，待执行的动作批次。 */
export interface PlannedEventActions {
  /** 该事件实际需要执行的动作（已按策略过滤；可能为空数组） */
  actions: Action[];
  /** 条件是否满足（透传给动作执行方） */
  isConditionSatisfied: boolean;
}

/**
 * 规划事件触发后每个匹配事件需要执行的动作。纯函数 / 框架无关。
 *
 * 仅负责"决策"：匹配触发类型 → 求值条件 → 按 isExecuteOnlyConditionSatisfied 策略
 * 决定要执行的动作集合。不接触 DOM / 框架，实际执行由调用方完成。
 *
 * 返回结果与匹配事件一一对应（保留顺序），便于调用方在每个事件上附加副作用（如回调）。
 */
export const planEventActions = ({
  events,
  triggerType,
  curInfo,
  isExecuteOnlyConditionSatisfied
}: {
  events: Event[];
  triggerType: EventTypeEnum;
  curInfo: Record<string, any>;
  isExecuteOnlyConditionSatisfied: boolean;
}): PlannedEventActions[] => {
  return selectMatchingEvents(events, triggerType).map((event) => {
    const { actions, conditions, conditionType } = event;

    const isConditionSatisfied = !conditions.length
      ? true
      : checkConditionSatisfied({ conditionType, conditions, curInfo });

    if (isExecuteOnlyConditionSatisfied) {
      return {
        actions: isConditionSatisfied ? actions : [],
        isConditionSatisfied
      };
    }

    return {
      actions: filterActionsOnConditionNotSatisfied(actions, isConditionSatisfied),
      isConditionSatisfied
    };
  });
};
