import { createRequire } from "node:module";

/** Initialize the same Undici instance that the coding-agent dependency installs. */
export async function configureOutboundProxy(): Promise<void> {
  if (process.env.NODE_USE_ENV_PROXY !== "1" || !(process.env.HTTPS_PROXY || process.env.HTTP_PROXY)) {
    return;
  }
  const codingAgentUrl = import.meta.resolve("@earendil-works/pi-coding-agent");
  // Loading this dependency replaces Node's environment-proxy dispatcher.
  // Load it before installing the environment-aware dispatcher so later imports are cached.
  await import(codingAgentUrl);
  const undici = createRequire(codingAgentUrl)("undici") as typeof import("undici");
  undici.setGlobalDispatcher(new undici.EnvHttpProxyAgent());
  undici.install();
}
