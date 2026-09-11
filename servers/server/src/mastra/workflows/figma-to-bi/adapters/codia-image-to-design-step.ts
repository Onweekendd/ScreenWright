import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { fetchChatImageBuffer } from "@/mastra/services/chat-image.server";
import { StepEnum } from "@/mastra/types";
import type { Data } from "@/mastra/types/codia";
import { formatErrorChain, retryWithBackoff } from "@/mastra/workflows/figma-to-bi/utils/async";

// CODIA_BASE_URL 即 image_to_design 的完整接口 URL（与 Postman 中一致），不再额外拼路径。
const CODIA_IMAGE_TO_DESIGN_URL = process.env.CODIA_BASE_URL ?? "https://api.codia.ai/v2/open/image_to_design";
const DEFAULT_CODIA_REQUEST_TIMEOUT_MS = 120_000;
const DEFAULT_CODIA_MAX_RETRIES = 3;
const MAX_ERROR_RESPONSE_LENGTH = 2_000;

const getCodiaRequestTimeoutMs = (): number => {
  const configuredTimeout = Number(process.env.CODIA_REQUEST_TIMEOUT_MS);
  return Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : DEFAULT_CODIA_REQUEST_TIMEOUT_MS;
};

const getCodiaMaxRetries = (): number => {
  const configuredMaxRetries = Number(process.env.CODIA_MAX_RETRIES);
  return Number.isInteger(configuredMaxRetries) && configuredMaxRetries > 0
    ? configuredMaxRetries
    : DEFAULT_CODIA_MAX_RETRIES;
};

const isTimeoutError = (error: unknown): boolean =>
  error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");

const readErrorResponse = async (response: Response): Promise<string> => {
  const text = await response.text().catch(() => "");
  return text.slice(0, MAX_ERROR_RESPONSE_LENGTH);
};

interface CodiaUploadImage {
  buffer: Buffer;
  filename: string;
  mime: string;
}

class CodiaHttpError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly responseText: string,
    readonly image: CodiaUploadImage
  ) {
    super(
      `HTTP ${status} ${statusText} ${responseText}`.trim() +
        `; upload=${image.filename}, ${image.mime}, ${image.buffer.length} bytes`
    );
    this.name = "CodiaHttpError";
  }
}

const isRetriableCodiaError = (error: Error): boolean => {
  if (!(error instanceof CodiaHttpError)) {
    return true;
  }
  return (
    error.status === 408 || error.status === 409 || error.status === 425 || error.status === 429 || error.status >= 500
  );
};

const createCodiaUploadForm = (image: CodiaUploadImage): FormData => {
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(image.buffer)], { type: image.mime }), image.filename);
  return form;
};

/** Codia 响应信封：{ code, message, data }，data 即喂给 codiaAdapterStep 的部分。 */
interface CodiaEnvelope {
  code: number;
  message: string;
  data: Data;
}

const inputSchema = z.object({
  imageUrl: z.string().describe("待转换的大屏设计稿图片 MinIO URL")
});

const outputSchema = z.object({
  fileKey: z.string().optional().describe("来源标识（此处透传图片 URL），下游可选使用"),
  data: z.custom<Data>().describe("Codia image_to_design 响应的 data 部分（configuration + visualElement）")
});

/**
 * 从 MinIO 取回原图，用 multipart/form-data 传给 Codia image_to_design，
 * 产出与 codiaAdapterStep 输入一致的 { fileKey?, data }，直接接后续转换 pipeline。
 * Codia 是外网服务、访问不到内网 MinIO URL，所以必须把图下载下来再随请求体上传。
 */
export const codiaImageToDesignStep = createStep({
  id: StepEnum.CODIA_IMAGE_TO_DESIGN,
  description: "从 MinIO 取图并调用 Codia image_to_design，产出 Codia data",
  inputSchema,
  outputSchema,
  execute: async ({ inputData }) => {
    const { imageUrl } = inputData;
    let stage = "初始化";

    try {
      const apiKey = process.env.CODIA_API_KEY;
      if (!apiKey) {
        throw new Error("缺少 CODIA_API_KEY 环境变量");
      }

      stage = "从 MinIO 获取图片";
      const { buffer, filename, mime } = await fetchChatImageBuffer(imageUrl);
      const uploadImage = { buffer, filename, mime };

      stage = "调用 Codia image_to_design";
      const timeoutMs = getCodiaRequestTimeoutMs();
      const maxRetries = getCodiaMaxRetries();
      const response = await retryWithBackoff(
        async () => {
          const attemptResponse = await fetch(CODIA_IMAGE_TO_DESIGN_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: createCodiaUploadForm(uploadImage),
            signal: AbortSignal.timeout(timeoutMs)
          });

          if (!attemptResponse.ok) {
            const responseText = await readErrorResponse(attemptResponse);
            throw new CodiaHttpError(attemptResponse.status, attemptResponse.statusText, responseText, uploadImage);
          }

          return attemptResponse;
        },
        {
          maxRetries,
          shouldRetry: (_, error) => isRetriableCodiaError(error),
          onRetry: (attempt, error, willRetry) => {
            const retryStatus = willRetry ? "将退避重试" : "不再重试";
            console.warn(`[Codia] image_to_design 第 ${attempt}/${maxRetries} 次调用失败，${retryStatus}`, {
              detail: formatErrorChain(error)
            });
          }
        }
      );

      stage = "解析 Codia 响应";
      const envelope = (await response.json()) as CodiaEnvelope;
      if (envelope.code !== 0 || !envelope.data) {
        throw new Error(`返回异常: code=${envelope.code} message=${envelope.message}`);
      }

      return { fileKey: imageUrl, data: envelope.data };
    } catch (error) {
      const detail = isTimeoutError(error) ? `请求超时（${getCodiaRequestTimeoutMs()}ms）` : formatErrorChain(error);

      console.error(`[Codia] image_to_design ${stage}失败`, { detail });
      throw new Error(`[Codia] image_to_design ${stage}失败: ${detail}`, {
        cause: error instanceof Error ? error : undefined
      });
    }
  }
});
