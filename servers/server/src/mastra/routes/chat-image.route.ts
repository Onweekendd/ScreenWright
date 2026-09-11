import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { uploadChatImage } from "../services/chat-image.server";
import { UploadChatImageRequestSchema } from "../types/chat-image";

export const chatImageRouter = new Hono().post(
  "/upload",
  zValidator("form", UploadChatImageRequestSchema),
  async (c) => {
    const { conversationId, file } = c.req.valid("form");
    const result = await uploadChatImage({ conversationId, file });
    return c.json({ success: true, data: result }, 201);
  }
);
