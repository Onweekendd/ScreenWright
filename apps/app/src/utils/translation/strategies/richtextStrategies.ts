import { handleRichTest } from "../handleComponentData";
import type { TranslationProps } from "../type";

export const handleRichtextStrategy = (option: TranslationProps) => {
  const { com, translationData, key } = option;
  const translation = translationData[key] || null;
  if (!translation) return;
  const richTest = handleRichTest(com.option.content, translation);
  console.log("handleRichtextStrategy", richTest);
  com.option.content = richTest;
};
