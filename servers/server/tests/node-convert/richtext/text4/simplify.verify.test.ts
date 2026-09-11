import type { GetFileNodesResponse } from "@figma/rest-api-spec";
import { describe, expect, it } from "vitest";

import {
  allExtractors,
  collapseSvgContainers,
  simplifyRawFigmaObject
} from "@/mastra/mcp/figma-context-mcp/server/extractors/index";
import type { SimplifiedNode } from "@/mastra/mcp/figma-context-mcp/server/extractors/types";

import rawData from "./data-raw.mock.json";

describe("simplifyRawFigmaObject - text4 Auto lineHeight", () => {
  it("Auto 行高（lineHeightUnit 缺省）应被过滤，输出 textStyle 不含 lineHeight", () => {
    const simplified = simplifyRawFigmaObject(rawData as unknown as GetFileNodesResponse, allExtractors, {
      afterChildren: collapseSvgContainers
    });

    const node: SimplifiedNode = simplified.nodes[0];
    const textStyleKey = node.textStyle as string;
    const textStyle = simplified.globalVars.styles[textStyleKey] as Record<string, unknown>;

    // 调试输出，方便人工核对
    // eslint-disable-next-line no-console
    console.log("[verify] simplified textStyle =", JSON.stringify(textStyle, null, 2));

    expect(textStyle).toBeDefined();
    expect(textStyle.fontSize).toBe(50);
    expect(textStyle.lineHeight).toBeUndefined();
  });
});
