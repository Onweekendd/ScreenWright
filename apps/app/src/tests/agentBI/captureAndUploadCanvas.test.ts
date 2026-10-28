import { beforeEach, describe, expect, it, vi } from "vitest";

const upload = vi.fn();
vi.mock("@screenwright/server/rpc", () => ({
  apiClient: { customApi: { "chat-images": { upload: { $post: (...args: unknown[]) => upload(...args) } } } }
}));
vi.mock("@/views/build/components/agentBI/hooks/capture/captureCanvasForAgent", () => ({
  captureCanvasForAgent: vi.fn()
}));

import { captureAndUploadCanvas } from "@/views/build/components/agentBI/hooks/capture/captureAndUploadCanvas";
import { captureCanvasForAgent } from "@/views/build/components/agentBI/hooks/capture/captureCanvasForAgent";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("复用画布截图上传", () => {
  it("把局部截图上传到当前会话，并保留画布坐标供 AI 理解", async () => {
    const file = new File(["shot"], "screenshot.jpg", { type: "image/jpeg" });
    const shot = {
      width: 400,
      height: 200,
      region: { x: 10, y: 20, width: 200, height: 100 },
      scale: 2,
      missingIds: []
    };
    vi.mocked(captureCanvasForAgent).mockResolvedValue({ file, ...shot });
    upload.mockResolvedValue({ json: async () => ({ success: true, data: { url: "http://platform/edited.jpg" } }) });
    const result = await captureAndUploadCanvas("conversation-1", { componentIds: [3] });
    expect(captureCanvasForAgent).toHaveBeenCalledWith({ componentIds: [3] });
    expect(upload).toHaveBeenCalledWith({ form: { conversationId: "conversation-1", file } });
    expect(result).toEqual({ ok: true, url: "http://platform/edited.jpg", ...shot });
  });

  it("截图不可用时不上传，返回独立的截图错误", async () => {
    vi.mocked(captureCanvasForAgent).mockRejectedValue(new Error("组件不可见"));
    expect(await captureAndUploadCanvas("conversation-1", { componentIds: [3] })).toEqual({
      ok: false,
      error: "组件不可见"
    });
    expect(upload).not.toHaveBeenCalled();
  });
});
