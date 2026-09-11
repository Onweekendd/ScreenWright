import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestUtils } from "../test-utils";

import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画属性管理 - 状态重排序测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("状态重新排序功能测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { statusAnimations, componentAnimations, getCurrentAnimationList, getCurrentStatusList } =
      useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addStatus,
      reorderStatuses,
      addTransitionPropertiesForComponent
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    expect(animationList.length, "应该有一个动画").toBe(1);

    setSelectAnimationId(animationList[0].id);
    const currentAnimationId = animationList[0].id;

    // 添加多个状态用于测试重新排序
    await addStatus(); // 添加第二个状态
    await addStatus(); // 添加第三个状态

    const statusList = getCurrentStatusList.value;
    expect(statusList.length, "应该有3个状态").toBe(3);

    // 添加组件到状态动画
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left", "top"]);

    // 为不同状态设置不同的属性值
    const { updatePropertyValueImpl } = useStatusAnimation();

    // 设置第一个状态的属性
    setSelectStatusId(statusList[0].statusId);
    await updatePropertyValueImpl({
      componentId: `${imageComponent.id}`,
      statusId: statusList[0].statusId,
      property: "opacity",
      value: 1
    });

    // 设置第二个状态的属性
    setSelectStatusId(statusList[1].statusId);
    await updatePropertyValueImpl({
      componentId: `${imageComponent.id}`,
      statusId: statusList[1].statusId,
      property: "opacity",
      value: 0.5
    });

    // 设置第三个状态的属性
    setSelectStatusId(statusList[2].statusId);
    await updatePropertyValueImpl({
      componentId: `${imageComponent.id}`,
      statusId: statusList[2].statusId,
      property: "opacity",
      value: 0
    });

    // 记录重新排序前的状态
    const originalStatusOrder = statusList.map((s) => s.statusId);
    const originalOpacityValues = statusList.map(
      (s) => componentAnimations.value[currentAnimationId][s.statusId][imageComponent.id].opacity
    );

    expect(originalOpacityValues, "原始透明度值应该是 [1, 0.5, 0]").toEqual([1, 0.5, 0]);

    // 执行重新排序：反转顺序
    const newStatusOrder = [...originalStatusOrder].reverse();
    await reorderStatuses(currentAnimationId, newStatusOrder);

    // 验证状态顺序已改变
    const newStatusList = getCurrentStatusList.value;
    const newStatusOrder2 = newStatusList.map((s) => s.statusId);
    expect(newStatusOrder2, "状态顺序应该已经反转").toEqual(newStatusOrder);

    // 验证组件动画配置也按新顺序排列
    const newOpacityValues = newStatusList.map(
      (s) => componentAnimations.value[currentAnimationId][s.statusId][imageComponent.id].opacity
    );

    // 新的透明度值应该是原来的倒序
    expect(newOpacityValues, "新的透明度值应该是原来的倒序").toEqual([0, 0.5, 1]);

    // 验证状态名称映射也正确
    const statusMappings = statusAnimations.value[currentAnimationId];
    const statusNames = newStatusList.map((s) => statusMappings[s.statusId].statusName);
    expect(statusNames.length, "状态名称数量应该正确").toBe(3);

    // 验证每个状态的映射都存在
    newStatusList.forEach((status) => {
      expect(statusMappings[status.statusId], `状态 ${status.statusId} 的映射应该存在`).toBeDefined();
      expect(statusMappings[status.statusId].statusId, "映射的 statusId 应该匹配").toBe(status.statusId);
    });
  });

  it("状态重新排序边界情况测试", async () => {
    const { getCurrentAnimationList } = useStatusAnimationData();
    const { initAnimationAndComponentDefaultConfigMap, reorderStatuses } = useStatusAnimation();

    initAnimationAndComponentDefaultConfigMap();
    const animationList = getCurrentAnimationList();
    const currentAnimationId = animationList[0].id;

    // 测试空数组
    await reorderStatuses(currentAnimationId, []);

    // 测试不存在的动画ID
    await reorderStatuses("nonexistent-animation", ["status1"]);

    // 测试包含不存在状态ID的数组
    await reorderStatuses(currentAnimationId, ["nonexistent-status"]);

    // 这些操作应该正常执行而不抛出错误
    expect(true).toBe(true);
  });
});
