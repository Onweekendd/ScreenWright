import { describe, expect, it, vi } from "vitest";

import { nextTick, ref } from "vue";
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

  it("能力区说明先生成概念图再按图搭建的流程", () => {
    expect(WELCOME_CAPABILITIES.map((item) => item.title)).toEqual(["生成概念图", "按图搭建", "搭可编辑大屏"]);
    expect(WELCOME_CAPABILITIES.map((item) => `${item.title}${item.desc}`).join("")).not.toMatch(/联网|视频/);
  });

  it("每个示例先生成一张整屏概念图，等待并查看后继续完成可编辑大屏", () => {
    for (const example of WELCOME_EXAMPLES) {
      expect(example.prompt).toMatch(/先用 createImageTool 生成一张.*当前画布尺寸.*概念图/);
      expect(example.prompt).toMatch(/等待并查看生成结果后，根据概念图完成大屏/);
      expect(example.prompt).toContain("独立可编辑组件");
      expect(example.prompt).toContain("使用示例数据并注明");
      expect(example.prompt).toContain("继续搭建并截图对照，直到完成大屏");
    }
  });

  it("每个示例都明确排除素材搜索和视频生成", () => {
    for (const example of WELCOME_EXAMPLES) {
      expect(example.label).not.toBe("");
      expect(example.desc).not.toBe("");
      expect(example.prompt).toContain("此次不进行素材搜索和视频生成");
      expect(example.prompt).not.toMatch(/MCP|实拍|searchMediaAssetsTool|createVideoTool|背景视频/);
      expect(example.desc).not.toMatch(/视频|动态/);
    }
  });

  it("点击每条示例发送完整的概念图建屏任务", async () => {
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
      await wrapper.setProps({ isVisible: false });
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(wrapper.find(".welcome-screen").exists()).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });
});

describe("开始对话的过渡", () => {
  it("先淡出欢迎内容，再移动同一个输入框，落位后才通知显示消息", async () => {
    vi.useFakeTimers();
    const wrapper = mount(WelcomeScreen, {
      props: { isVisible: true, examples: WELCOME_EXAMPLES, capabilities: WELCOME_CAPABILITIES },
      slots: { default: "<textarea />" }
    });
    try {
      const input = wrapper.get("textarea");
      await input.setValue("尚未发送的草稿");
      const composer = wrapper.get(".composer-anchor").element as HTMLDivElement;
      vi.spyOn(composer, "getBoundingClientRect")
        .mockReturnValueOnce({ left: 100, top: 200, width: 640, height: 128 } as DOMRect)
        .mockReturnValueOnce({ left: 0, top: 700, width: 1000, height: 140 } as DOMRect);
      let finishMotion!: () => void;
      const animation = {
        finished: new Promise<void>((resolve) => {
          finishMotion = resolve;
        }),
        cancel: vi.fn()
      };
      composer.animate = vi.fn().mockReturnValue(animation);

      await wrapper.setProps({ isVisible: false });
      expect(wrapper.classes()).toContain("is-leaving");
      expect(wrapper.find(".welcome-header").exists()).toBe(true);
      expect(wrapper.get(".example-btn").attributes("disabled")).toBeDefined();
      expect(wrapper.emitted("layout-change")).toBeUndefined();

      await vi.advanceTimersByTimeAsync(180);
      expect(wrapper.find(".welcome-header").exists()).toBe(false);
      expect(wrapper.emitted("layout-change")).toEqual([[false]]);
      expect(composer.animate).toHaveBeenCalledWith(
        [{ transform: expect.stringContaining("translate(100px, -500px)") }, { transform: "none" }],
        expect.objectContaining({ duration: 460 })
      );
      expect(wrapper.emitted("transition-end")).toBeUndefined();
      expect(wrapper.get("textarea").element).toBe(input.element);
      expect((input.element as HTMLTextAreaElement).value).toBe("尚未发送的草稿");

      finishMotion();
      await nextTick();
      expect(wrapper.emitted("transition-end")).toHaveLength(1);
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it("过渡中清空对话会取消离场，避免旧定时器再次隐藏欢迎页", async () => {
    vi.useFakeTimers();
    const wrapper = mount(WelcomeScreen, {
      props: { isVisible: true, examples: WELCOME_EXAMPLES, capabilities: WELCOME_CAPABILITIES },
      slots: { default: "<textarea />" }
    });
    try {
      await wrapper.setProps({ isVisible: false });
      await vi.advanceTimersByTimeAsync(80);
      await wrapper.setProps({ isVisible: true });
      await vi.advanceTimersByTimeAsync(1000);

      expect(wrapper.find(".welcome-header").exists()).toBe(true);
      expect(wrapper.classes()).not.toContain("is-leaving");
      expect(wrapper.emitted("layout-change")).toEqual([[true]]);
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it("减少动态效果时立即切换布局", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    const wrapper = mount(WelcomeScreen, {
      props: { isVisible: true, examples: WELCOME_EXAMPLES, capabilities: WELCOME_CAPABILITIES }
    });
    try {
      await wrapper.setProps({ isVisible: false });
      expect(wrapper.find(".welcome-header").exists()).toBe(false);
      expect(wrapper.emitted("layout-change")).toEqual([[false]]);
      expect(wrapper.emitted("transition-end")).toHaveLength(1);
    } finally {
      wrapper.unmount();
      vi.unstubAllGlobals();
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
