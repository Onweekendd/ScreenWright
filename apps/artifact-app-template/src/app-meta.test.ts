import { describe, expect, it } from "vitest";

import { appMeta } from "./app-meta";

describe("appMeta", () => {
  it("初始化模板时，声明统一的前端技术栈", () => {
    // Arrange
    const expectedStack = ["Vue 3", "Vite", "Tailwind CSS"];

    // Act
    const actualStack = [appMeta.framework, appMeta.runtime, appMeta.styling];

    // Assert
    expect(actualStack).toEqual(expectedStack);
  });
});
