import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { registerSwagger } from "../services/swagger-registry";

const RegisterSwaggerSchema = z.object({
  datasourceId: z.number().int().positive(),
  swaggerUrl: z.string().url(),
  baseUrl: z.string()
});

export const swaggerRegistryRouter = new Hono().post(
  "/register-swagger",
  zValidator("json", RegisterSwaggerSchema),
  async (c) => {
    try {
      const { datasourceId, swaggerUrl, baseUrl } = c.req.valid("json");
      const index = await registerSwagger(datasourceId, swaggerUrl, baseUrl);
      return c.json({ success: true, data: index });
    } catch (e) {
      throw new HTTPException(500, {
        message: e instanceof Error ? e.message : "swagger 注册失败"
      });
    }
  }
);
