import type { CameraState } from "./Viewport";

/**
 * 相机位置的持久化编解码（只管字符串 ↔ 相机，读写存储由调用方负责）。
 *
 * 存储里的东西不可信：用户清过站点数据、版本升级后字段变过、被别的页面写坏过，
 * 读出来可能是任何东西。解析失败一律返回 null，让调用方回落到默认的适配视角，
 * 绝不能抛错把画布卡住，更不能把 NaN 塞进相机。
 */

/** 序列化。坐标取整到 0.01 px，没有必要存浮点尾巴 */
export const serializeCamera = (camera: CameraState): string =>
  JSON.stringify({
    x: Math.round(camera.x * 100) / 100,
    y: Math.round(camera.y * 100) / 100,
    zoom: Math.round(camera.zoom * 10000) / 10000
  });

/** 反序列化；内容不合法（不是 JSON、缺字段、非有限数、缩放 ≤ 0）返回 null */
export const parseCamera = (raw: string | null | undefined): CameraState | null => {
  if (!raw) {
    return null;
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const { x, y, zoom } = value as Record<string, unknown>;
  if (typeof x !== "number" || typeof y !== "number" || typeof zoom !== "number") {
    return null;
  }
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(zoom) || zoom <= 0) {
    return null;
  }
  return { x, y, zoom };
};
