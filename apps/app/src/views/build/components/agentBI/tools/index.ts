import type { ClientTool } from "@mastra/client-js";

import { routeChange } from "./routeChange";

/**
 * AgentBI 所有可用工具的集合
 */
export const agentBITools: Record<string, ClientTool<any, any>> = {
  routeChange
};

export { routeChange };
