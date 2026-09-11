import { echartsTabEnum } from "@screenwright/types";

// echartsTabEnum 已下沉到 @screenwright/types，这里重新导出保持原有导入路径不变
export { echartsTabEnum };

export enum TabsEnum {
  PAGESETUP = "pagesetup",
  ANIMATION = "animation"
}

export enum GroupTabsEnum {
  INTERACTIVE = "interactive",
  STYLE = "style"
}
export enum GroupOptionsTabsEnum {
  three3D = "three3D",
  frostedGlass = "FrostedGlass" //毛玻璃
}

export enum updateDataEnum {
  COMPONENTS = "components",
  GROUP = "group"
}

export type updateDataType = "components" | "group";

export interface TabProps {
  key: TabsEnum | echartsTabEnum | GroupTabsEnum;
  title: string;
  en: string;
  icon: string;
}
