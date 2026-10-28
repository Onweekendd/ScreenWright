export interface MediaAttachment {
  filename: string;
  mediaType: string;
  url: string;
}

const MEDIA_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  avif: "image/avif",
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  wmv: "video/x-ms-wmv",
  flv: "video/x-flv",
  mpg: "video/mpeg",
  mpeg: "video/mpeg",
  ogv: "video/ogg",
  ts: "video/mp2t"
};

/** 部分本地视频没有 MIME 类型，使用文件后缀补全。 */
export const getAttachmentMediaType = (name: string, mediaType = ""): string | undefined => {
  if (mediaType.startsWith("image/") || mediaType.startsWith("video/")) {
    return mediaType;
  }
  const extension = name.split(/[?#]/)[0].split(".").pop()?.toLowerCase() ?? "";
  return Object.hasOwn(MEDIA_TYPES, extension) ? MEDIA_TYPES[extension] : undefined;
};
