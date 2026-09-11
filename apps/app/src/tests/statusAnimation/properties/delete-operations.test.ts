import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "../test-utils";

import { ElMessage } from "element-plus";

import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画属性管理 - 删除操作测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("删除组件属性 - 基本功能测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getRenderTableData, getCurrentAnimationList, getCurrentStatusList, componentAnimations } =
      useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      removeTransitionPropertiesForComponent
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并设置多个属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left", "top"]);

    // 验证初始状态有3个属性组
    let renderData = getRenderTableData.value;
    expect(renderData[0]?.children?.length, "初始有3个属性组").toBe(3);

    const initialGroups = renderData[0]?.children?.map((group) => group.group) || [];
    expect(initialGroups).toEqual(expect.arrayContaining(["层级", "透明度", "定位"]));

    // 删除透明度属性
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity"]);

    // 验证透明度属性组被删除
    renderData = getRenderTableData.value;
    expect(renderData[0]?.children?.length, "删除后有2个属性组").toBe(2);

    const remainingGroups = renderData[0]?.children?.map((group) => group.group) || [];
    expect(remainingGroups).not.toContain("透明度");
    expect(remainingGroups).toEqual(expect.arrayContaining(["层级", "定位"]));

    // 验证组件动画配置中确实删除了opacity属性
    const componentConfig = componentAnimations.value[animationList[0].id][statusList[0].statusId][imageComponent.id];
    expect(componentConfig.opacity, "opacity属性已删除").toBeUndefined();
    expect(componentConfig.left, "left属性保留").toBeDefined();
    expect(componentConfig.top, "top属性保留").toBeDefined();
    expect(componentConfig.zIndex, "zIndex属性保留").toBeDefined();
  });

  it("删除组件属性 - 批量删除测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getRenderTableData, getCurrentAnimationList, getCurrentStatusList, componentAnimations } =
      useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      removeTransitionPropertiesForComponent
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并设置多个属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left", "top", "width", "height"]);

    // 验证初始状态
    let renderData = getRenderTableData.value;
    expect(renderData[0]?.children?.length, "初始有4个属性组").toBe(4); // 层级、透明度、定位、尺寸

    // 批量删除多个属性
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left", "width"]);

    // 验证删除结果
    renderData = getRenderTableData.value;
    expect(renderData[0]?.children?.length, "删除后有3个属性组").toBe(3); // 层级、定位(只剩top)、尺寸(只剩height)

    const componentConfig = componentAnimations.value[animationList[0].id][statusList[0].statusId][imageComponent.id];
    expect(componentConfig.opacity, "opacity属性已删除").toBeUndefined();
    expect(componentConfig.left, "left属性已删除").toBeUndefined();
    expect(componentConfig.width, "width属性已删除").toBeUndefined();
    expect(componentConfig.top, "top属性保留").toBeDefined();
    expect(componentConfig.zIndex, "zIndex属性保留").toBeDefined();
    expect(componentConfig.componentId, "componentId属性保留").toBeDefined();
  });

  it("删除组件属性 - 边界情况测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      removeTransitionPropertiesForComponent
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 测试空属性列表
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, []);
    // 应该没有报错，直接返回

    // 测试不存在的组件ID
    await removeTransitionPropertiesForComponent("non-existent-component", ["opacity"]);
    expect(ElMessage.error).toHaveBeenCalledWith("组件不存在");

    // 测试删除不存在的属性（不应该报错）
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity"]); // opacity原本就不存在
    // 应该正常执行
  });

  it("删除组件属性 - componentId保留测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      removeTransitionPropertiesForComponent
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left", "top"]);

    // 删除所有动画属性
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left", "top", "zIndex"]);

    const componentConfig = componentAnimations.value[animationList[0].id][statusList[0].statusId][imageComponent.id];
    // componentId 应该始终被保留，即使删除了所有其他属性
    expect(componentConfig.componentId, "componentId属性始终保留").toBeDefined();
    expect(componentConfig.componentId, "componentId值正确").toBe(`${imageComponent.id}`);
    // 其他属性应该被删除
    expect(componentConfig.opacity, "opacity属性被删除").toBeUndefined();
    expect(componentConfig.left, "left属性被删除").toBeUndefined();
    expect(componentConfig.top, "top属性被删除").toBeUndefined();
    expect(componentConfig.zIndex, "zIndex属性被删除").toBeUndefined();
  });

  it("删除组件属性 - 多状态一致性测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      removeTransitionPropertiesForComponent,
      addStatus
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件和属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]);

    // 添加新状态（会复制组件配置）
    await addStatus();

    // 获取所有状态
    const updatedStatusList = getCurrentStatusList.value;
    expect(updatedStatusList.length, "现在有2个状态").toBe(2);

    // 验证两个状态都有相同的属性
    updatedStatusList.forEach((status) => {
      const config = componentAnimations.value[animationList[0].id][status.statusId][imageComponent.id];
      expect(config.opacity, `状态${status.statusName}有opacity属性`).toBeDefined();
      expect(config.left, `状态${status.statusName}有left属性`).toBeDefined();
    });

    // 删除属性（应该在所有状态中都删除）
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity"]);

    // 验证所有状态的属性都被删除
    updatedStatusList.forEach((status) => {
      const config = componentAnimations.value[animationList[0].id][status.statusId][imageComponent.id];
      expect(config.opacity, `状态${status.statusName}的opacity属性已删除`).toBeUndefined();
      expect(config.left, `状态${status.statusName}的left属性保留`).toBeDefined();
      expect(config.componentId, `状态${status.statusName}的componentId保留`).toBeDefined();
    });
  });

  it("删除组件属性 - 渐进式删除测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getRenderTableData, getCurrentAnimationList, getCurrentStatusList } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      removeTransitionPropertiesForComponent
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件和全套属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left", "top", "width", "height"]);

    // 验证初始状态
    let renderData = getRenderTableData.value;
    expect(renderData[0]?.children?.length, "初始有4个属性组").toBe(4); // 层级、透明度、定位、尺寸

    // 第一次删除：删除透明度
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity"]);
    renderData = getRenderTableData.value;
    expect(renderData[0]?.children?.length, "删除透明度后有3个属性组").toBe(3);
    expect(renderData[0]?.children?.map((g) => g.group)).not.toContain("透明度");

    // 第二次删除：删除尺寸属性
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["width", "height"]);
    renderData = getRenderTableData.value;
    expect(renderData[0]?.children?.length, "删除尺寸后有2个属性组").toBe(2);
    expect(renderData[0]?.children?.map((g) => g.group)).not.toContain("尺寸");

    // 第三次删除：删除部分定位属性
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["left"]);
    renderData = getRenderTableData.value;
    expect(renderData[0]?.children?.length, "删除left后仍有2个属性组").toBe(2); // 定位组还有top

    const positionGroup = renderData[0]?.children?.find((g) => g.group === "定位");
    expect(positionGroup?.children?.length, "定位组只剩1个属性").toBe(1);
    expect(positionGroup?.children?.[0].property, "定位组只剩top").toBe("top");

    // 第四次删除：删除最后的定位属性
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["top"]);
    renderData = getRenderTableData.value;
    expect(renderData[0]?.children?.length, "最后只剩层级组").toBe(1);
    expect(renderData[0]?.children?.[0].group, "最后只剩层级组").toBe("层级");
  });
});
