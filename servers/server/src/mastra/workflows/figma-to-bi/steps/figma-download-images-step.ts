import { createStep } from "@mastra/core/workflows";
import fs from "fs";
import path from "path";
import { z } from "zod";

import type { ImageCandidate } from "@/mastra/state";
import { workflowStateRegistry } from "@/mastra/state";
import { StepEnum } from "@/mastra/types";
import { figmaFileSchema, figmaImageSchema } from "@/mastra/types/figma-type";

/**
 * 下载的图片信息
 */
export interface DownloadedImage {
  nodeId: string;
  filePath: string;
  dimensions: {
    width: number;
    height: number;
  };
  wasCropped: boolean;
}

// ============================================================
// Mastra Step: 图片下载步骤
// ============================================================

export const outputSchema = z.object({
  success: z.boolean().describe("下载是否成功"),
  totalDownloaded: z.number().describe("成功下载的文件数"),
  totalFailed: z.number().describe("失败的文件数"),
  downloadedImages: z.array(figmaImageSchema).describe("下载成功的图片信息"),
  failedNodes: z
    .array(
      z.object({
        nodeId: z.string(),
        fileName: z.string(),
        error: z.string()
      })
    )
    .describe("下载失败的节点"),
  message: z.string().describe("摘要信息")
});

/**
 * Mastra Step: 从 Figma 下载图片资源
 *
 * 此步骤接收图片节点配置，仅复用本地已有图片资源。
 * 如果节点在本地 mapping.json 中找不到，则跳过该节点（不从 Figma 下载）。
 */
export const figmaDownloadImagesStep = createStep({
  id: StepEnum.FIGMA_DOWNLOAD_IMAGES,
  description: "从 Figma 下载图片资源到本地（支持多 fileKey 分组下载）",
  inputSchema: z.any(),
  outputSchema,
  stateSchema: z.object({
    fileKey: z.string().optional().describe("Figma 文件 Key"),
    figmaFile: figmaFileSchema.describe("Figma 文件数据"),
    workflowId: z.string().describe("工作流唯一 ID，格式: YYYYMMDD_HHmmss_uuid")
  }),
  execute: async ({ state }) => {
    const { imageCandidatesState } = workflowStateRegistry.get(state.workflowId);

    console.log(`[FigmaDownloadImages] 开始下载图片资源`);

    // 获取所有图片候选
    const candidates = imageCandidatesState.getAllCandidates();
    console.log(`[FigmaDownloadImages] 图片候选数: ${candidates.length}`);

    // 加载已导出的图片映射
    console.log(`[FigmaDownloadImages] process.cwd() = ${process.cwd()}`);
    console.log(`[FigmaDownloadImages] __dirname = ${__dirname}`);

    // 尝试多个可能的路径
    const possiblePaths = [
      path.join(process.cwd(), "resources/mapping.json"), // cwd 是 public 目录
      path.join(process.cwd(), "src/mastra/public/resources/mapping.json"), // cwd 是 Screenwright 目录
      path.join(process.cwd(), "servers/server/src/mastra/public/resources/mapping.json"), // cwd 是项目根目录
      path.join(__dirname, "../../src/mastra/public/resources/mapping.json") // 从编译输出目录
    ];

    let resourceMappingPath = "";
    let resourceDir = "";

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        resourceMappingPath = testPath;
        resourceDir = path.dirname(testPath);
        console.log(`[FigmaDownloadImages] 找到资源映射: ${resourceMappingPath}`);
        break;
      }
    }

    let resourceMapping: Record<string, string> = {};
    try {
      if (resourceMappingPath && fs.existsSync(resourceMappingPath)) {
        const mappingContent = fs.readFileSync(resourceMappingPath, "utf-8");
        resourceMapping = JSON.parse(mappingContent);
        console.log(`[FigmaDownloadImages] 加载资源映射: ${Object.keys(resourceMapping).length} 个节点`);
        console.log(`[FigmaDownloadImages] 资源目录: ${resourceDir}`);
      } else {
        console.warn(`[FigmaDownloadImages] 资源映射文件不存在，尝试的路径:`, possiblePaths);
      }
    } catch (error) {
      console.warn(`[FigmaDownloadImages] 加载资源映射失败:`, error);
    }

    const { workflowId } = state;

    // 分离已有资源和需要下载的候选
    const reusableCandidates: ImageCandidate[] = [];
    const downloadCandidates: ImageCandidate[] = [];

    // 构建后缀索引：按 mapping key 中分号后的组件属性 ID 快速查找
    // Figma 文件更新后实例 ID 可能变化，但组件属性 ID 保持不变
    const suffixIndex = new Map<string, string>(); // suffix → fileName
    for (const [key, fileName] of Object.entries(resourceMapping)) {
      if (key.includes(";")) {
        const suffix = key.slice(key.indexOf(";") + 1);
        if (!suffixIndex.has(suffix)) {
          suffixIndex.set(suffix, fileName);
        }
      }
    }

    /**
     * 在 mapping 中查找节点对应的文件名，支持四种匹配方式：
     * 1. 精确匹配
     * 2. 将 - 替换为 : 后精确匹配
     * 3. 复合 ID（I{实例};{组件属性}）→ 按组件属性后缀匹配缓存中的同组件
     * 4. 简单 ID → 作为后缀在复合 mapping key 中反向匹配（如 435:2921 命中 I614:2260;435:2921）
     */
    function findMappedFileName(nodeId: string): string | undefined {
      const normalizedId = nodeId.replace(/-/g, ":");
      if (resourceMapping[nodeId]) {
        return resourceMapping[nodeId];
      }
      if (resourceMapping[normalizedId]) {
        return resourceMapping[normalizedId];
      }
      // 复合 ID：按分号后缀匹配
      if (nodeId.includes(";")) {
        const suffix = nodeId.slice(nodeId.indexOf(";") + 1);
        const suffixFileName = suffixIndex.get(suffix);
        if (suffixFileName) {
          console.log(`[FigmaDownloadImages] 后缀匹配: ${nodeId} → ${suffixFileName}（后缀: ${suffix}）`);
          return suffixFileName;
        }
      } else {
        // 简单 ID：作为组件属性 ID 在复合 key 中反向查找
        const reverseFileName = suffixIndex.get(normalizedId);
        if (reverseFileName) {
          console.log(`[FigmaDownloadImages] 反向后缀匹配: ${nodeId} → ${reverseFileName}`);
          return reverseFileName;
        }
      }
      return undefined;
    }

    // 调试：打印前5个候选节点和前5个mapping key
    console.log(
      `[FigmaDownloadImages] 候选节点示例 (前5个):`,
      candidates.slice(0, 5).map((c) => c.nodeId)
    );
    console.log(`[FigmaDownloadImages] Mapping key 示例 (前5个):`, Object.keys(resourceMapping).slice(0, 5));

    for (const candidate of candidates) {
      if (findMappedFileName(candidate.nodeId)) {
        reusableCandidates.push(candidate);
      } else {
        downloadCandidates.push(candidate);
      }
    }

    console.log(
      `[FigmaDownloadImages] 资源复用: ${reusableCandidates.length} 个, 需下载: ${downloadCandidates.length} 个`
    );

    // 合并所有结果
    const allDownloadedImages: z.infer<typeof figmaImageSchema>[] = [];
    const allFailedNodes: Array<{ nodeId: string; fileName: string; error: string }> = [];
    let totalDownloaded = 0;
    let totalFailed = 0;

    // 1. 处理可复用的资源
    const targetDir = path.join(process.cwd(), `workspace/${workflowId}/assets`);
    fs.mkdirSync(targetDir, { recursive: true });

    for (const candidate of reusableCandidates) {
      const sourceFileName = findMappedFileName(candidate.nodeId);

      if (!sourceFileName) {
        console.warn(`[FigmaDownloadImages] 节点 ${candidate.nodeId} 在 mapping 中找不到对应的文件名`);
        allFailedNodes.push({
          nodeId: candidate.nodeId,
          fileName: candidate.fileName,
          error: "在 mapping 中找不到对应的文件名"
        });
        totalFailed++;
        continue;
      }

      const sourcePath = path.join(resourceDir, sourceFileName);
      const targetPath = path.join(targetDir, sourceFileName);

      try {
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, targetPath);
          allDownloadedImages.push({
            nodeId: candidate.nodeId,
            filePath: targetPath,
            dimensions: { width: 0, height: 0 }, // 复用的图片不需要尺寸信息
            wasCropped: false
          });
          totalDownloaded++;
          console.log(`[FigmaDownloadImages] 复用资源: ${candidate.nodeId} → ${sourceFileName}`);
        } else {
          console.warn(`[FigmaDownloadImages] 资源文件不存在: ${sourcePath}`);
          allFailedNodes.push({
            nodeId: candidate.nodeId,
            fileName: candidate.fileName,
            error: "资源文件不存在"
          });
          totalFailed++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[FigmaDownloadImages] 复用资源失败: ${candidate.nodeId}`, errorMessage);
        allFailedNodes.push({
          nodeId: candidate.nodeId,
          fileName: candidate.fileName,
          error: errorMessage
        });
        totalFailed++;
      }
    }

    // 返回合并后的结果
    const message = `
        下载完成：
        ================================
        总计：${candidates.length} 个文件
          - 成功：${totalDownloaded} 个（复用本地资源）
          - 失败：${totalFailed} 个（本地不存在，跳过下载）
        资源复用：${reusableCandidates.length} 个
        跳过下载：${downloadCandidates.length} 个
      `;

    return {
      success: totalFailed === 0,
      totalDownloaded,
      totalFailed,
      downloadedImages: allDownloadedImages,
      failedNodes: allFailedNodes,
      message: message.trim()
    };
  }
});
