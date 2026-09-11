import { computed } from "vue";

import type { UIMessage } from "ai";

export interface WelcomeExample {
  label: string;
  prompt: string;
}

export const WELCOME_STEPS = [
  "输入您的大屏制作需求；",
  "自动解析需求，并为您推荐 3 套适配模板；",
  "选择对应模板后，系统自动完成风格、布局、组件语义转化，生成初版大屏；",
  "大屏生成后，您可继续提出修改指令，对组件样式、模拟数据等进行二次编辑。"
];

export const WELCOME_EXAMPLES: WelcomeExample[] = [
  {
    label: "生成电力运维监控大屏",
    prompt:
      "电力运维监控大屏，深色科技风，左右双侧看板布局，包含电力负荷数据卡片、负荷趋势折线图、站点供电量柱状图、故障预警列表，用于日常运维监控"
  },
  {
    label: "生成水利防汛态势大屏",
    prompt:
      "水利防汛态势大屏，深色科技风格，左右分栏布局，包含雨情水位统计卡片、汛情趋势图表、站点流量对比图、预警处置列表，用于防汛态势感知与应急监测"
  },
  {
    label: "生成工业制造生产监控大屏",
    prompt:
      "工业制造生产监控大屏，深色工业科技风，左右双侧看板布局，包含产能指标卡片、生产良率趋势图、设备运行负载柱状图、设备故障告警列表，用于车间生产实时管控"
  }
];

export function useWelcomeScreen(messages: import("vue").Ref<UIMessage[]>) {
  const isVisible = computed(() => messages.value.length === 0);

  return {
    isVisible,
    examples: WELCOME_EXAMPLES,
    steps: WELCOME_STEPS
  };
}
