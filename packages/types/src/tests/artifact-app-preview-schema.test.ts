import { describe, expect, it } from "vitest";

import { ArtifactAppPreviewOptionSchema } from "../schemas/components/system/artifact-app-preview";

describe("ArtifactAppPreviewOptionSchema", () => {
  it("未提供可选配置时，补全安全的默认值", () => {
    // Arrange
    const input = {};

    // Act
    const result = ArtifactAppPreviewOptionSchema.parse(input);

    // Assert
    expect(result).toEqual({
      appId: "",
      allowInteraction: true,
      previewMode: "development",
      showStatus: true
    });
  });

  it("appId 包含路径字符时，拒绝该配置", () => {
    // Arrange
    const input = { appId: "../other-app" };

    // Act
    const result = ArtifactAppPreviewOptionSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
