import { InteractiveEnum } from "@screenwright/types";
import type { Component } from "vue";

// ── Animation ──
import pointTimelineAnimation from "./InteractiveAnimation/pointTimelineAnimation.vue";
// ── Attrs ──
import formNavMenuAttrs from "./InteractiveAttrs/formNavMenuAttrs.vue";
// ── Chose ──
import swDateTimePickerChose from "./InteractiveChose/swDateTimePickerChose.vue";
// ── Config ──
import formNavMenuConfig from "./InteractiveConfig/formNavMenuConfig.vue";
// ── Date ──
import swDateTimePickerDate from "./InteractiveDate/swDateTimePickerDate.vue";
// ── Event ──
import formSliderEvent from "./InteractiveEvent/formSliderEvent.vue";
// ── Global ──
import formCheckboxGlobal from "./InteractiveGlobal/formCheckboxGlobal.vue";
import formNavMenuGlobal from "./InteractiveGlobal/formNavMenuGlobal.vue";
import formSliderGlobal from "./InteractiveGlobal/formSliderGlobal.vue";
import formSwitchGlobal from "./InteractiveGlobal/formSwitchGlobal.vue";
import multiSubtabsGlobal from "./InteractiveGlobal/multi-subtabsGlobal.vue";
import pointTimelineGlobal from "./InteractiveGlobal/pointTimelineGlobal.vue";
import rollSubtabsGlobal from "./InteractiveGlobal/roll-subtabsGlobal.vue";
import scrollPickerGlobal from "./InteractiveGlobal/scrollPickerGlobal.vue";
import subtabsGlobal from "./InteractiveGlobal/subtabsGlobal.vue";
import swMutualGlobal from "./InteractiveGlobal/sw-mutualGlobal.vue";
import swSearchGlobal from "./InteractiveGlobal/sw-searchGlobal.vue";
import swVoiceControlGlobal from "./InteractiveGlobal/sw-voice-controlGlobal.vue";
import swCascaderGlobal from "./InteractiveGlobal/swCascaderGlobal.vue";
import swCustomSelectGlobal from "./InteractiveGlobal/swCustomSelectGlobal.vue";
import swDateTimePickerGlobal from "./InteractiveGlobal/swDateTimePickerGlobal.vue";
import swLegendGlobal from "./InteractiveGlobal/swLegendGlobal.vue";
import swPageQueryGlobal from "./InteractiveGlobal/swPageQueryGlobal.vue";
import swPageTurningGlobal from "./InteractiveGlobal/swPageTurningGlobal.vue";
import swSingleSelectedLegendGlobal from "./InteractiveGlobal/swSingleSelectedLegendGlobal.vue";
import swTimerShaftGlobal from "./InteractiveGlobal/swTimerShaswGlobal.vue";
import videoProgressGlobal from "./InteractiveGlobal/videoProgressGlobal.vue";
// ── SearchAttrs ──
import swSearchSearchAttrs from "./InteractiveSearchAttrs/sw-searchSearchAttrs.vue";
// ── Series ──
import multiSubtabsSeries from "./InteractiveSeries/multi-subtabsSeries.vue";
import rollSubtabsSeries from "./InteractiveSeries/roll-subtabsSeries.vue";
import subtabsSeries from "./InteractiveSeries/subtabsSeries.vue";
import multiSubtabsStyle from "./InteractiveStyle/multi-subtabsStyle.vue";
import rollSubtabsStyle from "./InteractiveStyle/roll-subtabsStyle.vue";
import scrollPickerStyle from "./InteractiveStyle/scrollPickerStyle.vue";
import subtabsStyle from "./InteractiveStyle/subtabsStyle.vue";
import swMutualStyle from "./InteractiveStyle/sw-mutualStyle.vue";
// ── Style ──
import swCascaderStyle from "./InteractiveStyle/swCascaderStyle.vue";
import swCustomSelectStyle from "./InteractiveStyle/swCustomSelectStyle.vue";
import swLegendStyle from "./InteractiveStyle/swLegendStyle.vue";
import swPageQueryStyle from "./InteractiveStyle/swPageQueryStyle.vue";
import swPageTurningStyle from "./InteractiveStyle/swPageTurningStyle.vue";
import swSingleSelectedLegendStyle from "./InteractiveStyle/swSingleSelectedLegendStyle.vue";
import swTimerShaftStyle from "./InteractiveStyle/swTimerShaswStyle.vue";
// ── TimeLine ──
import pointTimelineTimeLine from "./InteractiveTimeLine/pointTimelineTimeLine.vue";

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
  animation = "Animation",
}

export interface ConfigTab {
  label: string;
  value: optionType;
  component: Component;
}

export const InteractiveConfigComponent: Record<InteractiveEnum, ConfigTab[]> =
  {
    [InteractiveEnum.SwVoiceControl]: [
      {
        label: "全局",
        value: optionType.global,
        component: swVoiceControlGlobal,
      },
    ],
    [InteractiveEnum.FormCheckbox]: [
      {
        label: "全局",
        value: optionType.global,
        component: formCheckboxGlobal,
      },
    ],
    [InteractiveEnum.FormNavMenu]: [
      { label: "全局", value: optionType.global, component: formNavMenuGlobal },
      {
        label: "其它配置",
        value: optionType.config,
        component: formNavMenuConfig,
      },
      { label: "选项", value: optionType.attrs, component: formNavMenuAttrs },
    ],
    [InteractiveEnum.ScrollPicker]: [
      {
        label: "全局",
        value: optionType.global,
        component: scrollPickerGlobal,
      },
      { label: "样式", value: optionType.style, component: scrollPickerStyle },
    ],
    [InteractiveEnum.PointTimeline]: [
      {
        label: "全局",
        value: optionType.global,
        component: pointTimelineGlobal,
      },
      {
        label: "时间轴",
        value: optionType.timeLine,
        component: pointTimelineTimeLine,
      },
      {
        label: "动画",
        value: optionType.animation,
        component: pointTimelineAnimation,
      },
    ],
    [InteractiveEnum.FormSwitch]: [
      { label: "全局", value: optionType.global, component: formSwitchGlobal },
    ],
    [InteractiveEnum.FormSlider]: [
      { label: "全局", value: optionType.global, component: formSliderGlobal },
      { label: "事件", value: optionType.event, component: formSliderEvent },
    ],
    [InteractiveEnum.MultiSubtabs]: [
      {
        label: "全局",
        value: optionType.global,
        component: multiSubtabsGlobal,
      },
      { label: "样式", value: optionType.style, component: multiSubtabsStyle },
      {
        label: "系列",
        value: optionType.series,
        component: multiSubtabsSeries,
      },
    ],
    [InteractiveEnum.RollSubtabs]: [
      { label: "全局", value: optionType.global, component: rollSubtabsGlobal },
      { label: "样式", value: optionType.style, component: rollSubtabsStyle },
      { label: "系列", value: optionType.series, component: rollSubtabsSeries },
    ],
    [InteractiveEnum.SwCascader]: [
      { label: "全局", value: optionType.global, component: swCascaderGlobal },
      { label: "下拉框", value: optionType.style, component: swCascaderStyle },
    ],
    [InteractiveEnum.SwSingleSelectedLegend]: [
      {
        label: "全局",
        value: optionType.global,
        component: swSingleSelectedLegendGlobal,
      },
      {
        label: "样式",
        value: optionType.style,
        component: swSingleSelectedLegendStyle,
      },
    ],
    [InteractiveEnum.SwDateTimePicker]: [
      {
        label: "全局",
        value: optionType.global,
        component: swDateTimePickerGlobal,
      },
      {
        label: "选择器",
        value: optionType.chose,
        component: swDateTimePickerChose,
      },
      {
        label: "日历框",
        value: optionType.date,
        component: swDateTimePickerDate,
      },
    ],
    [InteractiveEnum.SwCustomSelect]: [
      {
        label: "全局",
        value: optionType.global,
        component: swCustomSelectGlobal,
      },
      {
        label: "下拉框",
        value: optionType.style,
        component: swCustomSelectStyle,
      },
    ],
    [InteractiveEnum.SwLegend]: [
      { label: "全局", value: optionType.global, component: swLegendGlobal },
      { label: "样式", value: optionType.style, component: swLegendStyle },
    ],
    [InteractiveEnum.SwPageQuery]: [
      { label: "全局", value: optionType.global, component: swPageQueryGlobal },
      { label: "样式", value: optionType.style, component: swPageQueryStyle },
    ],
    [InteractiveEnum.SwPageTurning]: [
      {
        label: "全局",
        value: optionType.global,
        component: swPageTurningGlobal,
      },
      { label: "样式", value: optionType.style, component: swPageTurningStyle },
    ],
    [InteractiveEnum.Subtabs]: [
      { label: "全局", value: optionType.global, component: subtabsGlobal },
      { label: "样式", value: optionType.style, component: subtabsStyle },
      { label: "系列", value: optionType.series, component: subtabsSeries },
    ],
    [InteractiveEnum.SwMutual]: [
      { label: "全局", value: optionType.global, component: swMutualGlobal },
      { label: "样式", value: optionType.style, component: swMutualStyle },
    ],
    [InteractiveEnum.SwSearch]: [
      { label: "全局", value: optionType.global, component: swSearchGlobal },
      {
        label: "搜索框属性",
        value: optionType.searchAttrs,
        component: swSearchSearchAttrs,
      },
    ],
    [InteractiveEnum.SwTimerShaft]: [
      {
        label: "全局",
        value: optionType.global,
        component: swTimerShaftGlobal,
      },
      { label: "样式", value: optionType.style, component: swTimerShaftStyle },
    ],
    [InteractiveEnum.videoProgress]: [
      {
        label: "全局",
        value: optionType.global,
        component: videoProgressGlobal,
      },
    ],
  };
