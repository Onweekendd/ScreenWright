import { cloneDeep } from "lodash-es";

import { handleData } from "../handleComponentData";
import type { TranslationProps } from "../type";
interface CardListItem {
  title: string;
  type: string;
  name: string;
  imageSize: string;
  value: string;
}

interface TranslateAfter {
  title: string;
  value?: string;
}
export const handleCustomCollapse = (option: TranslationProps) => {
  const { com, translationData, key } = option;
  const translateBefore = com.option.seriesTabsList.map((item: CardListItem) => {
    if (item.type == "text") {
      return {
        title: item.title,
        value: item.value
      };
    } else {
      return {
        title: item.title
      };
    }
  });
  if (!translateBefore) return;
  const translation = translationData[key] || null;
  if (!translation) return;
  const translateAfter = handleData(translateBefore, translation) as TranslateAfter[];
  const translateRes = com.option.seriesTabsList.map((item: CardListItem, index: number) => {
    return {
      ...item,
      title: translateAfter[index].title,
      value: translateAfter[index].value ? translateAfter[index].value : item.value
    };
  });
  com.option.seriesTabsList = cloneDeep(translateRes);
};
