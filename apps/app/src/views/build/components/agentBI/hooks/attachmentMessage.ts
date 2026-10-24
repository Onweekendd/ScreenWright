import { getAttachmentMediaType, type MediaAttachment } from "./attachmentMedia";

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** 视频 URL 留在文本中供 Agent 使用，界面将此 XML 转为附件预览。 */
export const buildVideoAttachmentXml = (media: MediaAttachment): string =>
  `<attached-videos>\n  <video filename="${escapeAttribute(media.filename)}" media-type="${escapeAttribute(media.mediaType)}" url="${escapeAttribute(media.url)}" />\n</attached-videos>`;

export const parseVideoAttachments = (text: string): { text: string; videos: MediaAttachment[] } => {
  const videos: MediaAttachment[] = [];
  let visibleText = text.replace(/<attached-videos>[\s\S]*?<\/attached-videos>/g, (block) => {
    const document = new DOMParser().parseFromString(block, "application/xml");
    if (document.querySelector("parsererror")) {
      return block;
    }
    for (const video of Array.from(document.querySelectorAll("video"))) {
      const url = video.getAttribute("url");
      const filename = video.getAttribute("filename") || "视频";
      const mediaType = video.getAttribute("media-type") || getAttachmentMediaType(filename) || "video/mp4";
      if (url && mediaType.startsWith("video/")) {
        videos.push({ filename, mediaType, url });
      }
    }
    return "";
  });

  // 兼容已发送的旧格式，让历史消息也能显示缩略块。
  visibleText = visibleText.replace(
    /(?:^|\n\s*\n)视频素材：([^\r\n]+)\r?\n(https?:\/\/[^\s<>]+)/g,
    (_, filename: string, url: string) => {
      videos.push({
        filename,
        url,
        mediaType: getAttachmentMediaType(filename) || getAttachmentMediaType(url) || "video/mp4"
      });
      return "";
    }
  );
  return { text: visibleText, videos };
};
