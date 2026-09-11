import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";

import httpProxy from "http-proxy";

import { getErrorMessage } from "../../shared/error-message";
import type { PreviewManager } from "../preview-manager";

const PREVIEW_REQUEST_PATTERN = /^\/artifact-apps\/([^/?#]+)(?:[/?#]|$)/;
const PREVIEW_UNAVAILABLE_MESSAGE = "Artifact App preview is unavailable";

export interface ArtifactAppPreviewProxyOptions {
  readonly previewManager: PreviewManager;
}

/**
 * 把稳定的 `/artifact-apps/:appId/` HTTP 与 WebSocket 请求转发到对应 Vite 端口。
 * 临时端口只存在于 PreviewManager 内部，不会进入客户端组件配置。
 */
export class ArtifactAppPreviewProxy {
  private readonly previewManager: PreviewManager;
  private readonly proxy = httpProxy.createProxyServer({ changeOrigin: true, ws: true, xfwd: true });

  constructor(options: ArtifactAppPreviewProxyOptions) {
    this.previewManager = options.previewManager;
  }

  matches(requestUrl: string | undefined): boolean {
    return requestUrl !== undefined && PREVIEW_REQUEST_PATTERN.test(requestUrl);
  }

  async handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const appId = parseAppId(request.url);
    if (!appId) {
      writeProxyError(response, 404, "Artifact App preview path is invalid");
      return;
    }

    const trailingSlashLocation = createTrailingSlashLocation(request.url);
    if (trailingSlashLocation) {
      response.writeHead(308, { Location: trailingSlashLocation });
      response.end();
      return;
    }

    try {
      const preview = await this.previewManager.start(appId);
      this.proxy.web(request, response, { target: `http://127.0.0.1:${preview.port}` }, (error) => {
        writeProxyError(response, 502, getErrorMessage(error, PREVIEW_UNAVAILABLE_MESSAGE));
      });
    } catch (error) {
      writeProxyError(response, 503, getErrorMessage(error, PREVIEW_UNAVAILABLE_MESSAGE));
    }
  }

  async handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
    const appId = parseAppId(request.url);
    if (!appId) {
      socket.destroy();
      return;
    }

    try {
      const preview = await this.previewManager.start(appId);
      this.proxy.ws(request, socket, head, { target: `http://127.0.0.1:${preview.port}` }, () => socket.destroy());
    } catch {
      socket.destroy();
    }
  }

  close(): void {
    this.proxy.close();
  }
}

function parseAppId(requestUrl: string | undefined): string | undefined {
  const match = requestUrl?.match(PREVIEW_REQUEST_PATTERN);
  if (!match) {
    return undefined;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return undefined;
  }
}

function createTrailingSlashLocation(requestUrl: string | undefined): string | undefined {
  if (!requestUrl) {
    return undefined;
  }
  const [pathname, query] = requestUrl.split("?", 2);
  if (!/^\/artifact-apps\/[^/]+$/.test(pathname)) {
    return undefined;
  }
  return `${pathname}/${query === undefined ? "" : `?${query}`}`;
}

function writeProxyError(response: ServerResponse, statusCode: number, message: string): void {
  if (response.headersSent || response.writableEnded) {
    response.destroy();
    return;
  }
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}
