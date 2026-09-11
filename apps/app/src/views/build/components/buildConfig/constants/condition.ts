export enum ConditionTypeEnum {
  Field = "field",
  Custom = "custom"
}
export type ConditionType = ConditionTypeEnum.Field | ConditionTypeEnum.Custom;

// 条件相关
export const conditionTypeOptions: { label: string; value: ConditionType }[] = [
  { label: "字段", value: ConditionTypeEnum.Field },
  { label: "自定义条件", value: ConditionTypeEnum.Custom }
];

export enum ConditionCompareEnum {
  Equal = "==",
  NotEqual = "!=",
  LessThan = "<",
  GreaterThan = ">",
  LessThanOrEqual = "<=",
  GreaterThanOrEqual = ">=",
  Include = "include",
  Exclude = "exclude"
}

export type ConditionCompareType =
  | ConditionCompareEnum.Equal
  | ConditionCompareEnum.NotEqual
  | ConditionCompareEnum.LessThan
  | ConditionCompareEnum.GreaterThan
  | ConditionCompareEnum.LessThanOrEqual
  | ConditionCompareEnum.GreaterThanOrEqual
  | ConditionCompareEnum.Include
  | ConditionCompareEnum.Exclude;

export const conditionCompareOptions: { label: string; value: ConditionCompareType }[] = [
  { label: "=", value: ConditionCompareEnum.Equal },
  { label: "!=", value: ConditionCompareEnum.NotEqual },
  { label: "<", value: ConditionCompareEnum.LessThan },
  { label: ">", value: ConditionCompareEnum.GreaterThan },
  { label: "<=", value: ConditionCompareEnum.LessThanOrEqual },
  { label: ">=", value: ConditionCompareEnum.GreaterThanOrEqual },
  { label: "包含", value: ConditionCompareEnum.Include },
  { label: "不包含", value: ConditionCompareEnum.Exclude }
];

export enum ConditionLogicTypeEnum {
  One = "one",
  And = "and",
  All = "all"
}
export type ConditionLogicType = ConditionLogicTypeEnum.One | ConditionLogicTypeEnum.And | ConditionLogicTypeEnum.All;

export const conditionLogicTypeOptions: { label: string; value: ConditionLogicType }[] = [
  { label: "任一满足", value: ConditionLogicTypeEnum.One },
  { label: "全部满足", value: ConditionLogicTypeEnum.And },
  { label: "所有", value: ConditionLogicTypeEnum.All }
];
