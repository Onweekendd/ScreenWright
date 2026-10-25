import { ref } from "vue";

import { apiClient } from "@screenwright/server/rpc";
import type { FileUIPart, TextUIPart } from "ai";

import { uuid } from "@/utils/utils";

import { getAttachmentMediaType, type MediaAttachment } from "./attachmentMedia";
import { buildVideoAttachmentXml } from "./attachmentMessage";

export type { MediaAttachment } from "./attachmentMedia";

export type AttachmentPart = FileUIPart | TextUIPart;

export interface AttachmentItem {
  id: string;
  file?: File;
  filename: string;
  mediaType: string;
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

  const toMessagePart = (item: AttachmentItem, url: string): AttachmentPart => {
    if (item.mediaType.startsWith("video/")) {
      return {
        type: "text",
        text: buildVideoAttachmentXml({ filename: item.filename, mediaType: item.mediaType, url })
      };
    }
    return { filename: item.filename, mediaType: item.mediaType, type: "file", url };
  };

  /**
   * 上传本地附件，图片保留文件 part，视频仅发送名称和 URL；失败返回 null。
   * 上传过程中将附件状态切换为 `uploading`，结束后更新为 `done` 或 `error`。
   */
  const uploadFile = async (item: AttachmentItem, conversationId: string): Promise<AttachmentPart | null> => {
    // 素材库已有访问地址，直接发送，无需下载和重复上传。
    if (item.remoteUrl) {
      updateAttachment(item.id, { status: "done" });
      return toMessagePart(item, item.remoteUrl);
    }
    if (!item.file) {
      return null;
    }
    updateAttachment(item.id, { status: "uploading" });
    try {
      const res = await apiClient.customApi["chat-images"].upload.$post({
        form: { conversationId, file: item.file }
      });
      const data = await res.json();
      if (data.success) {
        updateAttachment(item.id, { remoteUrl: data.data.url, status: "done" });
        return toMessagePart(item, data.data.url);
      }
      updateAttachment(item.id, { status: "error" });
      return null;
    } catch {
      updateAttachment(item.id, { status: "error" });
      return null;
    }
  };

  /**
   * 将选中的图片、视频加入附件列表。
   * 此时只生成本地预览 URL，不触发上传，上传在发送消息时统一发起。
   */
  const addFiles = (files: FileList | File[]) => {
    for (const originalFile of Array.from(files)) {
      const mediaType = getAttachmentMediaType(originalFile.name, originalFile.type);
      if (!mediaType) {
        continue;
      }
      const file =
        mediaType === originalFile.type
          ? originalFile
          : new File([originalFile], originalFile.name, {
              type: mediaType,
              lastModified: originalFile.lastModified
            });
      const previewUrl = URL.createObjectURL(file);
      attachments.value = [
        ...attachments.value,
        { file, filename: file.name, mediaType: file.type, id: uuid(), previewUrl, status: "pending" }
      ];
    }
  };

  /** 将素材库中已有的图片、视频加入待发送附件列表。 */
  const addMedia = (media: MediaAttachment) => {
    if (!media.url || !(media.mediaType.startsWith("image/") || media.mediaType.startsWith("video/"))) {
      return;
    }
    attachments.value = [
      ...attachments.value,
      {
        id: uuid(),
        filename: media.filename,
        mediaType: media.mediaType,
        previewUrl: media.url,
        remoteUrl: media.url,
        status: "pending"
      }
    ];
  };

  /**
   * 上传所有处于 `pending` 状态的附件，并发执行。
   * 返回图片文件和视频链接文本，用于写入消息的 parts 字段。
   * @param threadId 关联的会话 ID，用于服务端归档存储；未传时自动生成临时 ID。
   */
  const uploadAllAndGetParts = async (threadId?: string): Promise<AttachmentPart[]> => {
    const pending = attachments.value.filter((a) => a.status === "pending");
    if (pending.length === 0) {
      return [];
    }
    const conversationId = threadId ?? uuid();
    const results = await Promise.all(pending.map((item) => uploadFile(item, conversationId)));
    return results.filter((p): p is AttachmentPart => p !== null);
  };

  /**
   * 从附件列表中移除指定附件，同时释放其本地预览 URL 占用的内存。
   */
  const removeAttachment = (id: string) => {
    const item = attachments.value.find((a) => a.id === id);
    if (item?.file && item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    attachments.value = attachments.value.filter((a) => a.id !== id);
  };

  /**
   * 清空所有附件并释放全部预览 URL，通常在消息发送后调用。
   */
  const clearAttachments = () => {
    attachments.value.forEach((a) => {
      if (a.file && a.previewUrl) {
        URL.revokeObjectURL(a.previewUrl);
      }
    });
    attachments.value = [];
  };

  return {
    attachments,
    clearAttachments,
    uploadAllAndGetParts,

    addFiles,
    addMedia,
    removeAttachment
  };
}
