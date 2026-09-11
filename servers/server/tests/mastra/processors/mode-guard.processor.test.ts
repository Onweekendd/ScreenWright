import type { ProcessInputStepArgs } from "@mastra/core/processors";
import { RequestContext } from "@mastra/core/request-context";
import { describe, expect, it } from "vitest";

import { ModeGuardProcessor } from "@/mastra/processors/mode-guard.processor";
import { AgentMode, type CommonRunTimeType } from "@/mastra/types/bi-chat";

describe("ModeGuardProcessor", () => {
  it("processInputStep：处于 PLAN 模式时，应移除 Artifact App 编码委派工具", async () => {
    // Arrange
    const processor = new ModeGuardProcessor();
    const requestContext = new RequestContext<CommonRunTimeType>();
    requestContext.set("mode", AgentMode.PLAN);
    const input = {
      requestContext,
      tools: {
        readFileTool: { id: "read-file" },
        delegateAppCodeTool: { id: "delegate-app-code" }
      }
    } as unknown as ProcessInputStepArgs;

    // Act
    const result = await processor.processInputStep(input);

    // Assert
    expect(result.tools).toHaveProperty("readFileTool");
    expect(result.tools).not.toHaveProperty("delegateAppCodeTool");
  });

  it("processInputStep：处于自动编辑模式时，应保持原有工具集合不变", async () => {
    // Arrange
    const processor = new ModeGuardProcessor();
    const requestContext = new RequestContext<CommonRunTimeType>();
    requestContext.set("mode", AgentMode.AUTO_EDIT);
    const input = {
      requestContext,
      tools: {
        delegateAppCodeTool: { id: "delegate-app-code" }
      }
    } as unknown as ProcessInputStepArgs;

    // Act
    const result = await processor.processInputStep(input);

    // Assert
    expect(result).toEqual({});
  });
});
