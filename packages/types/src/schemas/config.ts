import { z } from "zod";

import type { AdaptationType } from "../types/large-screen";

// ============================================
// Config Schemas
// ============================================

/** 适配类型 Schema */
export const AdaptationTypeSchema: z.ZodSchema<AdaptationType> = z.enum({
  fill: 1,
  scale: 2,
  overflow: 3
});
