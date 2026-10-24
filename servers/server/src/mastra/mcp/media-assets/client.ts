import { MCPClient } from "@mastra/mcp";

let client: MCPClient | undefined;
let tools: ReturnType<MCPClient["listTools"]> | undefined;

/** 连接按需建立，素材服务停机不会阻止平台启动。 */
export function getMediaAssetsTools() {
  if (!tools) {
    const url = process.env.MEDIA_ASSETS_MCP_URL;
    const token = process.env.MEDIA_ASSETS_MCP_TOKEN;
    if (!url || !token) {
      throw new Error("请配置 MEDIA_ASSETS_MCP_URL 和 MEDIA_ASSETS_MCP_TOKEN 后使用联网素材搜索");
    }
    client = new MCPClient({
      id: "funbi-media-assets",
      servers: {
        mediaAssets: {
          url: new URL(url),
          requestInit: { headers: { Authorization: `Bearer ${token}` } },
          connectTimeout: 10_000,
          timeout: 30_000
        }
      }
    });
    const connecting = client;
    tools = connecting.listTools().catch(async (error: unknown) => {
      tools = undefined;
      client = undefined;
      await connecting.disconnect().catch(() => {});
      throw error;
    });
  }
  return tools;
}

export async function closeMediaAssetsMcp() {
  const connected = client;
  client = undefined;
  tools = undefined;
  await connected?.disconnect();
}

/** MCP 的结构化响应和 JSON 文本响应统一解包。 */
export function unpackMediaAssetsResult(result: unknown): unknown {
  if (!result || typeof result !== "object") {
    throw new Error("素材 MCP 返回了无效结果");
  }
  const value = result as {
    isError?: boolean;
    structuredContent?: unknown;
    content?: Array<{ type: string; text?: string }>;
  };
  const text = value.content
    ?.filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");
  if (value.isError) {
    throw new Error(text || "素材 MCP 调用失败");
  }
  if (value.structuredContent) {
    return value.structuredContent;
  }
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("素材 MCP 返回的文本不是 JSON");
    }
  }
  return result;
}

export async function callMediaAssetsTool(
  name: "create_asset_task" | "get_asset_task" | "cancel_asset_task",
  input: Record<string, unknown>
) {
  const available = await getMediaAssetsTools();
  const tool = available[`mediaAssets_${name}`];
  if (!tool?.execute) {
    throw new Error(`素材 MCP 未提供工具：${name}`);
  }
  return unpackMediaAssetsResult(await tool.execute(input, {} as never));
}
