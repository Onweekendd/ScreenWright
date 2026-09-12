import { type ComponentType, IndicatorEnum, MediaEnum, PanelEnum, TextEnum } from "@screenwright/types";
import { filter, forEach, map, reduce } from "lodash-es";

import { ExhibitEnumType } from "@/views/build/components/buildRender/type";

import { handleComponentData } from "./handleComponentData";
import { handleCustomCollapse } from "./strategies/customCollapseStrategies";
import { handleFtFlopStrategy } from "./strategies/ftFlopStrategies";
import { handleSwiper } from "./strategies/handleSwiperStrategies";
import { handleRichtextStrategy } from "./strategies/richtextStrategies";
import { handleSwiperCard } from "./strategies/swiperCardStrategies";
import type { dictListType, SpecialTranslateHandler, TranslateContext, TranslationItem } from "./type";

/** 不参默认批量翻译的 component.prop */
export const EXCLUDED_COMPONENT_PROPS = new Set<string | number>([
  PanelEnum.dynamicPanel,
  PanelEnum.encodePanel,
  PanelEnum.quotePanel,
  ExhibitEnumType.FtTranslation
]);

/** 挂接特殊翻译 */
export const SPECIAL_TRANSLATION_BY_PROP = new Map<string | number, SpecialTranslateHandler>([
  [MediaEnum.FtSwiperCard, handleSwiperCard],
  [MediaEnum.FtSwiper, handleSwiper],
  [MediaEnum.FtSwiperV3, handleSwiper],
  [TextEnum.CustomCollapse, handleCustomCollapse],
  [TextEnum.FtRichtext, handleRichtextStrategy],
  [IndicatorEnum.FtFlopPerformance, handleFtFlopStrategy]
]);

export const initTranslationData = (data: TranslationItem[], option: any) => {
  const { dictList } = option;
  const languages = map(dictList, (item: dictListType) => item.value);

  const result: any = {};

  // 为每个目标语言构建翻译映射
  forEach(languages, (targetLang: string) => {
    // 使用 reduce 构建翻译映射，避免嵌套循环
    result[targetLang] = reduce(
      data,
      (acc: Record<string, any>, translationItem: any) => {
        const targetText = translationItem[targetLang];

        if (targetText) {
          const sourceLanguages = filter(languages, (sourceLang: any) => sourceLang !== targetLang);

          forEach(sourceLanguages, (sourceLang: any) => {
            const sourceText = translationItem[sourceLang];
            if (sourceText) {
              acc[sourceText] = targetText;
            }
          });
        }

        return acc;
      },
      {}
    );
  });

  return result;
};
// 翻译入口 外部使用
export const handleTranslate = (componentMap: Map<string, ComponentType>, translationData: any, key: string) => {
  const ctx: TranslateContext = { translationData, key };

  const entries = Array.from(componentMap.entries()).map(([, comp]) => comp);
  // 过滤不需要处理的组件
  const toProcess = filter(entries, (comp) => !EXCLUDED_COMPONENT_PROPS.has(comp.component.prop));

  for (const comp of toProcess) {
    const prop = comp.component.prop;
    const special = SPECIAL_TRANSLATION_BY_PROP.get(prop);
    if (special) {
      special({
        com: comp,
        ...ctx
      });
      continue;
    }
    handleComponentData({
      com: comp,
      translationData,
      key
    });
  }
};
