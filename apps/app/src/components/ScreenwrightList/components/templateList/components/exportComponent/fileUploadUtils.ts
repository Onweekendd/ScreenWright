import md5 from "js-md5";

/**
 * 计算文件 MD5（支持超大文件）
 */
export const getFileFullMD5 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunkSize = 5 * 1024 * 1024; // 4MB 分段读取
    const hash = md5.create();
    const fileReader = new FileReader();
    let currentOffset = 0;

    // 读取下一段
    function readNext() {
      // 读取完成
      if (currentOffset >= file.size) {
        resolve(hash.hex());
        return;
      }
      // 切片读取
      const chunk = file.slice(currentOffset, currentOffset + chunkSize);
      fileReader.readAsArrayBuffer(chunk);
    }

    // 读取成功
    fileReader.onload = (e) => {
      hash.update(e.target!.result as ArrayBuffer);
      currentOffset += chunkSize;
      readNext();
    };

    // 读取失败
    fileReader.onerror = reject;

    // 开始
    readNext();
  });
};
/**
 * 切割文件为分片
 */
export const sliceFile = (file: File, chunkSize = 5 * 1024 * 1024): Blob[] => {
  const chunks: Blob[] = [];
  let pos = 0;
  while (pos < file.size) {
    chunks.push(file.slice(pos, pos + chunkSize));
    pos += chunkSize;
  }
  return chunks;
};
/**
 * 生成文件唯一 ID
 */
export function generateUniqueFileId(fileName: string): string {
  // 时间戳 + 随机字符串，保证绝对唯一
  const uniqueStr = `${fileName}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  // md5 加密成固定长度唯一 ID
  return md5(uniqueStr);
}
