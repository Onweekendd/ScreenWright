import imageCompression from "browser-image-compression";
import { ElLoading } from "element-plus";

import { handleMessageBox } from "./messageBox";

function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, {
    type: blob.type,
    lastModified: Date.now()
  });
}

/**
 * 批量压缩图片：未超过 maxSizeMB 直接返回原图；超过则先征得用户确认，
 * WebWorker 压缩失败时降级主线程压缩，仍失败则返回原图（不阻断上传流程）。
 */
export const batchCompressPic = async (file: File, maxSizeMB: number = 4): Promise<File> => {
  const options = {
    maxSizeMB,
    maxWidthOrHeight: 4096,
    initialQuality: 0.8,
    maxIteration: 15,
    useWebWorker: true
  };

  if (file.size / 1024 / 1024 <= maxSizeMB) {
    return file;
  }

  const loadingInstance = ElLoading.service({ fullscreen: true, text: "压缩中..." });
  const isCompression = await handleMessageBox(`当前${file.name} 大于${maxSizeMB}MB,是否压缩图片`, {
    confirmButtonText: "是",
    cancelButtonText: "否"
  });

  if (!isCompression) {
    loadingInstance.close();
    return file;
  }

  try {
    const res = await imageCompression(file, options);
    loadingInstance.close();
    return blobToFile(res, file.name);
  } catch (error) {
    console.warn("图片压缩(WebWorker)失败，尝试降级主线程压缩:", error);
    try {
      const res = await imageCompression(file, {
        ...options,
        useWebWorker: false
      });
      loadingInstance.close();
      return blobToFile(res, file.name);
    } catch (fallbackError) {
      console.error("图片压缩失败，返回原图:", fallbackError);
      loadingInstance.close();
      return file;
    }
  }
};
