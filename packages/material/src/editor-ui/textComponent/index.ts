import type { Component } from "vue";

import { TextEnum } from "@screenwright/types";

// ── Global ──
import customCollapseGlobal from "./textGlobal/customCollapseGlobal.vue";
import customTableListGlobal from "./textGlobal/customTableListGlobal.vue";
import ftProgressGlobal from "./textGlobal/ftProgressGlobal.vue";
import ftRichtextGlobal from "./textGlobal/ftRichtextGlobal.vue";
import ftScrollGlobal from "./textGlobal/ftScrollGlobal.vue";
import ftText2Global from "./textGlobal/ftText2Global.vue";
import ftTextWordCloudGlobal from "./textGlobal/ftTextWordCloudGlobal.vue";
import ftcollectionGlobal from "./textGlobal/ftcollectionGlobal.vue";
import ftdatetimeGlobal from "./textGlobal/ftdatetimeGlobal.vue";
import ftmultiLineGlobal from "./textGlobal/ftmultiLineGlobal.vue";
import fttextGlobal from "./textGlobal/fttextGlobal.vue";

// ── LoadingEffect ──
import ftRichtextLoadingEffect from "./textLoadingEffect/ftRichtextLoadingEffect.vue";
import ftText2LoadingEffect from "./textLoadingEffect/ftText2LoadingEffect.vue";
import fttextLoadingEffect from "./textLoadingEffect/fttextLoadingEffect.vue";

// ── DataList ──
import customCollapseDataList from "./textDataList/customCollapseDataList.vue";

// ── RowConfig ──
import customTableListRowConfig from "./textRowConfig/customTableListRowConfig.vue";
import ftProgressRowConfig from "./textRowConfig/ftProgressRowConfig.vue";
import ftScrollRowConfig from "./textRowConfig/ftScrollRowConfig.vue";

// ── ColumnConfig ──
import ftProgressColumnConfig from "./textColumnConfig/ftProgressColumnConfig.vue";
import ftScrollColumnConfig from "./textColumnConfig/ftScrollColumnConfig.vue";

// ── Item ──
import customTableListItem from "./textItem/customTableListItem.vue";

// ── CardSetting ──
import ftcollectionCardSetting from "./textCardSetting/ftcollectionCardSetting.vue";

// ── Title ──
import ftcollectionTitle from "./textTitle/ftcollectionTitle.vue";

// ── Series ──
import ftTextWordCloudSeries from "./textSeries/ftTextWordCloudSeries.vue";
import ftcollectionSeries from "./textSeries/ftcollectionSeries.vue";

// ── SpecifiedStyle ──
import ftText2SpecifiedStyle from "./textSpecifiedStyle/ftText2SpecifiedStyle.vue";

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
  [TextEnum.FtRichtext]: [
    { label: "全局", value: optionType.global, component: ftRichtextGlobal },
    { label: "入场效果", value: optionType.loadingEffect, component: ftRichtextLoadingEffect }
  ],
  [TextEnum.FtCollection]: [
    { label: "全局", value: optionType.global, component: ftcollectionGlobal },
    { label: "卡片设置", value: optionType.cardSetting, component: ftcollectionCardSetting },
    { label: "标题", value: optionType.title, component: ftcollectionTitle },
    { label: "系列", value: optionType.series, component: ftcollectionSeries }
  ],
  [TextEnum.CustomTableList]: [
    { label: "全局", value: optionType.global, component: customTableListGlobal },
    { label: "行配置", value: optionType.rowConfig, component: customTableListRowConfig },
    { label: "子项", value: optionType.item, component: customTableListItem }
  ],
  [TextEnum.FtTextWordCloud]: [
    { label: "全局", value: optionType.global, component: ftTextWordCloudGlobal },
    { label: "系列", value: optionType.series, component: ftTextWordCloudSeries }
  ],
  [TextEnum.FtMultiLine]: [
    { label: "全局", value: optionType.global, component: ftmultiLineGlobal }
  ],
  [TextEnum.FtText]: [
    { label: "全局", value: optionType.global, component: fttextGlobal },
    { label: "载入效果", value: optionType.loadingEffect, component: fttextLoadingEffect }
  ],
  [TextEnum.FtProgress]: [
    { label: "全局", value: optionType.global, component: ftProgressGlobal },
    { label: "行配置", value: optionType.rowConfig, component: ftProgressRowConfig },
    { label: "列配置", value: optionType.columnConfig, component: ftProgressColumnConfig }
  ],
  [TextEnum.FtDatetime]: [
    { label: "全局", value: optionType.global, component: ftdatetimeGlobal }
  ],
  [TextEnum.FtText2]: [
    { label: "全局", value: optionType.global, component: ftText2Global },
    { label: "载入效果", value: optionType.loadingEffect, component: ftText2LoadingEffect },
    { label: "指定样式", value: optionType.specifiedStyle, component: ftText2SpecifiedStyle }
  ],
  [TextEnum.FtScroll]: [
    { label: "全局", value: optionType.global, component: ftScrollGlobal },
    { label: "行配置", value: optionType.rowConfig, component: ftScrollRowConfig },
    { label: "列配置", value: optionType.columnConfig, component: ftScrollColumnConfig }
  ]
};
