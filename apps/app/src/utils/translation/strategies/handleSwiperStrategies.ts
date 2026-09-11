import { handleData } from "../handleComponentData";
import type { TranslationProps } from "../type";

export const handleSwiper = (option: TranslationProps) => {
  const { com, translationData, key } = option;
  const translateBefore = com.option.imagesList.map((item: any) => {
    return {
      content: item.content
    };
  });
  if (!translateBefore) return;
  const translation = translationData[key] || null;
  if (!translation) return;
  const translateAfter = handleData(translateBefore, translation) as any[];
  const translateRes = com.option.imagesList.map((item: any, index: number) => {
    return {
      ...item,
      content: translateAfter[index].content
    };
  });

  com.option.imagesList = translateRes;
  // handleData
};
