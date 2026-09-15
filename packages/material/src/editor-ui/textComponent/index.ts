import type { Component } from "vue";

import { TextEnum } from "@screenwright/types";

// ── Global ──
import customCollapseGlobal from "./textGlobal/customCollapseGlobal.vue";
import customTableListGlobal from "./textGlobal/customTableListGlobal.vue";
import swProgressGlobal from "./textGlobal/swProgressGlobal.vue";
import swRichtextGlobal from "./textGlobal/swRichtextGlobal.vue";
import swScrollGlobal from "./textGlobal/swScrollGlobal.vue";
import swText2Global from "./textGlobal/swText2Global.vue";
import swTextWordCloudGlobal from "./textGlobal/swTextWordCloudGlobal.vue";
import swcollectionGlobal from "./textGlobal/swcollectionGlobal.vue";
import swdatetimeGlobal from "./textGlobal/swdatetimeGlobal.vue";
import swmultiLineGlobal from "./textGlobal/swmultiLineGlobal.vue";
import swtextGlobal from "./textGlobal/swtextGlobal.vue";

// ── LoadingEffect ──
import swRichtextLoadingEffect from "./textLoadingEffect/swRichtextLoadingEffect.vue";
import swText2LoadingEffect from "./textLoadingEffect/swText2LoadingEffect.vue";
import swtextLoadingEffect from "./textLoadingEffect/swtextLoadingEffect.vue";

// ── DataList ──
import customCollapseDataList from "./textDataList/customCollapseDataList.vue";

// ── RowConfig ──
import customTableListRowConfig from "./textRowConfig/customTableListRowConfig.vue";
import swProgressRowConfig from "./textRowConfig/swProgressRowConfig.vue";
import swScrollRowConfig from "./textRowConfig/swScrollRowConfig.vue";

// ── ColumnConfig ──
import swProgressColumnConfig from "./textColumnConfig/swProgressColumnConfig.vue";
import swScrollColumnConfig from "./textColumnConfig/swScrollColumnConfig.vue";

// ── Item ──
import customTableListItem from "./textItem/customTableListItem.vue";

// ── CardSetting ──
import swcollectionCardSetting from "./textCardSetting/swcollectionCardSetting.vue";

// ── Title ──
import swcollectionTitle from "./textTitle/swcollectionTitle.vue";

// ── Series ──
import swTextWordCloudSeries from "./textSeries/swTextWordCloudSeries.vue";
import swcollectionSeries from "./textSeries/swcollectionSeries.vue";

// ── SpecifiedStyle ──
import swText2SpecifiedStyle from "./textSpecifiedStyle/swText2SpecifiedStyle.vue";

export enum optionType {
  global = "Global",
  dataList = "DataList",
  rowConfig = "RowConfig",
  columnConfig = "ColumnConfig",
  loadingEffect = "LoadingEffect",
  title = "Title",
  series = "Series",
  cardSetting = "CardSetting",
  specifiedStyle = "SpecifiedStyle",
  item = "Item"
}

export type ConfigTab = {
  label: string;
  value: optionType;
  component: Component;
};

export const ScreenwrightTextConfigComponent: Record<TextEnum, ConfigTab[]> = {
  [TextEnum.CustomCollapse]: [
    { label: "全局", value: optionType.global, component: customCollapseGlobal },
    { label: "数据列表", value: optionType.dataList, component: customCollapseDataList }
  ],
  [TextEnum.SwRichtext]: [
    { label: "全局", value: optionType.global, component: swRichtextGlobal },
    { label: "入场效果", value: optionType.loadingEffect, component: swRichtextLoadingEffect }
  ],
  [TextEnum.SwCollection]: [
    { label: "全局", value: optionType.global, component: swcollectionGlobal },
    { label: "卡片设置", value: optionType.cardSetting, component: swcollectionCardSetting },
    { label: "标题", value: optionType.title, component: swcollectionTitle },
    { label: "系列", value: optionType.series, component: swcollectionSeries }
  ],
  [TextEnum.CustomTableList]: [
    { label: "全局", value: optionType.global, component: customTableListGlobal },
    { label: "行配置", value: optionType.rowConfig, component: customTableListRowConfig },
    { label: "子项", value: optionType.item, component: customTableListItem }
  ],
  [TextEnum.SwTextWordCloud]: [
    { label: "全局", value: optionType.global, component: swTextWordCloudGlobal },
    { label: "系列", value: optionType.series, component: swTextWordCloudSeries }
  ],
  [TextEnum.SwMultiLine]: [
    { label: "全局", value: optionType.global, component: swmultiLineGlobal }
  ],
  [TextEnum.SwText]: [
    { label: "全局", value: optionType.global, component: swtextGlobal },
    { label: "载入效果", value: optionType.loadingEffect, component: swtextLoadingEffect }
  ],
  [TextEnum.SwProgress]: [
    { label: "全局", value: optionType.global, component: swProgressGlobal },
    { label: "行配置", value: optionType.rowConfig, component: swProgressRowConfig },
    { label: "列配置", value: optionType.columnConfig, component: swProgressColumnConfig }
  ],
  [TextEnum.SwDatetime]: [
    { label: "全局", value: optionType.global, component: swdatetimeGlobal }
  ],
  [TextEnum.SwText2]: [
    { label: "全局", value: optionType.global, component: swText2Global },
    { label: "载入效果", value: optionType.loadingEffect, component: swText2LoadingEffect },
    { label: "指定样式", value: optionType.specifiedStyle, component: swText2SpecifiedStyle }
  ],
  [TextEnum.SwScroll]: [
    { label: "全局", value: optionType.global, component: swScrollGlobal },
    { label: "行配置", value: optionType.rowConfig, component: swScrollRowConfig },
    { label: "列配置", value: optionType.columnConfig, component: swScrollColumnConfig }
  ]
};
