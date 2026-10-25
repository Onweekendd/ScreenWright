import { describe, expect, it, vi } from "vitest";

import { defineComponent } from "vue";
import { shallowMount } from "@vue/test-utils";

import type { UIMessage } from "ai";

vi.mock("@/components/Icon/index.vue", () => ({ default: { template: "<span />" } }));
vi.mock("@/views/build/components/agentBI/components/ComponentRefChip.vue", () => ({
  default: { template: "<span />" }
}));

import UserMessage from "@/views/build/components/agentBI/components/UserMessage.vue";
import { buildVideoAttachmentXml } from "@/views/build/components/agentBI/hooks/attachmentMessage";

const ElDialog = defineComponent({
  name: "ElDialog",
  props: { modelValue: Boolean },
  emits: ["update:modelValue"],
  template: "<div v-if='modelValue'><slot /></div>"
});
const ElImage = defineComponent({
  name: "ElImage",
  props: { src: String, previewSrcList: Array, initialIndex: Number },
  template: "<img :src='src' />"
});
const video = { filename: "clip.mp4", mediaType: "video/mp4", url: "https://assets.example.com/clip.mp4" };
const mountMessage = (parts: UIMessage["parts"]) =>
  shallowMount(UserMessage, {
    props: { parts },
    global: { stubs: { MediaAttachmentPreview: false, ElDialog, ElImage, ElSelect: true, ElOption: true } }
  });

describe("用户消息媒体附件", () => {
  it("正文过滤视频 XML，在正文上方显示可播放的缩略块", async () => {
    const wrapper = mountMessage([
      {
        type: "text",
        text: `<editor-context>内部上下文</editor-context><user-message>看下这个视频</user-message>${buildVideoAttachmentXml(video)}`
      }
    ]);
    expect(wrapper.find(".bubble").text()).toBe("看下这个视频");
    expect(wrapper.find(".bubble").element.firstElementChild?.className).toBe("attachment-grid");
    expect(wrapper.find(".thumb-video").attributes("src")).toBe(video.url);
    await wrapper.find(".thumb-video-button").trigger("click");
    expect(wrapper.find(".attachment-video-preview").attributes("src")).toBe(video.url);
    expect(wrapper.find(".attachment-video-preview").attributes()).toHaveProperty("controls");
    wrapper.unmount();
  });

  it("纯视频消息仅显示附件预览，不显示 XML 或 URL 正文", () => {
    const wrapper = mountMessage([{ type: "text", text: buildVideoAttachmentXml(video) }]);
    expect(wrapper.find(".thumb-video").exists()).toBe(true);
    expect(wrapper.find(".text-seg").exists()).toBe(false);
    expect(wrapper.text()).not.toContain(video.url);
    wrapper.unmount();
  });

  it("历史消息中的旧格式视频也显示为缩略块", () => {
    const wrapper = mountMessage([
      { type: "text", text: "<user-message>看看视频</user-message>" },
      { type: "text", text: `\n\n视频素材：${video.filename}\n${video.url}` }
    ]);
    expect(wrapper.find(".bubble").text()).toBe("看看视频");
    expect(wrapper.find(".thumb-video").attributes("src")).toBe(video.url);
    wrapper.unmount();
  });

  it("混合图片视频维持附件顺序，打开后可以左右切换", async () => {
    const wrapper = mountMessage([
      { type: "file", filename: "first.png", mediaType: "image/png", url: "https://assets.example.com/first.png" },
      { type: "text", text: buildVideoAttachmentXml(video) },
      { type: "file", filename: "second.png", mediaType: "image/png", url: "https://assets.example.com/second.png" }
    ]);
    const previews = wrapper.findAll(".media-preview");
    expect(previews).toHaveLength(3);
    expect(previews[1].find(".thumb-video").exists()).toBe(true);
    await wrapper.findAllComponents(ElImage)[1].trigger("click");
    expect(wrapper.find(".attachment-image-preview").attributes("src")).toBe("https://assets.example.com/second.png");
    expect(wrapper.find(".media-gallery-navigation").text()).toContain("3 / 3");
    await wrapper.find('[aria-label="上一个素材"]').trigger("click");
    expect(wrapper.find(".attachment-video-preview").attributes("src")).toBe(video.url);
    wrapper.unmount();
  });
});
