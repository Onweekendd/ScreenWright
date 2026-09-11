import { describe, expect, it } from "vitest";

import { resolveArtifactPreviewUrl } from "./preview-url";

describe("resolveArtifactPreviewUrl", () => {
  it("开发模式传入 appId 时，返回 Screenwright 上的稳定预览地址", () => {
    // Arrange
    const input = {
      appId: "app-001",
      ScreenwrightBaseUrl: "http://localhost:4111",
      previewMode: "development" as const
    };

    // Act
    const result = resolveArtifactPreviewUrl(input);

    // Assert
    expect(result).toBe("http://localhost:4111/artifact-apps/app-001/");
  });

  it("Screenwright API 地址包含路径时，使用独立的 Artifact 服务根路径", () => {
    // Arrange
    const input = {
      appId: "app-demo",
      ScreenwrightBaseUrl: "https://screenwright.test/ai",
      previewMode: "development" as const
    };

    // Act
    const result = resolveArtifactPreviewUrl(input);

    // Assert
    expect(result).toBe("https://screenwright.test/artifact-apps/app-demo/");
  });

  it("发布模式尚未提供 Release 时，不生成开发预览地址", () => {
    // Arrange
    const input = {
      appId: "app-001",
      ScreenwrightBaseUrl: "http://localhost:4111",
      previewMode: "published" as const
    };

    // Act
    const result = resolveArtifactPreviewUrl(input);

    // Assert
    expect(result).toBeNull();
  });

  it("appId 包含路径字符时，拒绝生成预览地址", () => {
    // Arrange
    const input = {
      appId: "../other-app",
      ScreenwrightBaseUrl: "http://localhost:4111",
      previewMode: "development" as const
    };

    // Act
    const result = resolveArtifactPreviewUrl(input);

    // Assert
    expect(result).toBeNull();
  });
});
