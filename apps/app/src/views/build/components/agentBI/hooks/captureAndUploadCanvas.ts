import { apiClient, type ResumeData, type SuspendType } from "@screenwright/server/rpc";

import { type AgentCaptureRequest, captureCanvasForAgent } from "./captureCanvasForAgent";

/** 主动截图与编辑后的截图共用：包含裁剪、视频当前帧、上传及错误回执。 */
export async function captureAndUploadCanvas(
  sessionId: string,
  request: AgentCaptureRequest
): Promise<ResumeData<SuspendType.CaptureCanvas>> {
  try {
    const { file, ...shot } = await captureCanvasForAgent(request);
    const res = await apiClient.customApi["chat-images"].upload.$post({
      form: { conversationId: sessionId, file }
    });
    const data = await res.json();
    if (!data.success) {
      return { ok: false, error: "截图上传失败" };
    }
    return { ok: true, url: data.data.url, ...shot };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
