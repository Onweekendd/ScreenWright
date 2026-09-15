import { TextEnum } from "@screenwright/types";
import type { Component } from "vue";

import customCollapse from "./components/customCollapse/index.vue";
import customTableList from "./components/customTableList/index.vue";
import ftDatetime from "./components/datetime/index.vue";
import swCollection from "./components/swcollection/index.vue";
import swMultiLine from "./components/swMultiLine/index.vue";
import swProgress from "./components/swProgresstable/index.vue";
import swRichtext from "./components/swRichtext/index.vue";
import swStatusText from "./components/swStatusText/index.vue";
import swText from "./components/swText/index.vue";
import swTextWordCloud from "./components/swTextWordCloud/index.vue";
import ftScroll from "./components/scrollTable/index.vue";

export const ScreenwrightTextComponent: Record<TextEnum, Component> = {
  [TextEnum.CustomCollapse]: customCollapse,
  [TextEnum.CustomTableList]: customTableList,
  [TextEnum.SwCollection]: swCollection,
  [TextEnum.SwDatetime]: ftDatetime,
  [TextEnum.SwMultiLine]: swMultiLine,
  [TextEnum.SwProgress]: swProgress,
  [TextEnum.SwRichtext]: swRichtext,
  [TextEnum.SwScroll]: ftScroll,
  [TextEnum.SwText]: swText,
  [TextEnum.SwText2]: swStatusText,
  [TextEnum.SwTextWordCloud]: swTextWordCloud,
};
