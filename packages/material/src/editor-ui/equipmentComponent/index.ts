import type { Component } from "vue";

import { EquipmentEnum } from "@screenwright/types";

import iotGeneralEquipmentChange from "./equipmentChange/iotGeneralEquipmentChange.vue";
import iotMutualChange from "./equipmentChange/iotMutualChange.vue";
import iotFormSliderEvent from "./equipmentEvent/iotFormSliderEvent.vue";
import iotGeneralEquipmentGlobal from "./equipmentGlobal/iotGeneralEquipmentGlobal.vue";
import iotFormSliderGlobal from "./equipmentGlobal/iotFormSliderGlobal.vue";
import iotFormSwitchGlobal from "./equipmentGlobal/iotFormSwitchGlobal.vue";
import iotMutualGlobal from "./equipmentGlobal/iotMutualGlobal.vue";
import iotSubtabsGlobal from "./equipmentGlobal/iotSubtabsGlobal.vue";
import iotSubtabsSeries from "./equipmentSeries/iotSubtabsSeries.vue";
import iotSubtabsStyle from "./equipmentStyle/iotSubtabsStyle.vue";

export enum optionType {
  global = "Global",
  change = "Change",
  event = "Event",
  style = "Style",
  series = "Series"
}

export type ConfigTab = {
  label: string;
  value: optionType;
  component: Component;
  hidden?: boolean;
};

// 物联组件配置面板（静态组装，取代主包旧的 ComponentOptions glob + defineAsyncComponent）。
export const EquipmentConfigComponent: Record<EquipmentEnum, ConfigTab[]> = {
  [EquipmentEnum.IotGeneralEquipment]: [
    { label: "全局", value: optionType.global, component: iotGeneralEquipmentGlobal },
    { label: "变换", value: optionType.change, component: iotGeneralEquipmentChange }
  ],
  [EquipmentEnum.IotFormSlider]: [
    { label: "全局", value: optionType.global, component: iotFormSliderGlobal },
    { label: "事件", value: optionType.event, component: iotFormSliderEvent }
  ],
  [EquipmentEnum.IotFormSwitch]: [{ label: "全局", value: optionType.global, component: iotFormSwitchGlobal }],
  [EquipmentEnum.IotSubTabs]: [
    { label: "全局", value: optionType.global, component: iotSubtabsGlobal },
    { label: "样式", value: optionType.style, component: iotSubtabsStyle },
    { label: "系列", value: optionType.series, component: iotSubtabsSeries }
  ],
  [EquipmentEnum.IotMutual]: [
    { label: "全局", value: optionType.global, component: iotMutualGlobal },
    { label: "变换", value: optionType.change, component: iotMutualChange }
  ]
};
