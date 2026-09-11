import { FolderEnum, InteractiveEnum, mediaEnum, PanelEnum, textEnum } from "@screenwright/types";

import { FtImgStrategy } from "./FtImgStrategy";
import { FtPanelStrategy } from "./FtPanelStrategy";
import { FtRichtextStrategy } from "./FtRichtextStrategy";
import { FtSubtabStrategy } from "./FtSubtabStrategy";
import { GroupStrategy } from "./GroupStrategy";
import type { ConvertStrategy } from "./types";

/**
 * 转换策略注册表
 *
 * key 为 targetType，value 为对应的策略实例。
 * 添加新组件类型时，只需在此注册一行，无需修改任何其他代码。
 */
const strategyRegistry: Record<string, ConvertStrategy> = {
  [textEnum.FtRichtext]: new FtRichtextStrategy(),
  [mediaEnum.FtImg]: new FtImgStrategy(),
  [FolderEnum.group]: new GroupStrategy(),
  [PanelEnum.dynamicPanel]: new FtPanelStrategy(),
  [InteractiveEnum.Subtabs]: new FtSubtabStrategy()
};

/**
 * 转换策略工厂
 *
 * 根据 targetType 返回对应的策略实例。
 * 返回 null 表示该类型不需要转换（如 merge）或类型未知。
 */
export class ConversionStrategyFactory {
  static create(targetType: string): ConvertStrategy | null {
    return strategyRegistry[targetType] ?? null;
  }
}
