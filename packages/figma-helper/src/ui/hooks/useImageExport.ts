import { ref, computed, type Ref } from "vue";
import JSZip from "jszip";
import type { PluginMessage, NodeInfo, UIMessage } from "../../types";

declare const __API_BASE__: string;
const baseAPI = __API_BASE__;

const pendingRequests = new Map<string, { resolve: (r: { ok: boolean; status: number; body: string }) => void }>();

function sandboxFetch(
  postMessage: (msg: import("../../types").PluginMessage) => void,
  url: string,
  options: { method: string; headers?: Record<string, string>; body?: string }
): Promise<{ ok: boolean; status: number; json: () => unknown }> {
  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).slice(2);
    pendingRequests.set(requestId, {
      resolve: (r) =>
        resolve({
          ok: r.ok,
          status: r.status,
          json: () => {
            try {
              return JSON.parse(r.body);
            } catch {
              return { message: r.body };
            }
          }
        })
    });
    postMessage({ type: "httpRequest", requestId, url, ...options });
  });
}

export function useImageExport(
  postMessage: (msg: PluginMessage) => void,
  onMessage: (handler: (msg: UIMessage) => void) => () => void,
  selectedNodes: Ref<NodeInfo[]>,
  isRootNode: Ref<boolean>,
  showToast: (msg: string) => void
) {
  // Image nodes
  const imageNodes = ref<NodeInfo[]>([]);
  const imageSearch = ref("");
  const filteredImageNodes = computed(() => {
    const q = imageSearch.value.trim().toLowerCase();
    if (!q) return imageNodes.value;
    return imageNodes.value.filter((n) => n.name.toLowerCase().includes(q) || n.id.includes(q));
  });

  // ZIP export
  const exporting = ref(false);
  const exportProgress = ref<{ current: number; total: number } | null>(null);
  const exportedImages = ref<{ nodeId: string; fileName: string; bytes: number[] }[]>([]);
  const exportZip = ref<JSZip | null>(null);
  const exportMapping = ref<Record<string, string>>({});

  // Minio upload
  const uploadingToMinio = ref(false);
  const minioProgress = ref<{ current: number; total: number } | null>(null);
  const minioFileKey = ref("");
  const minioExportedImages = ref<{ nodeId: string; fileName: string; bytes: number[] }[]>([]);

  // Node data upload
  const simplifying = ref(false);
  const projectName = ref("");

  function exportImages() {
    const nodes = filteredImageNodes.value;
    if (nodes.length === 0) return;
    exporting.value = true;
    exportProgress.value = { current: 0, total: nodes.length };
    exportedImages.value = [];
    exportZip.value = new JSZip();
    exportMapping.value = {};
    postMessage({ type: "exportImages", nodeIds: nodes.map((n) => n.id) });
  }

  async function handleExportImageData(items: { nodeId: string; fileName: string; bytes: number[] }[]) {
    for (const item of items) {
      exportedImages.value.push(item);
      exportZip.value!.file(item.fileName, new Uint8Array(item.bytes));
      exportMapping.value[item.nodeId] = item.fileName;
    }

    const total = exportProgress.value?.total || 0;
    if (exportedImages.value.length >= total) {
      exportZip.value!.file("mapping.json", JSON.stringify(exportMapping.value, null, 2));
      const blob = await exportZip.value!.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "figma-images.zip";
      a.click();
      URL.revokeObjectURL(url);

      exporting.value = false;
      exportProgress.value = null;
      showToast(`已导出 ${exportedImages.value.length} 张图片`);
      exportedImages.value = [];
      exportZip.value = null;
      exportMapping.value = {};
    }
  }

  function exportImagesToMinio() {
    const nodes = filteredImageNodes.value;
    if (nodes.length === 0) return;
    uploadingToMinio.value = true;
    minioProgress.value = { current: 0, total: nodes.length };
    minioExportedImages.value = [];
    minioFileKey.value = "";
    postMessage({ type: "exportImagesForMinio", nodeIds: nodes.map((n) => n.id) });
  }

  async function handleMinioImageData(items: { nodeId: string; fileName: string; bytes: number[] }[]) {
    const nodes = filteredImageNodes.value;
    const fileKey = minioFileKey.value;

    for (const item of items) {
      minioExportedImages.value.push(item);
      const nodeName = nodes.find((n) => n.id === item.nodeId)?.name ?? item.fileName;

      try {
        const res = await sandboxFetch(postMessage, `${baseAPI}/figma-node-assets/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodeId: item.nodeId, nodeName, fileKey, bytes: item.bytes })
        });
        if (!res.ok) {
          const err = res.json() as { message?: string };
          console.error(`[Minio] 上传失败 ${item.nodeId}:`, err.message);
        }
      } catch (e) {
        console.error(`[Minio] 请求异常 ${item.nodeId}:`, e);
      }

      if (minioProgress.value) {
        minioProgress.value = { ...minioProgress.value, current: minioExportedImages.value.length };
      }
      postMessage({ type: "minioUploadNext" });
    }
  }

  function simplifyNodeData() {
    if (selectedNodes.value.length !== 1) return;
    simplifying.value = true;
    postMessage({ type: "getNodeRawData", nodeId: selectedNodes.value[0].id });
  }

  async function handleSimplifyResult(fileKey: string | null, nodeId: string, bytes: number[]) {
    const effectiveFileKey = fileKey || extractFileKeyFromUrl();
    if (!effectiveFileKey) {
      showToast("获取 Figma fileKey 失败，无法简化");
      simplifying.value = false;
      return;
    }
    try {
      const fileContent = new TextDecoder().decode(new Uint8Array(bytes));
      const nodeName = projectName.value.trim();
      const boundary = `----FigmaBoundary${Date.now()}`;
      const body = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="nodeId"`,
        ``,
        nodeId,
        `--${boundary}`,
        `Content-Disposition: form-data; name="fileKey"`,
        ``,
        effectiveFileKey,
        `--${boundary}`,
        `Content-Disposition: form-data; name="nodeName"`,
        ``,
        nodeName,
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${nodeId}-raw.json"`,
        `Content-Type: application/json`,
        ``,
        fileContent,
        `--${boundary}--`
      ].join("\r\n");
      const res = await sandboxFetch(postMessage, `${baseAPI}/figma-node-assets/simplify-node-data`, {
        method: "POST",
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
        body
      });
      if (!res.ok) {
        const err = res.json() as { message?: string };
        showToast(`简化失败: ${err.message || "未知错误"}`);
      } else {
        showToast("节点数据简化并存储成功");
      }
    } catch (e) {
      showToast(`请求异常: ${e instanceof Error ? e.message : "网络错误"}`);
    } finally {
      simplifying.value = false;
    }
  }

  onMessage((msg) => {
    if (msg.type === "httpResponse") {
      const pending = pendingRequests.get(msg.requestId);
      if (pending) {
        pendingRequests.delete(msg.requestId);
        pending.resolve(msg);
      }
      return;
    }
    if (msg.type === "selectionChange") {
      imageNodes.value = [];
    }
    if (msg.type === "scanImageResult") {
      imageNodes.value = msg.nodes;
    }
    if (msg.type === "exportProgress") {
      exportProgress.value = { current: msg.current, total: msg.total };
      if (uploadingToMinio.value && minioProgress.value) {
        minioProgress.value = { ...minioProgress.value, current: msg.current };
        if (msg.current >= msg.total) {
          const uploadedCount = minioExportedImages.value.length;
          uploadingToMinio.value = false;
          minioProgress.value = null;
          minioExportedImages.value = [];
          const fk = minioFileKey.value;
          minioFileKey.value = "";
          showToast(`已上传 ${uploadedCount} 张图片到 Minio（文件夹: ${fk}）`);
        }
      }
    }
    if (msg.type === "exportImageData") {
      handleExportImageData(msg.items);
    }
    if (msg.type === "exportImagesForMinioData") {
      if (!minioFileKey.value) {
        minioFileKey.value = msg.fileKey || extractFileKeyFromUrl() || "";
      }
      handleMinioImageData(msg.items);
    }
    if (msg.type === "minioUploadSkipped") {
      showToast(msg.message);
    }
    if (msg.type === "getNodeRawDataResult") {
      handleSimplifyResult(msg.fileKey, msg.nodeId, msg.bytes);
    }
  });

  return {
    imageNodes,
    imageSearch,
    filteredImageNodes,
    exporting,
    exportProgress,
    uploadingToMinio,
    minioProgress,
    simplifying,
    projectName,
    exportImages,
    exportImagesToMinio,
    simplifyNodeData
  };
}

function extractFileKeyFromUrl(): string | null {
  try {
    const href = window.parent.location.href || document.referrer || "";
    const match = href.match(/figma\.com\/(?:design|file)\/([^/?&#]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

