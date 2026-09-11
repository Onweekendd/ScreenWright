import { InteractiveEnum } from "@screenwright/types";
import type { Component } from "vue";

import customSelect from "./components/customSelect/index.vue";
import formCheckbox from "./components/formCheckbox/index.vue";
import formNavMenu from "./components/formNavMenu/index.vue";
import formSlider from "./components/formSlider/index.vue";
import formSwitch from "./components/formSwitch/index.vue";
import ftCascader from "./components/ftCascader/index.vue";
import ftDateTimePicker from "./components/ftDateTimePicker/index.vue";
import ftIntegrationMutual from "./components/ftIntegrationMutual/index.vue";
import ftLegend from "./components/ftLegend/index.vue";
import ftMutual from "./components/ftmutual/index.vue";
import ftPageQuery from "./components/ftPageQuery/index.vue";
import ftPageTurning from "./components/ftPageTurning/index.vue";
import ftSearch from "./components/ftSearch/index.vue";
import ftSingleSelectedLegend from "./components/ftSingleSelectedLegend/index.vue";
import ftTimerShaft from "./components/ftTimerShaft/index.vue";
import ftVoiceControl from "./components/ftVoiceControl/index.vue";
import multiSubtabs from "./components/multiSubtabs/index.vue";
import pointTimeline from "./components/pointTimeline/index.vue";
import rollSubtabs from "./components/rollSubtabs/index.vue";
import scrollPicker from "./components/scrollPicker/index.vue";
import subtabs from "./components/subtabs/index.vue";
import videoProgress from "./components/videoProgress/index.vue";

export const ScreenwrightInteractiveMap: Record<InteractiveEnum, Component> = {
  [InteractiveEnum.FtVoiceControl]: ftVoiceControl,
  [InteractiveEnum.FormCheckbox]: formCheckbox,
  [InteractiveEnum.FormNavMenu]: formNavMenu,
  [InteractiveEnum.ScrollPicker]: scrollPicker,
  [InteractiveEnum.PointTimeline]: pointTimeline,
  [InteractiveEnum.FormSwitch]: formSwitch,
  [InteractiveEnum.FormSlider]: formSlider,
  [InteractiveEnum.MultiSubtabs]: multiSubtabs,
  [InteractiveEnum.RollSubtabs]: rollSubtabs,
  [InteractiveEnum.FtCascader]: ftCascader,
  [InteractiveEnum.FtSingleSelectedLegend]: ftSingleSelectedLegend,
  [InteractiveEnum.FtDateTimePicker]: ftDateTimePicker,
  [InteractiveEnum.FtCustomSelect]: customSelect,
  [InteractiveEnum.FtLegend]: ftLegend,
  [InteractiveEnum.FtPageQuery]: ftPageQuery,
  [InteractiveEnum.FtPageTurning]: ftPageTurning,
  [InteractiveEnum.Subtabs]: subtabs,
  [InteractiveEnum.FtMutual]: ftMutual,
  [InteractiveEnum.FtIntegrationMutual]: ftIntegrationMutual,
  [InteractiveEnum.FtSearch]: ftSearch,
  [InteractiveEnum.FtTimerShaft]: ftTimerShaft,
  [InteractiveEnum.videoProgress]: videoProgress,
};
