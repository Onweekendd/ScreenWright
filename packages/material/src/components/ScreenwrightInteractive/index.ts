import { InteractiveEnum } from "@screenwright/types";
import type { Component } from "vue";

import customSelect from "./components/customSelect/index.vue";
import formCheckbox from "./components/formCheckbox/index.vue";
import formNavMenu from "./components/formNavMenu/index.vue";
import formSlider from "./components/formSlider/index.vue";
import formSwitch from "./components/formSwitch/index.vue";
import swCascader from "./components/swCascader/index.vue";
import swDateTimePicker from "./components/swDateTimePicker/index.vue";
import swLegend from "./components/swLegend/index.vue";
import swMutual from "./components/swmutual/index.vue";
import swPageQuery from "./components/swPageQuery/index.vue";
import swPageTurning from "./components/swPageTurning/index.vue";
import swSearch from "./components/swSearch/index.vue";
import swSingleSelectedLegend from "./components/swSingleSelectedLegend/index.vue";
import swTimerShaft from "./components/swTimerShasw/index.vue";
import swVoiceControl from "./components/swVoiceControl/index.vue";
import multiSubtabs from "./components/multiSubtabs/index.vue";
import pointTimeline from "./components/pointTimeline/index.vue";
import rollSubtabs from "./components/rollSubtabs/index.vue";
import scrollPicker from "./components/scrollPicker/index.vue";
import subtabs from "./components/subtabs/index.vue";
import videoProgress from "./components/videoProgress/index.vue";

export const ScreenwrightInteractiveMap: Record<InteractiveEnum, Component> = {
  [InteractiveEnum.SwVoiceControl]: swVoiceControl,
  [InteractiveEnum.FormCheckbox]: formCheckbox,
  [InteractiveEnum.FormNavMenu]: formNavMenu,
  [InteractiveEnum.ScrollPicker]: scrollPicker,
  [InteractiveEnum.PointTimeline]: pointTimeline,
  [InteractiveEnum.FormSwitch]: formSwitch,
  [InteractiveEnum.FormSlider]: formSlider,
  [InteractiveEnum.MultiSubtabs]: multiSubtabs,
  [InteractiveEnum.RollSubtabs]: rollSubtabs,
  [InteractiveEnum.SwCascader]: swCascader,
  [InteractiveEnum.SwSingleSelectedLegend]: swSingleSelectedLegend,
  [InteractiveEnum.SwDateTimePicker]: swDateTimePicker,
  [InteractiveEnum.SwCustomSelect]: customSelect,
  [InteractiveEnum.SwLegend]: swLegend,
  [InteractiveEnum.SwPageQuery]: swPageQuery,
  [InteractiveEnum.SwPageTurning]: swPageTurning,
  [InteractiveEnum.Subtabs]: subtabs,
  [InteractiveEnum.SwMutual]: swMutual,
  [InteractiveEnum.SwSearch]: swSearch,
  [InteractiveEnum.SwTimerShaft]: swTimerShaft,
  [InteractiveEnum.videoProgress]: videoProgress,
};
