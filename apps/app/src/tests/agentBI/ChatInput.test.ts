import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineComponent, ref } from "vue";
import { shallowMount } from "@vue/test-utils";

const { dialog, warning } = vi.hoisted(() => ({ dialog: vi.fn(), warning: vi.fn() }));
vi.mock("@screenwright/server/rpc", () => ({
  AgentMode: { ASK_BEFORE_EDIT: "ASK_BEFORE_EDIT", AUTO_EDIT: "AUTO_EDIT", PLAN: "PLAN" }
}));
vi.mock("element-plus", () => ({ ElMessage: { warning } }));
vi.mock("@/hooks/useDialog", () => ({ useDialog: () => ({ dialog }) }));
vi.mock("@/utils/config", () => ({
  setMinioUrl: (url: string) => (url?.startsWith("http") ? url : `https://assets.example.com/${url}`)
}));
vi.mock("@/components/Icon/index.vue", () => ({ default: { template: "<span />" } }));
vi.mock("@/views/build/components/buildTabs/selectAssets/index.vue", () => ({
  default: { template: "<div />" }
}));
vi.mock("@/views/build/components/agentBI/components/SelectedComponentsList.vue", () => ({
  default: { template: "<div />" }
}));
vi.mock("@/views/build/components/agentBI/agentBISessionContext", () => ({
  useActiveAgentBISession: () => session
}));
vi.mock("@/views/build/components/agentBI/components/useChatInput", () => ({
  useChatInput: () => ({
    editorRef: ref(),
    dropdownRef: ref(),
    dropdownStyle: ref({}),
    mention: { active: false },
    filteredComponents: ref([]),
    selectTargetData: ref([])
  })
}));

import ChatInput from "@/views/build/components/agentBI/components/ChatInput.vue";
import type { AttachmentItem } from "@/views/build/components/agentBI/hooks/attachment/useAgentAttachment";

const session = {
  activeThreadId: ref("thread-1"),
  resourceId: ref("screen-1"),
  addFiles: vi.fn(),
  addMedia: vi.fn(),
  attachments: ref<AttachmentItem[]>([]),
  compacting: ref(false),
  contextColor: ref("#fff"),
  contextPercentage: ref(0),
  contextTooltip: ref(""),
  currentMode: ref("AUTO_EDIT"),
  isStreaming: ref(false),
  removeAttachment: vi.fn(),
  requestCompact: vi.fn(),
  stopStreaming: vi.fn(),
  updateThreadMode: vi.fn()
};
const ElDropdown = defineComponent({
  name: "ElDropdown",
  emits: ["command"],
  template: "<div><slot /><slot name='dropdown' /></div>"
});
const ElDialog = defineComponent({
  name: "ElDialog",
  props: { modelValue: Boolean },
  emits: ["update:modelValue"],
  template: "<div v-if='modelValue' class='video-preview-dialog'><slot /></div>"
});
const ElImage = defineComponent({
  name: "ElImage",
  props: { src: String, previewSrcList: Array, initialIndex: Number, previewTeleported: Boolean },
  template: "<img :src='src' />"
});
let wrapper: ReturnType<typeof shallowMount>;

beforeEach(() => {
  vi.clearAllMocks();
  session.attachments.value = [];
  wrapper = shallowMount(ChatInput, {
    props: { modelValue: "" },
    global: {
      stubs: {
        MediaAttachmentPreview: false,
        ElDropdown,
        ElDialog,
        ElImage,
        ElDropdownMenu: true,
        ElDropdownItem: true,
        ElSelect: true,
        ElOption: true,
        ElProgress: true,
        ElTooltip: true
      }
    }
  });
});
afterEach(() => wrapper.unmount());

const chooseAsset = (asset: unknown) => {
  wrapper.findComponent(ElDropdown).vm.$emit("command", "assets");
  const done = vi.fn();
  dialog.mock.calls[0][0].closeBefore({ validate: () => asset }, done);
  return done;
};

describe("ChatInput 媒体来源", () => {
  it("本地上传入口打开文件选择器，选择后清空 input 以便再次选择相同文件", async () => {
    const input = wrapper.find<HTMLInputElement>("input[type=file]");
    const click = vi.spyOn(input.element, "click");
    wrapper.findComponent(ElDropdown).vm.$emit("command", "local");
    expect(click).toHaveBeenCalledOnce();
    expect(input.attributes("accept")).toContain("image/*");
    expect(input.attributes("accept")).toContain("video/*");
    const files = [new File(["png"], "local.png", { type: "image/png" })];
    Object.defineProperty(input.element, "files", { value: files });
    await input.trigger("change");
    expect(session.addFiles).toHaveBeenCalledWith(files);
    expect(input.element.value).toBe("");
  });

  it("素材库图片转换为带名称和 MIME 类型的待发送附件", () => {
    const done = chooseAsset({ title: "背景", url: "images/background.PNG?token=abc", fileType: "png", type: "img" });
    expect(session.addMedia).toHaveBeenCalledWith({
      filename: "背景.png",
      mediaType: "image/png",
      url: "https://assets.example.com/images/background.PNG?token=abc"
    });
    expect(done).toHaveBeenCalledOnce();
  });

  it("无后缀的资源地址使用素材的文件类型，保留已有图片文件名", () => {
    chooseAsset({ name: "photo.webp", title: "照片", url: "https://assets.example.com/123", fileType: "webp" });
    expect(session.addMedia).toHaveBeenCalledWith({
      filename: "photo.webp",
      mediaType: "image/webp",
      url: "https://assets.example.com/123"
    });
  });

  it("素材库视频保留 URL 和视频类型", () => {
    const done = chooseAsset({ title: "视频", url: "clip.mp4", fileType: "mp4", type: "video" });
    expect(session.addMedia).toHaveBeenCalledWith({
      filename: "视频.mp4",
      mediaType: "video/mp4",
      url: "https://assets.example.com/clip.mp4"
    });
    expect(done).toHaveBeenCalledOnce();
  });

  it("不将模型素材作为媒体发送，保留弹窗以便重新选择", () => {
    const done = chooseAsset({ title: "模型", url: "model.glb", fileType: "glb", type: "img" });
    expect(session.addMedia).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith("请选择图片或视频素材");
    expect(done).not.toHaveBeenCalled();
  });

  it("视频显示缩略块，点击打开播放器，关闭后移除播放器", async () => {
    session.attachments.value = [
      {
        id: "video-1",
        filename: "clip.mp4",
        mediaType: "video/mp4",
        previewUrl: "https://assets.example.com/clip.mp4",
        remoteUrl: "https://assets.example.com/clip.mp4",
        status: "pending"
      }
    ];
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".thumb-video").attributes("src")).toBe("https://assets.example.com/clip.mp4");
    expect(wrapper.find(".video-url").exists()).toBe(false);
    expect(wrapper.find(".attachment-video-preview").exists()).toBe(false);
    expect(wrapper.find(".thumb-img").exists()).toBe(false);
    await wrapper.find(".thumb-video-button").trigger("click");
    const player = wrapper.find(".attachment-video-preview");
    expect(player.attributes("src")).toBe("https://assets.example.com/clip.mp4");
    expect(player.attributes()).toHaveProperty("controls");
    wrapper.findComponent(ElDialog).vm.$emit("update:modelValue", false);
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".attachment-video-preview").exists()).toBe(false);
  });

  it("本地视频使用预览 URL，移除附件时自动关闭预览", async () => {
    session.attachments.value = [
      {
        id: "local-video",
        filename: "clip.mp4",
        mediaType: "video/mp4",
        previewUrl: "blob:local-video",
        status: "pending"
      }
    ];
    await wrapper.vm.$nextTick();
    await wrapper.find(".thumb-video-button").trigger("click");
    expect(wrapper.find(".attachment-video-preview").attributes("src")).toBe("blob:local-video");
    session.attachments.value = [];
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".attachment-video-preview").exists()).toBe(false);
  });

  it("图片和视频共享预览列表，从点击的附件开始切换", async () => {
    session.attachments.value = [
      { id: "image-1", filename: "first.png", mediaType: "image/png", previewUrl: "blob:first", status: "pending" },
      { id: "video-1", filename: "clip.mp4", mediaType: "video/mp4", previewUrl: "blob:video", status: "pending" },
      { id: "image-2", filename: "second.png", mediaType: "image/png", previewUrl: "blob:second", status: "pending" }
    ];
    await wrapper.vm.$nextTick();
    const images = wrapper.findAllComponents(ElImage);
    expect(images).toHaveLength(2);
    await images[1].trigger("click");
    expect(wrapper.find(".attachment-image-preview").attributes("src")).toBe("blob:second");
    await wrapper.find('[aria-label="上一个素材"]').trigger("click");
    expect(wrapper.find(".attachment-video-preview").attributes("src")).toBe("blob:video");
  });
});
