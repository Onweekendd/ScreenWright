import type { Component } from "vue";

import { InteractiveEnum } from "@screenwright/types";

// ── Global ──
import formCheckboxGlobal from "./InteractiveGlobal/formCheckboxGlobal.vue";
import formNavMenuGlobal from "./InteractiveGlobal/formNavMenuGlobal.vue";
import formSliderGlobal from "./InteractiveGlobal/formSliderGlobal.vue";
import formSwitchGlobal from "./InteractiveGlobal/formSwitchGlobal.vue";
import ftCascaderGlobal from "./InteractiveGlobal/ftCascaderGlobal.vue";
import ftCustomSelectGlobal from "./InteractiveGlobal/ftCustomSelectGlobal.vue";
import ftDateTimePickerGlobal from "./InteractiveGlobal/ftDateTimePickerGlobal.vue";
import ftIntegrationMutualGlobal from "./InteractiveGlobal/ft-integration-mutualGlobal.vue";
import ftLegendGlobal from "./InteractiveGlobal/ftLegendGlobal.vue";
import ftMutualGlobal from "./InteractiveGlobal/ft-mutualGlobal.vue";
import ftPageQueryGlobal from "./InteractiveGlobal/ftPageQueryGlobal.vue";
import ftPageTurningGlobal from "./InteractiveGlobal/ftPageTurningGlobal.vue";
import ftSearchGlobal from "./InteractiveGlobal/ft-searchGlobal.vue";
import ftSingleSelectedLegendGlobal from "./InteractiveGlobal/ftSingleSelectedLegendGlobal.vue";
import ftTimerShaftGlobal from "./InteractiveGlobal/ftTimerShaftGlobal.vue";
import ftVoiceControlGlobal from "./InteractiveGlobal/ft-voice-controlGlobal.vue";
import multiSubtabsGlobal from "./InteractiveGlobal/multi-subtabsGlobal.vue";
import pointTimelineGlobal from "./InteractiveGlobal/pointTimelineGlobal.vue";
import rollSubtabsGlobal from "./InteractiveGlobal/roll-subtabsGlobal.vue";
import scrollPickerGlobal from "./InteractiveGlobal/scrollPickerGlobal.vue";
import subtabsGlobal from "./InteractiveGlobal/subtabsGlobal.vue";
import videoProgressGlobal from "./InteractiveGlobal/videoProgressGlobal.vue";

// ── Style ──
import ftCascaderStyle from "./InteractiveStyle/ftCascaderStyle.vue";
import ftCustomSelectStyle from "./InteractiveStyle/ftCustomSelectStyle.vue";
import ftIntegrationMutualStyle from "./InteractiveStyle/ft-integration-mutualStyle.vue";
import ftLegendStyle from "./InteractiveStyle/ftLegendStyle.vue";
import ftMutualStyle from "./InteractiveStyle/ft-mutualStyle.vue";
import ftPageQueryStyle from "./InteractiveStyle/ftPageQueryStyle.vue";
import ftPageTurningStyle from "./InteractiveStyle/ftPageTurningStyle.vue";
import ftSingleSelectedLegendStyle from "./InteractiveStyle/ftSingleSelectedLegendStyle.vue";
import ftTimerShaftStyle from "./InteractiveStyle/ftTimerShaftStyle.vue";
import multiSubtabsStyle from "./InteractiveStyle/multi-subtabsStyle.vue";
import rollSubtabsStyle from "./InteractiveStyle/roll-subtabsStyle.vue";
import scrollPickerStyle from "./InteractiveStyle/scrollPickerStyle.vue";
import subtabsStyle from "./InteractiveStyle/subtabsStyle.vue";

// ── Series ──
import multiSubtabsSeries from "./InteractiveSeries/multi-subtabsSeries.vue";
import rollSubtabsSeries from "./InteractiveSeries/roll-subtabsSeries.vue";
import subtabsSeries from "./InteractiveSeries/subtabsSeries.vue";

// ── Config ──
import formNavMenuConfig from "./InteractiveConfig/formNavMenuConfig.vue";

// ── Attrs ──
import formNavMenuAttrs from "./InteractiveAttrs/formNavMenuAttrs.vue";

// ── Event ──
import formSliderEvent from "./InteractiveEvent/formSliderEvent.vue";

// ── Chose ──
import ftDateTimePickerChose from "./InteractiveChose/ftDateTimePickerChose.vue";

// ── Date ──
import ftDateTimePickerDate from "./InteractiveDate/ftDateTimePickerDate.vue";

// ── SearchAttrs ──
import ftSearchSearchAttrs from "./InteractiveSearchAttrs/ft-searchSearchAttrs.vue";

// ── TimeLine ──
import pointTimelineTimeLine from "./InteractiveTimeLine/pointTimelineTimeLine.vue";

// ── Animation ──
import pointTimelineAnimation from "./InteractiveAnimation/pointTimelineAnimation.vue";

export enum optionType {
  global = "Global",
  style = "Style",
  series = "Series",
  config = "Config",
  attrs = "Attrs",
  event = "Event",
  chose = "Chose",
  date = "Date",
  searchAttrs = "SearchAttrs",
  timeLine = "TimeLine",
  animation = "Animation"
}

export type ConfigTab = {
  label: string;
  value: optionType;
  component: Component;
};

export const InteractiveConfigComponent: Record<InteractiveEnum, ConfigTab[]> = {
  [InteractiveEnum.FtVoiceControl]: [
    { label: "全局", value: optionType.global, component: ftVoiceControlGlobal }
  ],
  [InteractiveEnum.FormCheckbox]: [
    { label: "全局", value: optionType.global, component: formCheckboxGlobal }
  ],
  [InteractiveEnum.FormNavMenu]: [
    { label: "全局", value: optionType.global, component: formNavMenuGlobal },
    { label: "其它配置", value: optionType.config, component: formNavMenuConfig },
    { label: "选项", value: optionType.attrs, component: formNavMenuAttrs }
  ],
  [InteractiveEnum.ScrollPicker]: [
    { label: "全局", value: optionType.global, component: scrollPickerGlobal },
    { label: "样式", value: optionType.style, component: scrollPickerStyle }
  ],
  [InteractiveEnum.PointTimeline]: [
    { label: "全局", value: optionType.global, component: pointTimelineGlobal },
    { label: "时间轴", value: optionType.timeLine, component: pointTimelineTimeLine },
    { label: "动画", value: optionType.animation, component: pointTimelineAnimation }
  ],
  [InteractiveEnum.FormSwitch]: [
    { label: "全局", value: optionType.global, component: formSwitchGlobal }
  ],
  [InteractiveEnum.FormSlider]: [
    { label: "全局", value: optionType.global, component: formSliderGlobal },
    { label: "事件", value: optionType.event, component: formSliderEvent }
  ],
  [InteractiveEnum.MultiSubtabs]: [
    { label: "全局", value: optionType.global, component: multiSubtabsGlobal },
    { label: "样式", value: optionType.style, component: multiSubtabsStyle },
    { label: "系列", value: optionType.series, component: multiSubtabsSeries }
  ],
  [InteractiveEnum.RollSubtabs]: [
    { label: "全局", value: optionType.global, component: rollSubtabsGlobal },
    { label: "样式", value: optionType.style, component: rollSubtabsStyle },
    { label: "系列", value: optionType.series, component: rollSubtabsSeries }
  ],
  [InteractiveEnum.FtCascader]: [
    { label: "全局", value: optionType.global, component: ftCascaderGlobal },
    { label: "下拉框", value: optionType.style, component: ftCascaderStyle }
  ],
  [InteractiveEnum.FtSingleSelectedLegend]: [
    { label: "全局", value: optionType.global, component: ftSingleSelectedLegendGlobal },
    { label: "样式", value: optionType.style, component: ftSingleSelectedLegendStyle }
  ],
  [InteractiveEnum.FtDateTimePicker]: [
    { label: "全局", value: optionType.global, component: ftDateTimePickerGlobal },
    { label: "选择器", value: optionType.chose, component: ftDateTimePickerChose },
    { label: "日历框", value: optionType.date, component: ftDateTimePickerDate }
  ],
  [InteractiveEnum.FtCustomSelect]: [
    { label: "全局", value: optionType.global, component: ftCustomSelectGlobal },
    { label: "下拉框", value: optionType.style, component: ftCustomSelectStyle }
  ],
  [InteractiveEnum.FtLegend]: [
    { label: "全局", value: optionType.global, component: ftLegendGlobal },
    { label: "样式", value: optionType.style, component: ftLegendStyle }
  ],
  [InteractiveEnum.FtPageQuery]: [
    { label: "全局", value: optionType.global, component: ftPageQueryGlobal },
    { label: "样式", value: optionType.style, component: ftPageQueryStyle }
  ],
  [InteractiveEnum.FtPageTurning]: [
    { label: "全局", value: optionType.global, component: ftPageTurningGlobal },
    { label: "样式", value: optionType.style, component: ftPageTurningStyle }
  ],
  [InteractiveEnum.Subtabs]: [
    { label: "全局", value: optionType.global, component: subtabsGlobal },
    { label: "样式", value: optionType.style, component: subtabsStyle },
    { label: "系列", value: optionType.series, component: subtabsSeries }
  ],
  [InteractiveEnum.FtMutual]: [
    { label: "全局", value: optionType.global, component: ftMutualGlobal },
    { label: "样式", value: optionType.style, component: ftMutualStyle }
  ],
  [InteractiveEnum.FtIntegrationMutual]: [
    { label: "全局", value: optionType.global, component: ftIntegrationMutualGlobal },
    { label: "样式", value: optionType.style, component: ftIntegrationMutualStyle }
  ],
  [InteractiveEnum.FtSearch]: [
    { label: "全局", value: optionType.global, component: ftSearchGlobal },
    { label: "搜索框属性", value: optionType.searchAttrs, component: ftSearchSearchAttrs }
  ],
  [InteractiveEnum.FtTimerShaft]: [
    { label: "全局", value: optionType.global, component: ftTimerShaftGlobal },
    { label: "样式", value: optionType.style, component: ftTimerShaftStyle }
  ],
  [InteractiveEnum.videoProgress]: [
    { label: "全局", value: optionType.global, component: videoProgressGlobal }
  ]
};
