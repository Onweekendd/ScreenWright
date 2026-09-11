import { EquipmentEnum } from "@screenwright/types";
import type { Component } from "vue";

import iotFormSlider from "./iotFormSlider/index.vue";
import iotFormSwitch from "./iotFormSwitch/index.vue";
import iotGeneralEquipment from "./iotGeneralEquipment/index.vue";
import iotMutual from "./iotMutual/index.vue";
import iotSubTabs from "./iotSubtabs/index.vue";

export const ScreenwrightEquipmentComponentMap: Record<EquipmentEnum, Component> = {
  [EquipmentEnum.IotGeneralEquipment]: iotGeneralEquipment,
  [EquipmentEnum.IotFormSlider]: iotFormSlider,
  [EquipmentEnum.IotFormSwitch]: iotFormSwitch,
  [EquipmentEnum.IotSubTabs]: iotSubTabs,
  [EquipmentEnum.IotMutual]: iotMutual,
};
