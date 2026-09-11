import { ref } from "vue";

import { apiClient } from "@screenwright/server/rpc";
import type { FileUIPart } from "ai";

import { uuid } from "@/utils/utils";

export interface AttachmentItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "done" | "error";
  remoteUrl?: string;
}

export function useAgentAttachment() {
  const attachments = ref<AttachmentItem[]>([]);

  /** 更新单个附件的部分字段，返回新数组以触发响应式 */
  const updateAttachment = (id: string, patch: Partial<AttachmentItem>) => {
    attachments.value = attachments.value.map((a) => (a.id === id ? { ...a, ...patch } : a));
  };

  /**
   * 上传单张图片到服务器，返回成功后的 FileUIPart，失败返回 null。
   * 上传过程中将附件状态切换为 `uploading`，结束后更新为 `done` 或 `error`。
   */
  const uploadFile = async (item: AttachmentItem, conversationId: string): Promise<FileUIPart | null> => {
    updateAttachment(item.id, { status: "uploading" });
    try {
      const res = await apiClient.customApi["chat-images"].upload.$post({
        form: { conversationId, file: item.file }
      });
      const data = await res.json();
      if (data.success) {
        updateAttachment(item.id, { remoteUrl: data.data.url, status: "done" });
        return {
          filename: item.file.name,
          mediaType: item.file.type,
          type: "file" as const,
          url: data.data.url
        };
      }
      updateAttachment(item.id, { status: "error" });
      return null;
    } catch {
      updateAttachment(item.id, { status: "error" });
      return null;
    }
  };

  /**
   * 将选中的文件加入附件列表（仅接受图片类型）。
   * 此时只生成本地预览 URL，不触发上传，上传在发送消息时统一发起。
   */
  const addFiles = (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      attachments.value = [...attachments.value, { file, id: uuid(), previewUrl, status: "pending" }];
    }
  };

  /**
   * 上传所有处于 `pending` 状态的附件，并发执行。
   * 返回上传成功的附件对应的 FileUIPart 列表，用于写入消息的 parts 字段。
   * @param threadId 关联的会话 ID，用于服务端归档存储；未传时自动生成临时 ID。
   */
  const uploadAllAndGetParts = async (threadId?: string): Promise<FileUIPart[]> => {
    const pending = attachments.value.filter((a) => a.status === "pending");
    if (pending.length === 0) {
      return [];
    }
    const conversationId = threadId ?? uuid();
    const results = await Promise.all(pending.map((item) => uploadFile(item, conversationId)));
    return results.filter((p): p is FileUIPart => p !== null);
  };

  /**
   * 从附件列表中移除指定附件，同时释放其本地预览 URL 占用的内存。
   */
  const removeAttachment = (id: string) => {
    const item = attachments.value.find((a) => a.id === id);
    if (item) {
      URL.revokeObjectURL(item.previewUrl);
    }
    attachments.value = attachments.value.filter((a) => a.id !== id);
  };

  /**
   * 清空所有附件并释放全部预览 URL，通常在消息发送后调用。
   */
  const clearAttachments = () => {
    attachments.value.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    attachments.value = [];
  };

  return {
    attachments,
    clearAttachments,
    uploadAllAndGetParts,

    addFiles,
    removeAttachment
  };
}
