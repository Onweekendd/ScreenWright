import { computed, type Ref } from "vue";

import type { UIMessage } from "ai";

/** 示例的能力标签：欢迎页借它告诉用户「这条会用到什么」 */
export type WelcomeTag = "联网搜图" | "联网搜视频" | "生图" | "生视频";

export interface WelcomeExample {
  label: string;
  desc: string;
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
    icon: "↗",
    title: "找真实素材",
    desc: "联网搜图片、视频"
  },
  {
    icon: "✦",
    title: "生成新画面",
    desc: "生图、续写视频"
  },
  {
    icon: "▦",
    title: "搭可编辑大屏",
    desc: "图表、文字随时改"
  }
];

export const WELCOME_EXAMPLES: WelcomeExample[] = [
  {
    label: "新疆草原 · 文旅大屏",
    desc: "真实草原风光，接上一段 AI 续写的夏天。",
    tags: ["联网搜视频", "生视频"],
    prompt:
      "做一块新疆那拉提夏日文旅大屏。请使用 MCP 素材搜索工具联网寻找真实草原视频，背景视频共 15 秒，前 10 秒使用搜到的实拍，后 5 秒基于该视频生成自然衔接的新画面。叠加可编辑的客流趋势、景点热度和天气卡片，使用示例数据，整体清新通透。"
  },
  {
    label: "上海夜游 · 城市大屏",
    desc: "搜集外滩夜景，搭配统一风格的视觉素材。",
    tags: ["联网搜图", "生图"],
    prompt:
      "做一块上海城市夜游大屏。请使用 MCP 素材搜索工具联网寻找真实的外滩夜景和城市天际线图片，作为主视觉，并生成与实拍色调统一的卡片底板和装饰素材。包含可编辑的热门景点排行、夜间客流趋势和游客画像，使用示例数据，整体有精致的蓝金夜色氛围。"
  },
  {
    label: "海洋生态 · 动态展示屏",
    desc: "从真实珊瑚与鱼群出发，生成流动的海底。",
    tags: ["联网搜视频", "生视频"],
    prompt:
      "做一块海洋生态动态展示大屏。请使用 MCP 素材搜索工具联网寻找真实的珊瑚和鱼群视频，并基于找到的视频生成一段风格一致、适合循环播放的动态背景。叠加可编辑的物种数量、保护区分布和水质指标卡片，使用示例数据，整体蓝绿通透、安静治愈。"
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
