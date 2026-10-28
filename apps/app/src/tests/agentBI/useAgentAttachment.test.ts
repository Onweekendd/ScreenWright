import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { upload } = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("@screenwright/server/rpc", () => ({
  apiClient: { customApi: { "chat-images": { upload: { $post: upload } } } }
}));
vi.mock("@/utils/utils", () => ({ uuid: () => crypto.randomUUID() }));

import { useAgentAttachment } from "@/views/build/components/agentBI/hooks/attachment/useAgentAttachment";

const libraryImage = { filename: "背景.png", mediaType: "image/png", url: "https://assets.example.com/background.png" };
const createObjectURL = vi.fn(() => "blob:local-image");
const revokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    }
  );
  upload.mockResolvedValue({
    json: async () => ({ success: true, data: { url: "https://assets.example.com/chat-images/local.png" } })
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("聊天媒体附件", () => {
  it("素材库图片可直接发送，无需再次上传", async () => {
    const attachment = useAgentAttachment();
    attachment.addMedia(libraryImage);
    expect(attachment.attachments.value[0]).toMatchObject({ previewUrl: libraryImage.url, status: "pending" });
    expect(await attachment.uploadAllAndGetParts("thread-1")).toEqual([{ ...libraryImage, type: "file" }]);
    expect(upload).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("混合发送素材库和本地图片，仅上传本地文件", async () => {
    const attachment = useAgentAttachment();
    const file = new File(["png"], "local.png", { type: "image/png" });
    attachment.addMedia(libraryImage);
    attachment.addFiles([file]);
    const parts = await attachment.uploadAllAndGetParts("thread-1");
    expect(upload).toHaveBeenCalledWith({ form: { conversationId: "thread-1", file } });
    expect(parts).toEqual([
      { ...libraryImage, type: "file" },
      {
        filename: "local.png",
        mediaType: "image/png",
        type: "file",
        url: "https://assets.example.com/chat-images/local.png"
      }
    ]);
  });

  it("删除和清空时只释放本地预览 URL", () => {
    const attachment = useAgentAttachment();
    attachment.addMedia(libraryImage);
    attachment.removeAttachment(attachment.attachments.value[0].id);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    attachment.addMedia(libraryImage);
    attachment.addFiles([new File(["png"], "local.png", { type: "image/png" })]);
    attachment.clearAttachments();
    expect(revokeObjectURL.mock.calls).toEqual([["blob:local-image"]]);
    expect(attachment.attachments.value).toEqual([]);
  });

  it("跳过图片、视频以外的文件和缺少地址的素材", () => {
    const attachment = useAgentAttachment();
    attachment.addFiles([new File(["pdf"], "document.pdf", { type: "application/pdf" })]);
    attachment.addMedia({ ...libraryImage, mediaType: "audio/mpeg" });
    attachment.addMedia({ ...libraryImage, url: "" });
    expect(attachment.attachments.value).toEqual([]);
  });

  it("本地上传失败不会阻止素材库图片生成消息附件", async () => {
    upload.mockRejectedValueOnce(new Error("offline"));
    const attachment = useAgentAttachment();
    attachment.addFiles([new File(["png"], "local.png", { type: "image/png" })]);
    attachment.addMedia(libraryImage);
    expect(await attachment.uploadAllAndGetParts()).toEqual([{ ...libraryImage, type: "file" }]);
    expect(attachment.attachments.value[0].status).toBe("error");
  });

  it("素材库视频生成 XML 附件描述，不生成视频文件 part", async () => {
    const attachment = useAgentAttachment();
    attachment.addMedia({
      filename: "瀑布.mp4",
      mediaType: "video/mp4",
      url: "https://assets.example.com/waterfall.mp4"
    });
    const parts = await attachment.uploadAllAndGetParts();
    expect(parts).toEqual([
      {
        type: "text",
        text: '<attached-videos>\n  <video filename="瀑布.mp4" media-type="video/mp4" url="https://assets.example.com/waterfall.mp4" />\n</attached-videos>'
      }
    ]);
    expect(upload).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("本地视频可在上传前预览，发送时使用服务器 URL，清空时释放本地预览", async () => {
    const url = "https://assets.example.com/chat-images/local.mp4";
    upload.mockResolvedValueOnce({ json: async () => ({ success: true, data: { url } }) });
    const attachment = useAgentAttachment();
    const file = new File(["video"], "local.mp4", { type: "video/mp4" });
    attachment.addFiles([file]);
    expect(attachment.attachments.value[0]).toMatchObject({
      filename: "local.mp4",
      status: "pending",
      previewUrl: "blob:local-image"
    });
    expect(await attachment.uploadAllAndGetParts("thread-video")).toEqual([
      {
        type: "text",
        text: `<attached-videos>\n  <video filename="local.mp4" media-type="video/mp4" url="${url}" />\n</attached-videos>`
      }
    ]);
    expect(upload).toHaveBeenCalledWith({ form: { conversationId: "thread-video", file } });
    expect(attachment.attachments.value[0].remoteUrl).toBe(url);
    attachment.clearAttachments();
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:local-image");
  });

  it("没有 MIME 类型的本地 MKV 文件仍能上传为视频", async () => {
    const attachment = useAgentAttachment();
    attachment.addFiles([new File(["video"], "local.MKV")]);
    expect(attachment.attachments.value[0].mediaType).toBe("video/x-matroska");
    await attachment.uploadAllAndGetParts();
    expect(upload.mock.calls[0][0].form.file.type).toBe("video/x-matroska");
  });
});
