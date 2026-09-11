import { describe, expect, it } from "vitest";

import {
  generateBundleAssets,
  getVersion,
  transformIndexHtmlWithAssets,
  webUpdateNotice
} from "@/build/webUpdateNotice";

describe("webUpdateNotice plugin - types only", () => {
  it("should expose factory function", () => {
    expect(typeof webUpdateNotice).toBe("function");
  });

  it("should expose helpers", () => {
    expect(typeof getVersion).toBe("function");
    expect(typeof generateBundleAssets).toBe("function");
    expect(typeof transformIndexHtmlWithAssets).toBe("function");
  });
});
