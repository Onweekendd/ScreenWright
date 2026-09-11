import { describe, expect, it } from "vitest";

import { ArtifactAppTaskMetadataSchema } from "@/artifact-app/contracts";

describe("ArtifactAppTaskMetadataSchema", () => {
  it("parse：给定当前大屏 ID 时，应通过 metadata 校验", () => {
    // Arrange
    const metadata = {
      task_kind: "artifact-app-code",
      appId: "app-001",
      screenId: "screen-001",
      acceptanceCriteria: ["类型检查通过"]
    };

    // Act
    const result = ArtifactAppTaskMetadataSchema.safeParse(metadata);

    // Assert
    expect(result.success).toBe(true);
  });

  it("parse：缺少当前大屏 ID 时，应拒绝 metadata", () => {
    // Arrange
    const metadata = {
      task_kind: "artifact-app-code",
      appId: "app-001",
      acceptanceCriteria: ["类型检查通过"]
    };

    // Act
    const result = ArtifactAppTaskMetadataSchema.safeParse(metadata);

    // Assert
    expect(result.success).toBe(false);
  });
});
