import { describe, expect, it } from "vitest";

import { ref } from "vue";
import { mount } from "@vue/test-utils";

import type { UIMessage } from "ai";

import WelcomeScreen from "@/views/build/components/agentBI/components/WelcomeScreen.vue";
import {
  useWelcomeScreen,
  WELCOME_CAPABILITIES,
  WELCOME_EXAMPLES
} from "@/views/build/components/agentBI/hooks/useWelcomeScreen";

describe("欢迎页内容", () => {
  it("三项能力都有图标、标题和说明", () => {
    expect(WELCOME_CAPABILITIES).toHaveLength(3);
    for (const item of WELCOME_CAPABILITIES) {
      expect(item.icon).not.toBe("");
      expect(item.title).not.toBe("");
      expect(item.desc).not.toBe("");
    }
  });

  it("展示联网素材结合生图、生视频的能力", () => {
    const tags = WELCOME_EXAMPLES.map((example) => example.tags);

    expect(tags.some((t) => t.includes("生图"))).toBe(true);
    expect(tags.some((t) => t.includes("生视频"))).toBe(true);
    expect(tags.some((t) => t.includes("联网搜图"))).toBe(true);
    expect(tags.some((t) => t.includes("联网搜视频"))).toBe(true);
  });

  it("带「生视频」标签的示例，提示词里真的提到了动态视频，点下去 agent 才会去生成", () => {
    for (const example of WELCOME_EXAMPLES.filter((e) => e.tags.includes("生视频"))) {
      expect(example.prompt).toMatch(/视频/);
    }
  });

  it("每个示例都要求使用 MCP 搜索真实素材，并把素材用于可编辑大屏", () => {
    for (const example of WELCOME_EXAMPLES) {
      expect(example.label).not.toBe("");
      expect(example.desc).not.toBe("");
      expect(example.prompt).toMatch(/MCP.*素材搜索工具/);
      expect(example.prompt).toContain("可编辑");
      expect(example.tags.some((tag) => tag.startsWith("联网"))).toBe(true);
      if (example.tags.includes("联网搜图")) {
        expect(example.prompt).toContain("图片");
      }
      if (example.tags.includes("联网搜视频")) {
        expect(example.prompt).toContain("视频");
      }
    }
  });

  it("点击每张卡片发送完整的 MCP 任务需求，保留时长和素材使用要求", async () => {
    const wrapper = mount(WelcomeScreen, {
      props: { isVisible: true, examples: WELCOME_EXAMPLES, capabilities: WELCOME_CAPABILITIES }
    });
    try {
      const buttons = wrapper.findAll("button.example-btn");
      expect(buttons).toHaveLength(WELCOME_EXAMPLES.length);
      for (const [index, button] of buttons.entries()) {
        expect(button.text()).toContain(WELCOME_EXAMPLES[index].desc);
        await button.trigger("click");
      }
      expect(wrapper.emitted("select")).toEqual(WELCOME_EXAMPLES.map((example) => [example.prompt]));
      expect(WELCOME_EXAMPLES[0].prompt).toMatch(/前 10 秒.*实拍.*后 5 秒/);
      await wrapper.setProps({ isVisible: false });
      expect(wrapper.find(".welcome-screen").exists()).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });
});

describe("useWelcomeScreen", () => {
  it("没有消息时显示欢迎页，有消息后隐藏", () => {
    const messages = ref<UIMessage[]>([]);
    const { isVisible } = useWelcomeScreen(messages);

    expect(isVisible.value).toBe(true);

    messages.value = [{ id: "1", role: "user", parts: [{ type: "text", text: "hi" }] }];

    expect(isVisible.value).toBe(false);
  });

  it("把能力和示例原样交出去", () => {
    const { examples, capabilities } = useWelcomeScreen(ref<UIMessage[]>([]));

    expect(examples).toBe(WELCOME_EXAMPLES);
    expect(capabilities).toBe(WELCOME_CAPABILITIES);
  });
});
