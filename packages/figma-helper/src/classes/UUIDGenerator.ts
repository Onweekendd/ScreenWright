/**
 * UUIDGenerator 工具类
 * 负责 UUID 和文件名生成
 */

export class UUIDGenerator {
  /**
   * 生成 UUID v4
   */
  static generate(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 生成导出图片文件名
   */
  static generateFileName(): string {
    return `figma-${UUIDGenerator.generate()}.png`;
  }
}
