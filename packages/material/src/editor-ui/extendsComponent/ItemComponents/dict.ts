import { PageReloadTypeEnum } from "./enum";
import type { dictBoolean, dictNumber, dictString } from "./type";

export const pageReloadType: dictString[] = [
  { label: "点击刷新", value: PageReloadTypeEnum.Click },
  { label: "计时刷新", value: PageReloadTypeEnum.KeepTime },
  { label: "定时刷新", value: PageReloadTypeEnum.SetTime },
  { label: "无操作自动刷新", value: PageReloadTypeEnum.AutoUpdate }
];

export const pageReloadTypeClickType: dictBoolean[] = [
  { label: "开启", value: "0" },
  { label: "关闭", value: "1" }
];

export const dropDownPosition: dictString[] = [
  { label: "向上", value: "top" },
  { label: "向下", value: "bottom" }
];

export const weatherType: dictString[] = [
  { label: "实时", value: "base" },
  { label: "全天", value: "all" }
];

export const orientList: dictString[] = [
  { label: "竖排", value: "vertical" },
  { label: "横排", value: "horizontal" }
];

export const markPosition: dictNumber[] = [
  { label: "上", value: 180 },
  { label: "下", value: 360 },
  { label: "左", value: 90 },
  { label: "右", value: 270 }
];

export const markType: dictString[] = [
  { label: "线性渐变", value: "linearGradient" },
  { label: "放射性渐变", value: "radioactiveGradation" }
];
