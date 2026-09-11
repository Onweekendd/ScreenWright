import { defineAsyncComponent, shallowRef } from "vue";

export const useInteractiveComponent = () => {
  const componentList = shallowRef([
    {
      name: "sw-voice-control",
      component: defineAsyncComponent(() => import("./components/ftVoiceControl/index.vue"))
    },
    {
      name: "formCheckbox",
      component: defineAsyncComponent(() => import("./components/formCheckbox/index.vue"))
    },
    {
      name: "formNavMenu",
      component: defineAsyncComponent(() => import("./components/formNavMenu/index.vue"))
    },
    {
      name: "scrollPicker",
      component: defineAsyncComponent(() => import("./components/scrollPicker/index.vue"))
    },
    {
      name: "pointTimeline",
      component: defineAsyncComponent(() => import("./components/pointTimeline/index.vue"))
    },
    {
      name: "formSwitch",
      component: defineAsyncComponent(() => import("./components/formSwitch/index.vue"))
    },
    {
      name: "formSlider",
      component: defineAsyncComponent(() => import("./components/formSlider/index.vue"))
    },
    {
      name: "multi-subtabs",
      component: defineAsyncComponent(() => import("./components/multiSubtabs/index.vue"))
    },
    {
      name: "roll-subtabs",
      component: defineAsyncComponent(() => import("./components/rollSubtabs/index.vue"))
    },
    {
      name: "swCascader",
      component: defineAsyncComponent(() => import("./components/ftCascader/index.vue"))
    },
    {
      name: "swSingleSelectedLegend",
      component: defineAsyncComponent(() => import("./components/ftSingleSelectedLegend/index.vue"))
    },
    {
      name: "swDateTimePicker",
      component: defineAsyncComponent(() => import("./components/ftDateTimePicker/index.vue"))
    },
    {
      name: "swCustomSelect",
      component: defineAsyncComponent(() => import("./components/customSelect/index.vue"))
    },
    {
      name: "swLegend",
      component: defineAsyncComponent(() => import("./components/ftLegend/index.vue"))
    },
    {
      name: "swPageQuery",
      component: defineAsyncComponent(() => import("./components/ftPageQuery/index.vue"))
    },
    {
      name: "swPageTurning",
      component: defineAsyncComponent(() => import("./components/ftPageTurning/index.vue"))
    },
    {
      name: "subtabs",
      component: defineAsyncComponent(() => import("./components/subtabs/index.vue"))
    },
    {
      name: "sw-mutual",
      component: defineAsyncComponent(() => import("./components/ftmutual/index.vue"))
    },
    {
      name: "sw-search",
      component: defineAsyncComponent(() => import("./components/ftSearch/index.vue"))
    },
    {
      name: "swTimerShaft",
      component: defineAsyncComponent(() => import("./components/ftTimerShaft/index.vue"))
    }
  ]);

  return {
    componentList
  };
};
