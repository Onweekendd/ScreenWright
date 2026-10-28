import {
  computePromptHash,
  type GeneratedImageRecord
} from "@/mastra/services/ai-generation/image/image-generation.server";
import { type GenerateImageInput, ImageGenerationInputSchema } from "@/mastra/services/ai-generation/image/image-input";

/** 生图队列名。producer（ai 进程）与 consumer（worker 进程）必须一致。 */
export const IMAGE_QUEUE = "image-generation";
export const IMAGE_JOB_NAME = "generate";

/** 队列里的任务数据就是生图入参本身；worker 入口用 schema 做运行时校验。 */
export const ImageJobDataSchema = ImageGenerationInputSchema;
export type ImageJobData = GenerateImageInput;

/**
 * 任务 id = promptHash：同一份输入天然是同一个任务，BullMQ 会把重复入队合并成一条
 * （在途的合并、保留期内已完成的直接复用结果），不会重复烧生图额度。
 */
export const imageJobId = (data: ImageJobData, modelId: string): string =>
  computePromptHash(data.prompt, data.seed, modelId, data.seedImageUrls);

/** worker 返回值只保留可 JSON 序列化的声明字段（Prisma 行里的 Date 过一遍队列会变字符串） */
export const toImageRecord = (row: GeneratedImageRecord): GeneratedImageRecord => ({
  id: row.id,
  promptHash: row.promptHash,
  prompt: row.prompt,
  model: row.model,
  seed: row.seed,
  width: row.width,
  height: row.height,
  url: row.url,
  reused: row.reused
});
