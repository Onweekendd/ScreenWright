import sharp from "sharp";

/** 读图片的宽高；不是可解码的图片时返回 null */
export const imageSize = async (bytes: Buffer | Uint8Array): Promise<{ width: number; height: number } | null> => {
  try {
    const { width, height } = await sharp(bytes).metadata();
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
};

/**
 * 等比缩小到长边 ≤ maxEdge 并转 JPEG（已经更小的不放大）。
 * 给两处共用：生图的参考图（方舟对大参考图会断连）、发给主模型看的工具图（请求体有上限，
 * 而且模型每张图的 token 封顶，超出的分辨率白发）。解码失败直接抛，由调用方决定怎么兜底。
 */
export const shrinkToJpeg = (bytes: Buffer | Uint8Array, maxEdge: number): Promise<Buffer> =>
  sharp(bytes)
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
