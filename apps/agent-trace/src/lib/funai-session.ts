/**
 * agent-trace 访问后端的登录态。
 *
 * 后端的 /customApi/* 都要登录，而 agent-trace 是在 Next 服务端直接调接口，没有浏览器里的登录页，
 * 所以用环境变量里的账号自动登录，令牌缓存在进程内存里；令牌过期（后端回 401）时重新登录并重试一次。
 *
 * 需要在 apps/agent-trace/.env.local 里配置：
 *   FUNAI_USERNAME=admin
 *   FUNAI_PASSWORD=...
 */

const apiBase = () => process.env.FUNAI_API_BASE ?? "http://localhost:4111";

let cachedToken: string | undefined;
let loginInFlight: Promise<string> | undefined;

async function login(): Promise<string> {
  const username = process.env.FUNAI_USERNAME;
  const password = process.env.FUNAI_PASSWORD;
  if (!username || !password) {
    throw new Error("agent-trace 需要登录后端：请在 apps/agent-trace/.env.local 配置 FUNAI_USERNAME 和 FUNAI_PASSWORD");
  }
  const res = await fetch(`${apiBase()}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`登录后端失败 (${res.status})，请检查 FUNAI_USERNAME / FUNAI_PASSWORD 与 FUNAI_API_BASE`);
  }
  const json = (await res.json()) as { result?: { token?: string } };
  const token = json.result?.token;
  if (!token) {
    throw new Error("登录后端成功但没有拿到令牌");
  }
  return token;
}

/** 取令牌；并发请求共用同一次登录，避免页面一次发多个请求时重复登录 */
export function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken) {
    return Promise.resolve(cachedToken);
  }
  loginInFlight ??= login()
    .then((token) => (cachedToken = token))
    .finally(() => {
      loginInFlight = undefined;
    });
  return loginInFlight;
}

/** 带令牌的 fetch：401 时视为令牌过期，重新登录后重试一次 */
export const authedFetch: typeof fetch = async (input, init) => {
  const send = async (forceRefresh: boolean) => {
    const headers = new Headers(init?.headers);
    headers.set("X-Access-Token", await getToken(forceRefresh));
    return fetch(input, { ...init, headers });
  };
  const res = await send(false);
  return res.status === 401 ? send(true) : res;
};
