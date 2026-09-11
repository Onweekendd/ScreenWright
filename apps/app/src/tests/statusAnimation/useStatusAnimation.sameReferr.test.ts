import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "./test-utils";

import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画配置同步测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment(2);
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("状态动画配置同步测试", async () => {
    const { componentDefaultConfigMap } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      getCurrentAnimationList,
      getCurrentStatusList,
      setSelectAnimationId,
      triggerSingleComponentAnimation,
      resetComponentConfig
    } = useStatusAnimation();
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[3];

    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    expect(animationList.length).toBe(3);

    setSelectAnimationId(animationList[2].id);
    const statusList = getCurrentStatusList.value;
    expect(statusList.length).toBe(2);

    resetComponentConfig();

    await triggerSingleComponentAnimation(`${imageComponent.id}`, animationList[2].id, statusList[1].statusId);

    const backupComponent = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(backupComponent).toBeDefined();
    expect(imageComponent.data[0]).not.toBe(backupComponent!.data[0]);
  });
});
