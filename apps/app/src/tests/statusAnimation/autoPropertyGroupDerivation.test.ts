import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "./test-utils";

import { interactiveEnum, mediaEnum, textEnum } from "@/components/componentEntry/type";
import {
  getComponentPropertyGroups,
  getComponentPropertyGroupsWithProperties
} from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/utils/utils";

describe("自动属性组推导功能", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });
  it("应该为 FtImg 组件推导出正确的属性组", () => {
    const groups = getComponentPropertyGroups(mediaEnum.SwImg);

    // 验证包含所有预期的属性组
    expect(groups).toContain("position");
    expect(groups).toContain("size");
    expect(groups).toContain("display");
    expect(groups).toContain("zIndex");
    expect(groups).toContain("rotation");
    expect(groups).toContain("appearance");
    expect(groups).toContain("image");
  });

  it("应该为 FtText 组件推导出正确的属性组", () => {
    const groups = getComponentPropertyGroups(textEnum.SwText);

    // 验证包含所有预期的属性组
    expect(groups).toContain("position");
    expect(groups).toContain("size");
    expect(groups).toContain("display");
    expect(groups).toContain("zIndex");
    expect(groups).toContain("rotation");
    expect(groups).toContain("appearance");
    expect(groups).toContain("fontSize");
  });

  it("应该为 FtMutual 组件推导出正确的属性组", () => {
    const groups = getComponentPropertyGroups(interactiveEnum.SwMutual);

    // 验证包含所有预期的属性组
    expect(groups).toContain("position");
    expect(groups).toContain("size");
    expect(groups).toContain("display");
    expect(groups).toContain("zIndex");
    expect(groups).toContain("rotation");
    expect(groups).toContain("appearance");
    expect(groups).toContain("image");
  });

  it("应该返回完整的属性组配置（包含属性列表）", () => {
    const groupsWithProps = getComponentPropertyGroupsWithProperties(mediaEnum.SwImg);

    // 验证返回的是完整的属性组配置
    expect(Array.isArray(groupsWithProps)).toBe(true);
    expect(groupsWithProps.length).toBeGreaterThan(0);

    // 验证每个属性组都有正确的结构
    groupsWithProps.forEach((group) => {
      expect(group).toHaveProperty("name");
      expect(group).toHaveProperty("type");
      expect(group).toHaveProperty("properties");
      expect(Array.isArray(group.properties)).toBe(true);
    });

    // 验证特定属性组的属性列表
    const positionGroup = groupsWithProps.find((g) => g.name === "定位");
    expect(positionGroup).toBeDefined();
    expect(positionGroup?.properties).toContain("left");
    expect(positionGroup?.properties).toContain("top");

    const imageGroup = groupsWithProps.find((g) => g.name === "图片");
    expect(imageGroup).toBeDefined();
    expect(imageGroup?.properties).toContain("image");
  });

  it("应该为未知组件类型返回默认属性组", () => {
    const groups = getComponentPropertyGroups("unknown-component");

    // 应该至少包含基础属性组
    expect(groups).toContain("position");
    expect(groups).toContain("size");
    expect(groups).toContain("display");
    expect(groups).toContain("zIndex");
  });

  it("应该正确去重属性列表", () => {
    const groupsWithProps = getComponentPropertyGroupsWithProperties(mediaEnum.SwImg);

    // 验证每个属性组中的属性都是唯一的
    groupsWithProps.forEach((group) => {
      const uniqueProperties = [...new Set(group.properties)];
      expect(group.properties).toEqual(uniqueProperties);
    });
  });
});
