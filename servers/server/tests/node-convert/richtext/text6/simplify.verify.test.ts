import type { GetFileNodesResponse } from "@figma/rest-api-spec";
import { describe, expect, it } from "vitest";

import {
  allExtractors,
  collapseSvgContainers,
  simplifyRawFigmaObject
} from "@/mastra/mcp/figma-context-mcp/server/extractors/index";
import type { SimplifiedNode } from "@/mastra/mcp/figma-context-mcp/server/extractors/types";

import rawData from "./data-raw.mock.json";

describe("simplifyRawFigmaObject - text6 lineHeightUnit=FONT_SIZE_% 按真实像素输出", () => {
  it(
    "Figma 面板设置行高 130%（fontSize=28）时，raw 的 lineHeightPx 是百分比数字 129.99999523162842，" +
      "输出的 lineHeight 必须按 fontSize * lineHeightPx / 100 换算成真实像素，而不是把百分比数字当成像素直接拼 'px'",
    () => {
      const simplified = simplifyRawFigmaObject(rawData as unknown as GetFileNodesResponse, allExtractors, {
        afterChildren: collapseSvgContainers
      });

      const node: SimplifiedNode = simplified.nodes[0];
      const textStyleKey = node.textStyle as string;
      const textStyle = simplified.globalVars.styles[textStyleKey] as Record<string, unknown>;

      console.log("[verify] simplified textStyle =", JSON.stringify(textStyle, null, 2));

      expect(textStyle).toBeDefined();
      expect(textStyle.fontSize).toBe(28);
      // 28 * 129.99999523162842 / 100 ≈ 36.4px，而不是错误地直接输出 "129.99999523162842px"
      expect(textStyle.lineHeight).toBe("36.39999866485596px");
    }
  );
});
