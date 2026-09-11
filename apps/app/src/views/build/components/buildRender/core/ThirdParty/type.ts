import { ThirdPartEnum } from "@screenwright/types";

// 从 @screenwright/types 重新导出 ThirdPartEnum，保持本地命名
export { ThirdPartEnum as ThirdPartEnumType };

export const ThirdPartComponentType: ThirdPartEnum[] = [
  ThirdPartEnum.VuePart,
  ThirdPartEnum.DataV,
  ThirdPartEnum.EchartCommon
];
