import { z } from "zod";

export const UploadChatImageRequestSchema = z.object({
  conversationId: z.string(),
  file: z.instanceof(File)
});

export const UploadChatImageResponseSchema = z.object({
  objectKey: z.string(),
  url: z.string()
});

export type UploadChatImageResponse = z.infer<typeof UploadChatImageResponseSchema>;
