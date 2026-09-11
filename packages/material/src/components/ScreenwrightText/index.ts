import { TextEnum } from "@screenwright/types";
import type { Component } from "vue";

import customCollapse from "./components/customCollapse/index.vue";
import customTableList from "./components/customTableList/index.vue";
import ftDatetime from "./components/datetime/index.vue";
import ftCollection from "./components/ftcollection/index.vue";
import ftMultiLine from "./components/ftMultiLine/index.vue";
import ftProgress from "./components/ftProgresstable/index.vue";
import ftRichtext from "./components/ftRichtext/index.vue";
import ftStatusText from "./components/ftStatusText/index.vue";
import ftText from "./components/ftText/index.vue";
import ftTextWordCloud from "./components/ftTextWordCloud/index.vue";
import ftScroll from "./components/scrollTable/index.vue";

export const ScreenwrightTextComponent: Record<TextEnum, Component> = {
  [TextEnum.CustomCollapse]: customCollapse,
  [TextEnum.CustomTableList]: customTableList,
  [TextEnum.FtCollection]: ftCollection,
  [TextEnum.FtDatetime]: ftDatetime,
  [TextEnum.FtMultiLine]: ftMultiLine,
  [TextEnum.FtProgress]: ftProgress,
  [TextEnum.FtRichtext]: ftRichtext,
  [TextEnum.FtScroll]: ftScroll,
  [TextEnum.FtText]: ftText,
  [TextEnum.FtText2]: ftStatusText,
  [TextEnum.FtTextWordCloud]: ftTextWordCloud,
};
