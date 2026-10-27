import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, defineComponent, ref } from "vue";
import { shallowMount } from "@vue/test-utils";

vi.mock("@/views/build/components/agentBI/components/ChatInput.vue", () => ({
  default: { name: "ChatInput", template: "<div />" }
}));
vi.mock("@/hooks/useGlobalLoading", () => ({ useGlobalLoading: () => ({ loadingScene }) }));
vi.mock("@/views/build/components/buildRender/hooks/useEditStore", () => ({
  useEditStore: () => ({ componentList })
}));
vi.mock("@/views/build/useLargeScreenInfo", () => ({ useLargeScreenInfo: () => ({ navInfo }) }));
vi.mock("@/views/build/components/agentBI/useAgentBISessions", () => ({
  useAgentBISessions: () => ({ activeSession, visible })
}));

import { useActiveAgentBISession } from "@/views/build/components/agentBI/agentBISessionContext";
import EmptyCanvasChat from "@/views/build/components/agentBI/components/EmptyCanvasChat.vue";

const loadingScene = ref(false);
const componentList = ref<unknown[]>([]);
const navInfo = ref({ id: 2 });
const visible = ref(false);
const session = {
  sessionId: "shared-session",
  inputText: ref(""),
  messages: ref<unknown[]>([]),
  isStreaming: ref(false),
  attachments: ref<Array<{ status: string }>>([]),
  sendMessage: vi.fn()
};
const activeSession = computed(() => session);
let injectedSession: unknown;
const ChatInput = defineComponent({
  name: "ChatInput",
  props: { modelValue: String },
  emits: ["update:modelValue", "send"],
  setup() {
    injectedSession = useActiveAgentBISession();
    return {};
  },
  template: '<div class="chat-input" />'
});
let wrapper: ReturnType<typeof shallowMount>;

beforeEach(() => {
  vi.clearAllMocks();
  loadingScene.value = false;
  componentList.value = [];
  navInfo.value = { id: 2 };
  visible.value = false;
  session.inputText.value = "";
  session.messages.value = [];
  session.attachments.value = [];
  session.isStreaming.value = false;
  wrapper = shallowMount(EmptyCanvasChat, { global: { stubs: { ChatInput, WelcomeScreen: false } } });
});

afterEach(() => wrapper.unmount());

describe("空白画布 AI 入口", () => {
  it("打开 AI 侧栏立即隐藏中央输入框，保留草稿且不发送消息", async () => {
    wrapper.findComponent(ChatInput).vm.$emit("update:modelValue", "我的草稿");
    visible.value = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".empty-canvas-chat").exists()).toBe(false);
    expect(session.inputText.value).toBe("我的草稿");
    expect(session.sendMessage).not.toHaveBeenCalled();
    visible.value = false;
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(ChatInput).props("modelValue")).toBe("我的草稿");
  });
  it("显示同侧栏一致的欢迎语和灵感示例，点击示例后在同一会话发送", async () => {
    expect(wrapper.text()).toContain("今天，想做点什么？");
    expect(wrapper.findAll(".example-btn")).toHaveLength(3);
    await wrapper.find(".example-btn").trigger("click");
    expect(visible.value).toBe(true);
    expect(session.sendMessage).toHaveBeenCalledOnce();
    expect(session.sendMessage.mock.calls[0][0]).toMatch(/^<welcome>.*新疆.*<\/welcome>$/);
  });
  it("复用当前会话，输入草稿时不打开侧栏", async () => {
    expect(injectedSession).toBe(session);
    wrapper.findComponent(ChatInput).vm.$emit("update:modelValue", "做一个销售看板");
    await wrapper.vm.$nextTick();
    expect(session.inputText.value).toBe("做一个销售看板");
    expect(visible.value).toBe(false);
    expect(session.sendMessage).not.toHaveBeenCalled();
    expect(wrapper.find(".chat-input").exists()).toBe(true);
  });

  it("首次发送保留文本，切换到侧栏且只发送一次", async () => {
    const input = wrapper.findComponent(ChatInput);
    input.vm.$emit("update:modelValue", "做一个销售看板");
    input.vm.$emit("send");
    input.vm.$emit("send");
    input.vm.$emit("update:modelValue", "");
    await wrapper.vm.$nextTick();
    expect(visible.value).toBe(true);
    expect(session.sendMessage).toHaveBeenCalledOnce();
    expect(session.sendMessage).toHaveBeenCalledWith("做一个销售看板");
    expect(wrapper.find(".empty-canvas-chat").exists()).toBe(false);
  });

  it("只有参考图片也能开始，空输入不能触发", async () => {
    wrapper.findComponent(ChatInput).vm.$emit("send");
    expect(visible.value).toBe(false);
    expect(session.sendMessage).not.toHaveBeenCalled();
    session.attachments.value = [{ status: "pending" }];
    wrapper.findComponent(ChatInput).vm.$emit("send");
    await wrapper.vm.$nextTick();
    expect(visible.value).toBe(true);
    expect(session.sendMessage).toHaveBeenCalledOnce();
    expect(session.sendMessage).toHaveBeenCalledWith("");
  });

  it("加载期间、已有组件和已有对话时不显示中央入口", async () => {
    for (const state of ["loading", "components", "messages", "streaming", "invalid-screen"]) {
      loadingScene.value = state === "loading";
      componentList.value = state === "components" ? [{ id: 1 }] : [];
      session.messages.value = state === "messages" ? [{ role: "user" }] : [];
      session.isStreaming.value = state === "streaming";
      navInfo.value.id = state === "invalid-screen" ? -1 : 2;
      await wrapper.vm.$nextTick();
      expect(wrapper.find(".empty-canvas-chat").exists(), state).toBe(false);
    }
  });
});
