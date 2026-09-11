import { type ComponentType } from "@screenwright/types";

export interface dictListType {
  id: string;
  name: string;
  value: string;
  alias: string;
}

export type TranslationItem = Record<string, string>;

export interface TranslateContext {
  translationData: any;
  key: string;
}
export interface TranslationProps {
  com: ComponentType;
  translationData: any;
  key: string;
}

/** 需要单独翻译逻辑，在这里注册*/
export type SpecialTranslateHandler = (option: TranslationProps) => void;
