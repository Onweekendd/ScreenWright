import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import type { UIMessage } from "ai";

import { editingComponentIds } from "@/hooks/useEditingComponents";

vi.mock("@/views/build/components/agentBI/components/MarkdownContent.vue", () => ({
  default: { props: ["content"], template: '<div class="test-markdown">{{ content }}</div>' }
}));
vi.mock("@/views/build/components/agentBI/components/ReasoningPart.vue", () => ({
  default: { props: ["part"], template: '<div class="test-reasoning">{{ part.text }}</div>' }
}));
vi.mock("@/views/build/components/agentBI/components/ToolCallPart.vue", () => ({
  default: { props: ["part"], template: '<div class="test-tool">{{ part.toolCallId }}</div>' }
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
import { createAssistantMessageGrouper } from "@/views/build/components/agentBI/hooks/message/groupAssistantMessages";
import { groupAssistantParts } from "@/views/build/components/agentBI/hooks/message/groupAssistantParts";

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
        Transition: false,
        ElTimeline: { template: '<div class="timeline"><slot /></div>' },
        ElTimelineItem: {
          template:
            '<div class="timeline-item"><div class="el-timeline-item__tail" /><div class="el-timeline-item__wrapper"><slot /></div></div>'
        }
      }
    }
  });

describe("对话执行过程折叠", () => {
  it("跨消息 ID 的连续工具共用折叠入口，续接保持展开状态并显示当前工具", async () => {
    const group = createAssistantMessageGrouper();
    const first: UIMessage = { id: "first", role: "assistant", parts: [thought, tool("captureCanvasTool", "capture")] };
    const second: UIMessage = { id: "second", role: "assistant", parts: [tool("readFileTool", "read")] };
    const wrapper = mountMessage(group([first, second])[0].parts, true);
    try {
      expect(wrapper.findAll(".execution-process__toggle")).toHaveLength(1);
      expect(wrapper.find(".execution-process__toggle").text()).toContain("2 次工具调用");
      await wrapper.find(".execution-process__toggle").trigger("click");
      const firstTool = wrapper.find(".test-tool").element;
      const continued: UIMessage = {
        id: "third",
        role: "assistant",
        parts: [thought, tool("editFilesTool", "edit", "input-available")]
      };
      await wrapper.setProps({ message: message(group([first, second, continued])[0].parts) });
      expect(wrapper.findAll(".execution-process__toggle")).toHaveLength(1);
      expect(wrapper.find(".execution-process__toggle").attributes("aria-expanded")).toBe("true");
      expect(wrapper.find(".execution-process__status").text()).toBe("正在调用 editFilesTool");
      expect(wrapper.find(".test-tool").element).toBe(firstTool);
      expect(wrapper.findAll(".test-tool").map((item) => item.text())).toEqual(["capture", "read", "edit"]);
    } finally {
      wrapper.unmount();
    }
  });

  it("工具默认折叠时仍有扫光，展开、收起不撤销，消息卸载后清理", async () => {
    const editing = {
      ...tool("editFilesTool", "edit", "input-available"),
      input: { files: [{ path: "screen_1/component/100_分组/101_标题.vue" }] }
    } as Part;
    const wrapper = mountMessage([editing], true);
    try {
      expect(wrapper.find(".test-tool").exists()).toBe(false);
      expect(editingComponentIds.has("101")).toBe(true);
      expect(editingComponentIds.has("100")).toBe(false);
      await wrapper.find(".execution-process__toggle").trigger("click");
      expect(editingComponentIds.has("101")).toBe(true);
      await wrapper.find(".execution-process__toggle").trigger("click");
      expect(wrapper.find(".test-tool").exists()).toBe(false);
      expect(editingComponentIds.has("101")).toBe(true);
    } finally {
      wrapper.unmount();
    }
    expect(editingComponentIds.has("101")).toBe(false);
  });

  it.each(["output-available", "output-error"])("折叠状态下编辑结束（%s）自动停止扫光", async (state) => {
    const editing = {
      ...tool("edit_files", "edit", "input-available"),
      input: { path: "screen_1\\component\\102_标题.json" }
    } as Part;
    const wrapper = mountMessage([editing], true);
    try {
      expect(editingComponentIds.has("102")).toBe(true);
      await wrapper.setProps({ message: message([{ ...editing, state } as Part]) });
      expect(editingComponentIds.has("102")).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it("同一组件多个编辑调用重叠，不因其中一个完成或另一个消息卸载而提前清理", async () => {
    const editing = (id: string) =>
      ({
        ...tool("editFilesTool", id, "input-available"),
        input: { files: [{ path: "screen_1/component/103_标题.json" }] }
      }) as Part;
    const first = mountMessage([editing("edit-1"), editing("edit-2")], true);
    const second = mountMessage([editing("edit-3")], true);
    try {
      expect(editingComponentIds.has("103")).toBe(true);
      await first.setProps({
        message: message([{ ...editing("edit-1"), state: "output-available" } as Part, editing("edit-2")])
      });
      expect(editingComponentIds.has("103")).toBe(true);
      second.unmount();
      expect(editingComponentIds.has("103")).toBe(true);
      await first.setProps({ message: message([text]) });
      expect(editingComponentIds.has("103")).toBe(false);
    } finally {
      first.unmount();
      second.unmount();
    }
  });

  it("输入从不完整变为可执行后启动扫光，只读工具和历史编辑不触发", async () => {
    const editing = tool("editFilesTool", "edit", "input-streaming");
    const wrapper = mountMessage([editing], true);
    const input = { files: [{ path: "screen_1/component/104_标题.vue" }] };
    try {
      expect(editingComponentIds.has("104")).toBe(false);
      await wrapper.setProps({ message: message([{ ...editing, state: "input-available", input } as Part]) });
      expect(editingComponentIds.has("104")).toBe(true);
      await wrapper.setProps({
        message: message([
          { ...tool("readFileTool", "read", "input-available"), input } as Part,
          { ...tool("editFilesTool", "history"), input } as Part
        ])
      });
      expect(editingComponentIds.has("104")).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it("长时间线流式追加文字不再反复测量历史节点，也不重建已有工具内容", async () => {
    const steps = Array.from({ length: 80 }, (_, index) => tool("execute", `cmd-${index}`));
    const wrapper = mountMessage([...steps, { type: "text", text: "结果", state: "streaming" }], true);
    await wrapper.find(".execution-process__toggle").trigger("click");
    const firstTool = wrapper.find(".test-tool").element;
    const measure = vi.spyOn(Element.prototype, "getBoundingClientRect");
    try {
      for (let index = 0; index < 20; index++) {
        await wrapper.setProps({
          message: message([...steps, { type: "text", text: `结果${"继续".repeat(index + 1)}`, state: "streaming" }])
        });
      }
      expect(measure).not.toHaveBeenCalled();
      expect(wrapper.find(".test-tool").element).toBe(firstTool);
      expect(wrapper.findAll(".test-tool")).toHaveLength(80);
      expect(wrapper.find(".test-markdown").text()).toBe(`结果${"继续".repeat(20)}`);
    } finally {
      measure.mockRestore();
      wrapper.unmount();
    }
  });

  it("正文后新增的工具留在新阶段，独立显示状态和展开，不挪到最前面的块", async () => {
    const first = tool("execute", "first");
    const wrapper = mountMessage([first, text], true);
    await wrapper.find(".execution-process__toggle").trigger("click");
    await wrapper.setProps({
      message: message([first, text, thought, tool("readFileTool", "second", "input-available")])
    });
    const toggles = wrapper.findAll(".execution-process__toggle");
    expect(toggles).toHaveLength(2);
    expect(toggles[0].attributes("aria-expanded")).toBe("true");
    expect(toggles[1].attributes("aria-expanded")).toBe("false");
    expect(wrapper.findAll(".test-tool").map((item) => item.text())).toEqual(["first"]);
    const groups = wrapper.findAll(".execution-process");
    expect(groups[0].find(".execution-process__status").exists()).toBe(false);
    expect(groups[1].find(".execution-process__status").text()).toBe("正在调用 readFileTool");
    expect(
      wrapper.find(".test-markdown").element.compareDocumentPosition(groups[1].element) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    await toggles[1].trigger("click");
    expect(wrapper.findAll(".test-tool").map((item) => item.text())).toEqual(["first", "second"]);
    await toggles[0].trigger("click");
    expect(wrapper.findAll(".test-tool").map((item) => item.text())).toEqual(["second"]);
    expect(wrapper.findAll(".timeline")).toHaveLength(1);
    wrapper.unmount();
  });

  it("折叠入口跟随思考、准备调用、工具执行和回复状态更新", async () => {
    const thinking = { ...thought, state: "streaming" } as Part;
    const wrapper = mountMessage([thinking], true);
    const status = () => wrapper.find(".execution-process__status").text();
    expect(status()).toBe("正在思考");
    await wrapper.setProps({ message: message([thought, tool("readFileTool", "read", "input-streaming")]) });
    expect(status()).toBe("准备调用 readFileTool");
    await wrapper.setProps({ message: message([thought, tool("readFileTool", "read", "input-available")]) });
    expect(status()).toBe("正在调用 readFileTool");
    // 工具已经返回，但模型还在继续处理，不能把上一个工具误报为仍在执行。
    await wrapper.setProps({ message: message([thought, tool("readFileTool", "read")]) });
    expect(status()).toBe("正在思考");
    await wrapper.setProps({ message: message([tool("readFileTool", "read"), thinking]) });
    expect(status()).toBe("正在思考");
    await wrapper.setProps({
      message: message([thought, tool("readFileTool", "read"), { type: "text", text: "结果", state: "streaming" }])
    });
    expect(status()).toBe("正在回复");
    expect(wrapper.find(".execution-process__toggle").attributes("aria-expanded")).toBe("false");
    await wrapper.setProps({ isLoading: false });
    expect(wrapper.find(".execution-process__status").exists()).toBe(false);
    wrapper.unmount();
  });

  it("展示并行工具的名称，后台占位保持执行状态直到结果回填", async () => {
    const read = tool("readFileTool", "read", "input-available");
    const execute = tool("execute", "cmd", "input-available");
    const wrapper = mountMessage([read, execute, { type: "data-usage", data: {} }], true);
    expect(wrapper.find(".execution-process__status").text()).toBe("正在调用 readFileTool、execute");
    await wrapper.setProps({ message: message([tool("readFileTool", "read"), execute]) });
    expect(wrapper.find(".execution-process__status").text()).toBe("正在调用 execute");
    const background = {
      ...tool("searchMediaAssetsTool", "assets"),
      output: "Background task started. Task ID: task-1"
    } as Part;
    await wrapper.setProps({ message: message([background]) });
    expect(wrapper.find(".execution-process__status").text()).toBe("正在调用 searchMediaAssetsTool");
    await wrapper.setProps({ message: message([tool("searchMediaAssetsTool", "assets")]) });
    expect(wrapper.find(".execution-process__status").text()).toBe("正在思考");
    wrapper.unmount();
  });

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

  it("正文分隔执行阶段，协议帧和错误不额外拆块，每段独立展开且保持时间顺序", async () => {
    const wrapper = mountMessage([
      tool("execute", "first"),
      text,
      { type: "data-usage", data: {} },
      thought,
      tool("readFileTool", "second"),
      tool("execute", "failed", "output-error"),
      thought
    ]);
    expect(wrapper.findAll(".execution-process__toggle")).toHaveLength(2);
    expect(wrapper.findAll(".execution-process__toggle").map((item) => item.text())).toEqual([
      "执行过程1 次工具调用",
      "执行过程1 次工具调用"
    ]);
    expect(wrapper.findAll(".test-tool").map((item) => item.text())).toEqual(["failed"]);
    expect(wrapper.find(".test-markdown").text()).toBe("成片已生成");
    await wrapper.findAll(".execution-process__toggle")[0].trigger("click");
    expect(wrapper.findAll(".test-tool").map((item) => item.text())).toEqual(["first", "failed"]);
    expect(wrapper.find(".test-reasoning").exists()).toBe(false);
    await wrapper.findAll(".execution-process__toggle")[1].trigger("click");
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
    expect(wrapper.find(".execution-process__status").text()).toBe("正在调用 execute");
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
