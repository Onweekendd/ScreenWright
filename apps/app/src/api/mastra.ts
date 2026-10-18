import { MastraClient } from "@mastra/client-js";

import { getToken } from "@/utils/auth";
import { handleUnauthorized } from "@/utils/session";

/** Mastra 内置路由（/api/*）同样要登录：每次请求现取令牌，登录 / 退出后无需重建客户端 */
const authedFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);
  const token = getToken();
  if (token) {
    headers.set("X-Access-Token", token);
  }
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    handleUnauthorized();
  }
  return res;
};

export const mastraClient = new MastraClient({
  baseUrl: process.env.VITE_FUNAI_API_URL ?? "http://localhost:4111",
  fetch: authedFetch
});
