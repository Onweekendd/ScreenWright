import { describe, expect, it, vi } from "vitest";

import { defineComponent } from "vue";
import { shallowMount } from "@vue/test-utils";

vi.mock("@screenwright/server/rpc", () => ({ apiClient: {} }));
vi.mock("@/components/Icon/index.vue", () => ({ default: { template: "<span />" } }));

import type { V5ToolPart } from "@/views/build/components/agentBI/components/AssistantMessage.vue";
import ToolCallPart from "@/views/build/components/agentBI/components/ToolCallPart.vue";

const ElImage = defineComponent({
  name: "ElImage",
  props: { src: String, previewSrcList: Array },
  template: "<img :src='src' />"
});
const ElDialog = defineComponent({
  name: "ElDialog",
  props: { modelValue: Boolean, width: String },
  emits: ["update:modelValue"],
  template: "<div v-if='modelValue'><slot /></div>"
});
const part = (output: unknown, state: V5ToolPart["state"] = "output-available"): V5ToolPart => ({
  type: "tool-searchMediaAssetsTool",
  toolCallId: "collect-1",
  input: {},
  state,
  output
});
const mount = (value: V5ToolPart) =>
  shallowMount(ToolCallPart, {
    props: { part: value },
    global: { stubs: { MediaAttachmentPreview: false, ElImage, ElDialog } }
  });

describe("联网素材工具预览", () => {
  it("多图片和视频可以连续翻页，切换视频时重新创建播放器", async () => {
    const wrapper = mount(
      part({
        assets: [
          { type: "image", title: "草原", url: "http://platform/image.png" },
          { type: "video", title: "视频一", url: "http://platform/one.mp4" },
          { type: "video", title: "视频二", url: "http://platform/two.mp4" }
        ]
      })
    );
    await wrapper.findAll(".thumb-video-button")[1].trigger("click");
    expect(wrapper.find(".media-gallery-navigation").text()).toContain("3 / 3");
    const previousPlayer = wrapper.find("video[controls]").element;
    await wrapper.find('[aria-label="上一个素材"]').trigger("click");
    expect(wrapper.find("video[controls]").attributes("src")).toBe("http://platform/one.mp4");
    expect(wrapper.find("video[controls]").element).not.toBe(previousPlayer);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find("video[controls]").exists()).toBe(false);
    expect(wrapper.find(".attachment-image-preview").attributes("src")).toBe("http://platform/image.png");
    await wrapper.find('[aria-label="上一个素材"]').trigger("click");
    expect(wrapper.find("video[controls]").attributes("src")).toBe("http://platform/two.mp4");
    wrapper.findComponent(ElDialog).vm.$emit("update:modelValue", false);
    await wrapper.vm.$nextTick();
    expect(wrapper.find("video[controls]").exists()).toBe(false);
    wrapper.unmount();
  });

  it("弹窗根据视频实际比例收窄或展开，单个素材不显示翻页按钮", async () => {
    const wrapper = mount(part({ assets: [{ type: "video", url: "http://platform/portrait.mp4" }] }));
    const thumbnail = wrapper.find(".thumb-video");
    Object.defineProperties(thumbnail.element, {
      videoWidth: { value: 1080 },
      videoHeight: { value: 1920 }
    });
    await thumbnail.trigger("loadedmetadata");
    await wrapper.find(".thumb-video-button").trigger("click");
    expect(wrapper.findComponent(ElDialog).props("width")).toContain("68vh * 0.5625");
    expect(wrapper.find(".media-gallery-navigation").exists()).toBe(false);
    const player = wrapper.find("video[controls]");
    Object.defineProperties(player.element, {
      videoWidth: { value: 1920 },
      videoHeight: { value: 1080 }
    });
    await player.trigger("loadedmetadata");
    expect(wrapper.findComponent(ElDialog).props("width")).toContain(`68vh * ${1920 / 1080}`);
    wrapper.unmount();
  });

  it("后台占位替换为结果后显示预览，点击视频可以播放", async () => {
    const wrapper = mount(part("Background task started. Task ID: task-1"));
    await wrapper.setProps({
      part: part({ assets: [{ type: "video", title: "草原", url: "http://platform/stable.mp4" }] })
    });
    expect(wrapper.findAll(".media-preview")).toHaveLength(1);
    await wrapper.find(".thumb-video-button").trigger("click");
    expect(wrapper.find("video[controls]").attributes("src")).toBe("http://platform/stable.mp4");
    wrapper.unmount();
  });

  it("图片和视频结果以小缩略块展示，使用转存后的地址", () => {
    const wrapper = mount(
      part({
        assets: [
          { type: "image", title: "草原", url: "http://platform/stable.png", contentType: "image/png" },
          { type: "video", title: "瀑布", url: "http://platform/stable.mp4", contentType: "video/mp4" }
        ]
      })
    );
    expect(wrapper.findAll(".media-preview")).toHaveLength(2);
    expect(wrapper.findComponent(ElImage).props("src")).toBe("http://platform/stable.png");
    expect(wrapper.find(".thumb-video").attributes("src")).toBe("http://platform/stable.mp4");
    wrapper.unmount();
  });

  it("后台占位不伪造素材，人工验证提示在结果返回后展示", () => {
    const waiting = mount(part("Background task started. Task ID: task-1"));
    expect(waiting.find(".tool-call__collected-assets").exists()).toBe(false);
    waiting.unmount();
    const required = mount(part({ assets: [], note: "需要完成登录验证" }));
    expect(required.find(".tool-call__collection-note").text()).toBe("需要完成登录验证");
    required.unmount();
  });
});
