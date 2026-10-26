import { computed, type Ref } from "vue";

import type { UIMessage } from "ai";

export interface WelcomeExample {
  label: string;
  desc: string;
  prompt: string;
}

export interface WelcomeCapability {
  icon: string;
  title: string;
  desc: string;
}

export const WELCOME_CAPABILITIES: WelcomeCapability[] = [
  {
    icon: "✦",
    title: "生成概念图",
    desc: "先确定布局与风格"
  },
  {
    icon: "↗",
    title: "按图搭建",
    desc: "还原配色与内容层次"
  },
  {
    icon: "▦",
    title: "搭可编辑大屏",
    desc: "图表、文字随时改"
  }
];

const WELCOME_BUILD_WORKFLOW =
  "请先用 createImageTool 生成一张与当前画布尺寸一致的完整大屏概念图，明确标题、指标、图表、布局和配色。" +
  "等待并查看生成结果后，根据概念图完成大屏，背景与装饰按图拆解或用组件还原，文字、数字、图表必须是独立可编辑组件，使用示例数据并注明。" +
  "此次不进行素材搜索和视频生成；不要只贴一张整图，也不要在概念图生成后结束任务，继续搭建并截图对照，直到完成大屏。";

export const WELCOME_EXAMPLES: WelcomeExample[] = [
  {
    label: "新疆草原",
    desc: "做一块清新通透的新疆草原文旅大屏",
    prompt:
      "做一块新疆那拉提夏日文旅大屏，包含草原主题视觉、客流趋势、景点热度和天气卡片，整体清新通透。" +
      WELCOME_BUILD_WORKFLOW
  },
  {
    label: "上海夜游",
    desc: "做一块蓝金夜色的上海城市夜游大屏",
    prompt:
      "做一块上海城市夜游大屏，以外滩夜景和城市天际线为视觉主题，包含热门景点排行、夜间客流趋势和游客画像，整体呈现精致的蓝金夜色氛围。" +
      WELCOME_BUILD_WORKFLOW
  },
  {
    label: "海洋生态",
    desc: "做一块蓝绿通透的海洋生态展示屏",
    prompt:
      "做一块海洋生态展示大屏，以珊瑚和鱼群为视觉主题，包含物种数量、保护区分布和水质指标卡片，整体蓝绿通透、安静治愈。" +
      WELCOME_BUILD_WORKFLOW
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
