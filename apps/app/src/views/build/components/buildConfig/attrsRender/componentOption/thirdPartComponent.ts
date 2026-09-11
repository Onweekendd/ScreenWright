import { ThirdPartComponentType, ThirdPartEnumType } from "../../../buildRender/core/ThirdParty/type";
import type { SingleOption } from "./ComponentOptions";
import { ComponentOptions } from "./ComponentOptions";

export enum OptionTypes {
  global = "Global"
}

const defaultOpt = [{ label: "配置项", value: OptionTypes.global }];

class ThirdPartComponentOptions extends ComponentOptions<ThirdPartEnumType> {
  constructor() {
    const defaultOptions: Record<string, SingleOption[]> = {
      default: defaultOpt,
      [ThirdPartEnumType.VuePart]: defaultOpt,
      [ThirdPartEnumType.DataV]: defaultOpt,
      [ThirdPartEnumType.EchartCommon]: defaultOpt
    };
    const importPath = "thirdPartComponent/thirdPart";
    super(OptionTypes, defaultOptions, ThirdPartComponentType, importPath);
  }
}
export const thirdPartEnumComponentOptions = new ThirdPartComponentOptions().getComponentOptions();
