import { MastraClient } from "@mastra/client-js";

export const mastraClient = new MastraClient({
  baseUrl: process.env.VITE_FUNAI_API_URL ?? "http://localhost:4111"
});
