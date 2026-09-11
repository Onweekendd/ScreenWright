import { handleData } from "../handleComponentData";
import type { TranslationProps } from "../type";

export const handleFtFlopStrategy = (option: TranslationProps) => {
  const { com, translationData, key } = option;
  if (!com.option.prefixText || !com.option.suffixText) return;
  const translation = translationData[key] || null;
  if (!translation) return;
  const prefixTextAfter = handleData(com.option.prefixText, translation);
  const suffixTextAfter = handleData(com.option.suffixText, translation);

  com.option.prefixText = prefixTextAfter;
  com.option.suffixText = suffixTextAfter;
};
