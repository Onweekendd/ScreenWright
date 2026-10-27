import { createServer } from "node:http";
import { createConnection } from "node:net";
import { createRequire } from "node:module";

import { expect, it, vi } from "vitest";

import { configureOutboundProxy } from "@/lib/http/outbound-proxy";

it("加载编码依赖后仍通过环境代理访问 .ai 域名，内部健康检查保持直连", async () => {
  const codingAgentUrl = import.meta.resolve("@earendil-works/pi-coding-agent");
  await import(codingAgentUrl);
  const undici = createRequire(codingAgentUrl)("undici") as typeof import("undici");
  const previousDispatcher = undici.getGlobalDispatcher();
  const previousFetch = globalThis.fetch;
  const target = createServer((_request, response) => response.end("ok"));
  let tunnels = 0;
  const proxy = createServer((_request, response) => {
    tunnels++;
    response.end("ok");
  });
  proxy.on("connect", (_request, socket, head) => {
    tunnels++;
    const upstream = createConnection({ host: "127.0.0.1", port: (target.address() as { port: number }).port });
    upstream.on("error", () => socket.destroy());
    socket.on("error", () => upstream.destroy());
    upstream.on("connect", () => {
      socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      upstream.write(head);
      socket.pipe(upstream);
      upstream.pipe(socket);
    });
    socket.on("close", () => upstream.destroy());
  });
  await new Promise<void>((resolve) => target.listen(0, "127.0.0.1", resolve));
  await new Promise<void>((resolve) => proxy.listen(0, "127.0.0.1", resolve));
  try {
    const proxyUrl = `http://127.0.0.1:${(proxy.address() as { port: number }).port}`;
    for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"]) vi.stubEnv(key, proxyUrl);
    for (const key of ["NO_PROXY", "no_proxy"]) vi.stubEnv(key, "localhost,127.0.0.1,api,ai:4112,worker,minio");
    vi.stubEnv("NODE_USE_ENV_PROXY", "1");
    await configureOutboundProxy();
    const port = (target.address() as { port: number }).port;
    const external = await fetch(`http://api.n1n.ai:${port}/health`, { signal: AbortSignal.timeout(5000) });
    expect(await external.text()).toBe("ok");
    expect(tunnels).toBe(1);
    const internal = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(5000) });
    expect(await internal.text()).toBe("ok");
    expect(tunnels).toBe(1);
  } finally {
    await undici.getGlobalDispatcher().destroy();
    undici.setGlobalDispatcher(previousDispatcher);
    globalThis.fetch = previousFetch;
    vi.unstubAllEnvs();
    target.closeAllConnections();
    proxy.closeAllConnections();
    await Promise.all([
      new Promise<void>((resolve) => target.close(() => resolve())),
      new Promise<void>((resolve) => proxy.close(() => resolve()))
    ]);
  }
}, 20_000);
