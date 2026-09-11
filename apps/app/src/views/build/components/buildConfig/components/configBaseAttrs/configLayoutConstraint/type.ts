import { horizontalConstEnum, verticalConstEnum } from "@screenwright/types";

export const verticalOption = [
  {
    label: "顶部",
    value: verticalConstEnum.Top
  },
  {
    label: "底部",
    value: verticalConstEnum.Bottom
  },
  {
    label: "居中",
    value: verticalConstEnum.Center
  }
  //   {
  //     label: "顶部+底部",
  //     value: verticalConstEnum.TopAndBottom
  //   }
];

export const horizontalOption = [
  {
    label: "左侧",
    value: horizontalConstEnum.Left
  },
  {
    label: "右侧",
    value: horizontalConstEnum.Right
  },
  {
    label: "居中",
    value: horizontalConstEnum.Center
  }
  //   {
  //     label: "左侧+右侧",
  //     value: horizontalConstEnum.LeftAndRight
  //   }
];
