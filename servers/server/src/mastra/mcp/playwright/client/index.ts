import { MCPClient } from "@mastra/mcp";

export const PlayWrightMcpClient = new MCPClient({
  servers: {
    playwright: {
      command: "npx",
      args: ["@playwright/mcp@latest"]
    }
  }
});
