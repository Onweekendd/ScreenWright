import type { GetFileNodesResponse } from "@figma/rest-api-spec";
import { describe, expect, it } from "vitest";

import {
  allExtractors,
  collapseSvgContainers,
  simplifyRawFigmaObject
} from "@/mastra/mcp/figma-context-mcp/server/extractors/index";
import type { SimplifiedNode } from "@/mastra/mcp/figma-context-mcp/server/extractors/types";

import rawData from "./data-raw.mock.json";

describe("simplifyRawFigmaObject - text5 letterSpacing/lineHeight 按 unit 输出", () => {
  it("letterSpacingUnit=PERCENT 输出 '3%'，lineHeightUnit=PIXELS 输出 '30px'", () => {
    const simplified = simplifyRawFigmaObject(rawData as unknown as GetFileNodesResponse, allExtractors, {
      afterChildren: collapseSvgContainers
    });

    const node: SimplifiedNode = simplified.nodes[0];
    const textStyleKey = node.textStyle as string;
    const textStyle = simplified.globalVars.styles[textStyleKey] as Record<string, unknown>;

    // eslint-disable-next-line no-console
    console.log("[verify] simplified textStyle =", JSON.stringify(textStyle, null, 2));

    expect(textStyle).toBeDefined();
    expect(textStyle.fontSize).toBe(26);
    expect(textStyle.letterSpacing).toBe("3%");
    expect(textStyle.lineHeight).toBe("30px");
  });
});
