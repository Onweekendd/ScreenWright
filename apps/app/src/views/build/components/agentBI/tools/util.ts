import z from "zod";

export const createJsonSchema = <T>(schema: z.ZodSchema<T>): z.ZodSchema<T> => {
  return z.toJSONSchema(schema) as unknown as z.ZodSchema<T>;
};
