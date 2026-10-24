import { computed, type Ref } from "vue";

import type { UIMessage } from "ai";

/** 示例的能力标签：欢迎页借它告诉用户「这条会用到什么」 */
export type WelcomeTag = "生图" | "生视频";

export interface WelcomeExample {
  label: string;
  prompt: string;
  tags: WelcomeTag[];
}

export interface WelcomeCapability {
  icon: string;
  title: string;
  desc: string;
}

export const WELCOME_CAPABILITIES: WelcomeCapability[] = [
  {
    icon: "🎨",
    title: "画效果图和素材",
    desc: "描述想要的风格，生成背景、卡片底板、插画和图标，自动收进素材库的「AI 生成」分组"
  },
  {
    icon: "🎬",
    title: "让画面动起来",
    desc: "把静态背景变成流动的光影、云海和粒子，做成循环播放的动态背景"
  },
  {
    icon: "🧩",
    title: "搭出可编辑的大屏",
    desc: "把效果图搭成真正的大屏，图表、文字、数据随时都能改"
  }
];

export const WELCOME_EXAMPLES: WelcomeExample[] = [
  {
    label: "生成一块夏至节气主题大屏",
    tags: ["生图"],
    prompt:
      "夏至节气主题大屏，清新柔和的中国风水墨插画风，青山、荷塘、石桥的全屏背景，书法标题，数据卡片用淡雅的卷轴云纹底板，包含气温趋势、节气民俗介绍、游客客流统计。背景和卡片底板请先生成效果图素材"
  },
  {
    label: "做一块会动的海洋生态展示屏",
    tags: ["生图", "生视频"],
    prompt:
      "海洋生态主题展示大屏，柔和的蓝绿渐变，全屏背景用生成的海面光影图，并把背景做成缓缓流动的循环动态视频，上面叠物种数量统计、保护区分布和水质指标数据卡片，整体清新治愈"
  },
  {
    label: "生成文旅景区客流大屏",
    tags: ["生图"],
    prompt:
      "文旅景区客流与口碑大屏，清新治愈的插画风，暖色调，圆润的卡片，包含客流趋势折线图、景点热度排行、游客满意度环形图，用于景区日常运营展示"
  }
];

export function useWelcomeScreen(messages: Ref<UIMessage[]>) {
  const isVisible = computed(() => messages.value.length === 0);

  return {
    isVisible,
    examples: WELCOME_EXAMPLES,
    capabilities: WELCOME_CAPABILITIES
  };
}
