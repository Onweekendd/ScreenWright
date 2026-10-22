import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineComponent, h, ref } from "vue";
import { mount } from "@vue/test-utils";

vi.mock("@/views/build/components/buildRender/hooks/useEditStore", () => ({
  useEditStore: () => ({ selectTargetData: ref([]), componentList: ref([]) })
}));
vi.mock("@/views/build/useGlobalComponentData", () => ({
  useGlobalComponentData: () => ({ allComponentMap: ref(new Map()) })
}));
vi.mock("@/views/build/components/agentBI/agentBISessionContext", () => ({
  useActiveAgentBISession: () => session
}));

import { useChatInput } from "@/views/build/components/agentBI/components/useChatInput";

const session = { addFiles: vi.fn(), attachments: ref<Array<{ status: "pending" }>>([]), mentionedComponents: ref([]) };
const originalExecCommand = Object.getOwnPropertyDescriptor(document, "execCommand");
const insertText = vi.fn();
const emit = vi.fn();
let input: ReturnType<typeof useChatInput>;
let wrapper: ReturnType<typeof mount>;

beforeEach(() => {
  vi.clearAllMocks();
  session.attachments.value = [];
  Object.defineProperty(document, "execCommand", { configurable: true, value: insertText });
  wrapper = mount(
    defineComponent({
      setup() {
        input = useChatInput(emit);
        return () => h("div", { ref: input.editorRef, contenteditable: true, onPaste: input.handlePaste });
      }
    })
  );
});

afterEach(() => wrapper.unmount());
afterAll(() => {
  if (originalExecCommand) {
    Object.defineProperty(document, "execCommand", originalExecCommand);
  } else {
    Reflect.deleteProperty(document, "execCommand");
  }
});

const image = new File(["image bytes"], "screenshot.png", { type: "image/png" });
const imageItem = { kind: "file", type: image.type, getAsFile: () => image };
const paste = (files: File[] = [], items: unknown[] = [], text = "") => {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { files, items, getData: () => text } });
  wrapper.element.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
};

describe("ChatInput 图片粘贴", () => {
  it("截图同时出现在 files 和 items 中时只添加一次，不插入内联图片", () => {
    paste([image], [imageItem]);
    expect(session.addFiles.mock.calls).toEqual([[[image]]]);
    expect(insertText).not.toHaveBeenCalled();
    expect(wrapper.find("img").exists()).toBe(false);
  });

  it("剪贴板仅通过 items 提供图片时仍可添加", () => {
    paste([], [imageItem, { kind: "file", type: "image/png", getAsFile: () => null }]);
    expect(session.addFiles.mock.calls).toEqual([[[image]]]);
  });

  it("混合粘贴保留文字和多张图片，跳过其他类型文件", () => {
    const second = new File(["image"], "second.jpg", { type: "image/jpeg" });
    const pdf = new File(["pdf"], "document.pdf", { type: "application/pdf" });
    paste([image, pdf, second], [], "请看这两张图片");
    expect(session.addFiles.mock.calls).toEqual([[[image, second]]]);
    expect(insertText).toHaveBeenCalledWith("insertText", false, "请看这两张图片");
  });

  it("普通文字仍然按纯文本粘贴", () => {
    paste([], [], "hello");
    expect(session.addFiles).not.toHaveBeenCalled();
    expect(insertText).toHaveBeenCalledWith("insertText", false, "hello");
  });

  it("纯图片可以发送；没有文字和附件时不发送", () => {
    input.handleSend();
    expect(emit).not.toHaveBeenCalled();
    session.attachments.value = [{ status: "pending" }];
    input.handleSend();
    expect(emit).toHaveBeenCalledWith("send");
  });

  it("发送前同步编辑器文字，不受输入防抖影响", () => {
    wrapper.element.textContent = "刚粘贴的文字";
    input.handleSend();
    expect(emit.mock.calls).toEqual([["update:modelValue", "刚粘贴的文字"], ["send"], ["update:modelValue", ""]]);
  });
});
