import { describe, expect, it } from "vitest";

import { ref } from "vue";

import type { UIMessage } from "ai";

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

  it("展示生图和生视频能力：示例里既有只生图的，也有生图 + 生视频的", () => {
    const tags = WELCOME_EXAMPLES.map((example) => example.tags);

    expect(tags.some((t) => t.includes("生图"))).toBe(true);
    expect(tags.some((t) => t.includes("生视频"))).toBe(true);
  });

  it("带「生视频」标签的示例，提示词里真的提到了动态视频，点下去 agent 才会去生成", () => {
    for (const example of WELCOME_EXAMPLES.filter((e) => e.tags.includes("生视频"))) {
      expect(example.prompt).toMatch(/视频/);
    }
  });

  it("带「生图」标签的示例标签和提示词都不为空", () => {
    for (const example of WELCOME_EXAMPLES) {
      expect(example.label).not.toBe("");
      expect(example.prompt.length).toBeGreaterThan(20);
      expect(example.tags.length).toBeGreaterThan(0);
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
