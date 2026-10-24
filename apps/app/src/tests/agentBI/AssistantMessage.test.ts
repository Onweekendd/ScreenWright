import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import type { UIMessage } from "ai";

vi.mock("@/views/build/components/agentBI/components/MarkdownContent.vue", () => ({
  default: { props: ["content"], template: '<div class="test-markdown">{{ content }}</div>' }
}));
vi.mock("@/views/build/components/agentBI/components/ReasoningPart.vue", () => ({
  default: { props: ["part"], template: '<div class="test-reasoning">{{ part.text }}</div>' }
}));
vi.mock("@/views/build/components/agentBI/components/ToolCallPart.vue", () => ({
  default: { props: ["part"], template: '<div class="test-tool">{{ part.toolCallId }}</div>' }
}));
vi.mock("@/views/build/components/agentBI/components/figmaToBIMessage/WorkflowMessage.vue", () => ({
  default: { template: "<div />" }
}));
vi.mock("@/views/build/components/agentBI/components/LayoutTemplateResult.vue", () => ({
  default: { template: "<div />" }
}));
vi.mock("@/views/build/components/agentBI/components/SubAgentPart.vue", () => ({ default: { template: "<div />" } }));
vi.mock("@/views/build/components/agentBI/components/TodoWritePart.vue", () => ({
  default: { props: ["part"], template: '<div class="test-tool">{{ part.toolCallId }}</div>' }
}));
vi.mock("@/views/build/components/agentBI/components/OMBufferingPart.vue", () => ({
  default: { template: "<div />" }
}));

import AssistantMessage from "@/views/build/components/agentBI/components/AssistantMessage.vue";
import ExecutionProcessBlock from "@/views/build/components/agentBI/components/ExecutionProcessBlock.vue";
import { groupAssistantParts } from "@/views/build/components/agentBI/hooks/groupAssistantParts";

type Part = UIMessage["parts"][number];
const tool = (name: string, id: string, state = "output-available"): Part =>
  ({ type: `tool-${name}`, toolCallId: id, state, input: {}, output: {} }) as Part;
const thought = { type: "reasoning", text: "分析画面", state: "done" } as Part;
const text = { type: "text", text: "成片已生成" } as Part;
const message = (parts: Part[]): UIMessage => ({ id: "message-1", role: "assistant", parts });
const mountMessage = (parts: Part[], isLoading = false) =>
  mount(AssistantMessage, {
    props: { message: message(parts), isLoading },
    global: {
      stubs: {
        TransitionGroup: false,
        ElTimeline: { template: '<div class="timeline"><slot /></div>' },
        ElTimelineItem: {
          template:
            '<div class="timeline-item"><div class="el-timeline-item__tail" /><div class="el-timeline-item__wrapper"><slot /></div></div>'
        }
      }
    }
  });

describe("对话执行过程折叠", () => {
  it("收起时等伸缩动画结束再移除步骤，正文节点不被替换，连线不被裁剪", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");
    const animations: Array<{ node: HTMLElement; frames: Keyframe[]; onfinish?: () => void; oncancel?: () => void }> =
      [];
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value(this: HTMLElement, frames: Keyframe[]) {
        const animation = {
          node: this,
          frames,
          onfinish: undefined as (() => void) | undefined,
          oncancel: undefined as (() => void) | undefined,
          cancel() {
            this.oncancel?.();
          }
        };
        animations.push(animation);
        return animation;
      }
    });
    const wrapper = mountMessage([thought, tool("execute", "cmd"), text]);
    const body = wrapper.find(".test-markdown").element;
    try {
      await wrapper.find(".execution-process__toggle").trigger("click");
      const entering = animations.splice(0);
      expect(entering.some((item) => item.frames[0].clipPath === "inset(0 0 100% 0)")).toBe(true);
      for (const item of entering) {
        expect(item.node.closest<HTMLElement>(".timeline-item")?.style.overflow).not.toBe("hidden");
        item.onfinish?.();
      }
      await wrapper.find(".execution-process__toggle").trigger("click");
      expect(wrapper.find(".test-tool").exists()).toBe(true);
      expect(wrapper.find(".test-markdown").element).toBe(body);
      const leaving = animations.splice(0);
      expect(leaving.some((item) => item.frames[1].height === "0px")).toBe(true);
      leaving.forEach((item) => item.onfinish?.());
      await wrapper.vm.$nextTick();
      expect(wrapper.find(".test-tool").exists()).toBe(false);
      expect(wrapper.find(".test-markdown").element).toBe(body);
      expect(wrapper.findAll(".timeline")).toHaveLength(1);
      // 连续反向切换时清理旧动画，不残留离场节点。
      await wrapper.find(".execution-process__toggle").trigger("click");
      await wrapper.find(".execution-process__toggle").trigger("click");
      await wrapper.find(".execution-process__toggle").trigger("click");
      animations.splice(0).forEach((item) => item.onfinish?.());
      await wrapper.vm.$nextTick();
      expect(wrapper.findAll(".test-tool")).toHaveLength(1);
      expect(wrapper.find(".test-markdown").element).toBe(body);
    } finally {
      wrapper.unmount();
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, "animate", descriptor);
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "animate");
      }
    }
  });

  it("跨 step-start 合并连续工具和思考，保留原始顺序", () => {
    const parts = [thought, tool("readFileTool", "read"), { type: "step-start" } as Part, tool("execute", "cmd")];
    expect(groupAssistantParts(parts)).toMatchObject([
      { type: "data-execution-process", toolCount: 2, parts: [thought, parts[1], parts[3]], running: false }
    ]);
  });

  it("历史过程默认收起，展开后将明细放回同一条时间线", async () => {
    const wrapper = mountMessage([thought, tool("readFileTool", "read"), tool("execute", "cmd"), text]);
    expect(wrapper.findAll(".execution-process__toggle")).toHaveLength(1);
    expect(wrapper.findAll(".timeline")).toHaveLength(1);
    for (const item of wrapper.findAll(".test-tool")) {
      expect(item.element.closest(".timeline")).toBe(wrapper.find(".timeline").element);
    }
    expect(wrapper.find(".execution-process__toggle").text()).toContain("2 次工具调用");
    expect(wrapper.find(".test-tool").exists()).toBe(false);
    expect(wrapper.find(".test-markdown").text()).toBe("成片已生成");
    await wrapper.find(".execution-process__toggle").trigger("click");
    expect(wrapper.findAll(".test-tool").map((item) => item.text())).toEqual(["read", "cmd"]);
    expect(wrapper.find(".test-reasoning").text()).toBe("分析画面");
    expect(wrapper.findAll(".execution-process__toggle")).toHaveLength(1);
    await wrapper.find(".execution-process__toggle").trigger("click");
    expect(wrapper.find(".test-tool").exists()).toBe(false);
    wrapper.unmount();
  });

  it.each([
    "execute",
    "createImageTool",
    "createVideoTool",
    "searchMediaAssetsTool",
    "importMediaAssetsTool",
    "todoWrite"
  ])("只有一次 %s 调用也默认折叠，展开后回到主时间线", async (name) => {
    const wrapper = mountMessage([tool(name, "single"), text]);
    expect(wrapper.find(".test-tool").exists()).toBe(false);
    expect(wrapper.find(".execution-process__toggle").text()).toContain("1 次工具调用");
    await wrapper.find(".execution-process__toggle").trigger("click");
    expect(wrapper.findAll(".test-tool").map((item) => item.text())).toEqual(["single"]);
    expect(wrapper.findAll(".timeline")).toHaveLength(1);
    wrapper.unmount();
  });

  it("正文、协议帧和错误不再拆分执行块，全部工具和思考统一合并", async () => {
    const wrapper = mountMessage([
      tool("execute", "first"),
      text,
      { type: "data-usage", data: {} },
      thought,
      tool("readFileTool", "second"),
      tool("execute", "failed", "output-error"),
      thought
    ]);
    expect(wrapper.findAll(".execution-process__toggle")).toHaveLength(1);
    expect(wrapper.find(".execution-process__toggle").text()).toContain("2 次工具调用");
    expect(wrapper.findAll(".test-tool").map((item) => item.text())).toEqual(["failed"]);
    expect(wrapper.find(".test-markdown").text()).toBe("成片已生成");
    await wrapper.find(".execution-process__toggle").trigger("click");
    expect(wrapper.findAll(".test-tool").map((item) => item.text())).toEqual(["first", "second", "failed"]);
    expect(wrapper.findAll(".test-reasoning")).toHaveLength(2);
    expect(wrapper.findAll(".timeline")).toHaveLength(1);
    expect(wrapper.findAll(".test-tool, .test-reasoning, .test-markdown").map((item) => item.text())).toEqual([
      "first",
      "成片已生成",
      "分析画面",
      "second",
      "failed",
      "分析画面"
    ]);
    wrapper.unmount();
  });

  it("执行中也默认收起，入口显示状态，完成后保持收起", async () => {
    const parts = [thought, tool("execute", "cmd", "input-available")];
    const wrapper = mountMessage(parts, true);
    expect(wrapper.find(".test-tool").exists()).toBe(false);
    expect(wrapper.find(".execution-process__status").text()).toBe("进行中");
    await wrapper.setProps({ message: message([thought, tool("execute", "cmd")]), isLoading: false });
    expect(wrapper.find(".test-tool").exists()).toBe(false);
    expect(wrapper.find(".execution-process__toggle").attributes("aria-expanded")).toBe("false");
    wrapper.unmount();
  });

  it("流式追加不自动展开，手动展开也不被完成事件收起", async () => {
    const wrapper = mountMessage([tool("execute", "cmd", "input-available")], true);
    await wrapper.setProps({ message: message([tool("execute", "cmd"), tool("readFileTool", "read")]) });
    expect(wrapper.find(".test-tool").exists()).toBe(false);
    await wrapper.find(".execution-process__toggle").trigger("click");
    await wrapper.setProps({ isLoading: false });
    expect(wrapper.findAll(".test-tool")).toHaveLength(2);
    wrapper.unmount();
  });

  it("正文开始输出后，前一段过程收起；纯正文不出现折叠入口", async () => {
    const wrapper = mountMessage([tool("execute", "cmd")], true);
    await wrapper.setProps({ message: message([tool("execute", "cmd"), text]) });
    expect(wrapper.find(".test-tool").exists()).toBe(false);
    await wrapper.setProps({ message: message([text]) });
    expect(wrapper.findComponent(ExecutionProcessBlock).exists()).toBe(false);
    expect(wrapper.find(".test-markdown").text()).toBe(text.type === "text" ? text.text : "");
    wrapper.unmount();
  });
});
