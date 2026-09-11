import { handleData } from "../handleComponentData";
import type { TranslationProps } from "../type";
interface CardListItem {
  titleContent: string;
  textContent: string;
  tabsName: string;
  backgroundImg: string;
  activeObj: any;
  defaultObj: any;
}

interface TranslateAfter {
  titleContent: string;
  textContent: string;
  tabsName: string;
}

export const handleSwiperCard = (option: TranslationProps) => {
  const { com, translationData, key } = option;
  const translateBefore = com.option.cardList.map((item: CardListItem) => {
    return {
      tabsName: item.tabsName,
      titleContent: item.titleContent,
      textContent: item.textContent
    };
  });
  if (!translateBefore) return;
  const translation = translationData[key] || null;
  if (!translation) return;
  const translateAfter = handleData(translateBefore, translation) as TranslateAfter[];
  const translateRes = com.option.cardList.map((item: CardListItem, index: number) => {
    return {
      ...item,
      tabsName: translateAfter[index].tabsName,
      titleContent: translateAfter[index].titleContent,
      textContent: translateAfter[index].textContent
    };
  });
  com.option.cardList = translateRes;
};
