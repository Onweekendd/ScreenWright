import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "./test-utils";

import { useAnimationTrigger } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/components/hooks/useAnimationTrigger";
import { useStatusAnimationState } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/components/hooks/useStatusAnimationState";
import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("动画重置功能测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("triggerResetToInitialState - 重置所有组件到初始状态测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations, setComponentAnimations } =
      useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化状态动画系统
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件到状态动画
    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 添加一些过渡属性
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left", "width"]);

    // 记录组件初始状态
    const initialState = {
      left: imageComponent.left,
      top: imageComponent.top,
      width: imageComponent.component.width,
      height: imageComponent.component.height,
      opacity: imageComponent.option.opacity,
      rotateX: imageComponent.option.rotateX,
      rotateY: imageComponent.option.rotateY,
      rotateZ: imageComponent.option.rotateZ,
      display: imageComponent.display,
      zIndex: imageComponent.zIndex
    };

    // 修改状态动画配置，使组件状态与初始状态不同
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;

    const originalComponentConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    const updatedComponentAnimations = {
      ...componentAnimations.value[animationId][statusId],
      [imageComponent.id]: {
        ...originalComponentConfig,
        opacity: 0.3,
        left: 500,
        width: 416
      }
    };

    setComponentAnimations(animationId, statusId, updatedComponentAnimations);

    // 先触发一次状态动画，使组件状态改变
    const result1 = await testUtils.triggerStatusAnimation(`${imageComponent.id}`, animationId, statusId);

    // 验证组件状态已改变
    expect(result1.animationExecuted, "第一次动画应该被执行").toBe(true);
    expect(imageComponent.option.opacity, "opacity应该被修改").toBe(0.3);
    expect(imageComponent.left, "left应该被修改").toBe(500);
    expect(imageComponent.component.width, "width应该被修改").toBe(416);

    // 使用 useAnimationTrigger 的重置功能
    const statusAnimationState = useStatusAnimationState();
    const { triggerResetToInitialState } = useAnimationTrigger(statusAnimationState);

    // 触发重置到初始状态
    await triggerResetToInitialState(animationId, "0");

    // 验证组件已恢复到初始状态
    expect(imageComponent.option.opacity, "重置后opacity应该恢复到初始值").toBe(initialState.opacity);
    expect(imageComponent.left, "重置后left应该恢复到初始值").toBe(initialState.left);
    expect(imageComponent.component.width, "重置后width应该恢复到初始值").toBe(initialState.width);
    expect(imageComponent.top, "重置后top应该保持不变").toBe(initialState.top);
    expect(imageComponent.component.height, "重置后height应该保持不变").toBe(initialState.height);
    expect(imageComponent.option.rotateX, "重置后rotateX应该保持不变").toBe(initialState.rotateX);
    expect(imageComponent.option.rotateY, "重置后rotateY应该保持不变").toBe(initialState.rotateY);
    expect(imageComponent.option.rotateZ, "重置后rotateZ应该保持不变").toBe(initialState.rotateZ);
    expect(imageComponent.display, "重置后display应该保持不变").toBe(initialState.display);
    expect(imageComponent.zIndex, "重置后zIndex应该保持不变").toBe(initialState.zIndex);
  });

  it("triggerComponentResetWithAnimation - 单个组件重置到初始状态测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations, setComponentAnimations } =
      useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化状态动画系统
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件到状态动画
    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 添加一些过渡属性
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "rotateX", "height"]);

    // 记录组件初始状态
    const initialState = {
      left: imageComponent.left,
      top: imageComponent.top,
      width: imageComponent.component.width,
      height: imageComponent.component.height,
      opacity: imageComponent.option.opacity,
      rotateX: imageComponent.option.rotateX,
      rotateY: imageComponent.option.rotateY,
      rotateZ: imageComponent.option.rotateZ,
      display: imageComponent.display,
      zIndex: imageComponent.zIndex
    };

    // 修改状态动画配置
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;

    const originalComponentConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    const updatedComponentAnimations = {
      ...componentAnimations.value[animationId][statusId],
      [imageComponent.id]: {
        ...originalComponentConfig,
        opacity: 0.7,
        rotateX: 90,
        height: 241
      }
    };

    setComponentAnimations(animationId, statusId, updatedComponentAnimations);

    // 先触发一次状态动画
    const result1 = await testUtils.triggerStatusAnimation(`${imageComponent.id}`, animationId, statusId);

    // 验证组件状态已改变
    expect(result1.animationExecuted, "第一次动画应该被执行").toBe(true);
    expect(imageComponent.option.opacity, "opacity应该被修改").toBe(0.7);
    expect(imageComponent.option.rotateX, "rotateX应该被修改").toBe(90);
    expect(imageComponent.component.height, "height应该被修改").toBe(241);

    // 使用 useAnimationTrigger 的单个组件重置功能
    const statusAnimationState = useStatusAnimationState();
    const { triggerComponentResetWithAnimation } = useAnimationTrigger(statusAnimationState);

    // 获取组件的默认配置
    const defaultConfig = statusAnimationState.componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(defaultConfig, "应该能找到组件的默认配置").toBeDefined();

    if (defaultConfig) {
      // 触发单个组件重置
      await triggerComponentResetWithAnimation({
        componentId: `${imageComponent.id}`,
        defaultConfig,
        duration: 1000,
        animationId,
        statusId
      });

      // 验证组件已恢复到初始状态
      expect(imageComponent.option.opacity, "重置后opacity应该恢复到初始值").toBe(initialState.opacity);
      expect(imageComponent.option.rotateX, "重置后rotateX应该恢复到初始值").toBe(initialState.rotateX);
      expect(imageComponent.component.height, "重置后height应该恢复到初始值").toBe(initialState.height);
      expect(imageComponent.left, "重置后left应该保持不变").toBe(initialState.left);
      expect(imageComponent.top, "重置后top应该保持不变").toBe(initialState.top);
      expect(imageComponent.component.width, "重置后width应该保持不变").toBe(initialState.width);
      expect(imageComponent.option.rotateY, "重置后rotateY应该保持不变").toBe(initialState.rotateY);
      expect(imageComponent.option.rotateZ, "重置后rotateZ应该保持不变").toBe(initialState.rotateZ);
    }
  });

  it("triggerResetToInitialState - 边界情况测试：没有初始状态配置", async () => {
    const { getCurrentAnimationList } = useStatusAnimationData();
    const { initAnimationAndComponentDefaultConfigMap } = useStatusAnimation();

    // 初始化状态动画系统
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    const animationId = animationList[0].id;

    // 清空初始状态配置
    const statusAnimationState = useStatusAnimationState();
    statusAnimationState.componentDefaultConfigMap.value.clear();

    const { triggerResetToInitialState } = useAnimationTrigger(statusAnimationState);

    // 触发重置，应该不会报错
    await expect(triggerResetToInitialState(animationId, "0")).resolves.not.toThrow();

    // 验证没有执行任何操作（因为没有初始状态配置）
    expect(statusAnimationState.componentDefaultConfigMap.value.size, "初始状态配置应该为空").toBe(0);
  });

  it("triggerResetToInitialState - 边界情况测试：动画不存在", async () => {
    const { initAnimationAndComponentDefaultConfigMap } = useStatusAnimation();

    // 初始化状态动画系统
    initAnimationAndComponentDefaultConfigMap();

    const statusAnimationState = useStatusAnimationState();
    const { triggerResetToInitialState } = useAnimationTrigger(statusAnimationState);

    // 使用不存在的动画ID触发重置
    await expect(triggerResetToInitialState("non-existent-animation", "0")).resolves.not.toThrow();
  });

  it("triggerResetToInitialState - 边界情况测试：动画没有状态", async () => {
    const { getCurrentAnimationList, componentAnimations, animations, statusAnimations, updateAnimationState } =
      useStatusAnimationData();
    const { initAnimationAndComponentDefaultConfigMap } = useStatusAnimation();

    // 初始化状态动画系统
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    const animationId = animationList[0].id;

    // 清空动画的状态 - 使用正确的方式修改响应式对象
    const currentState = {
      animations: { ...animations.value },
      statusAnimations: { ...statusAnimations.value },
      componentAnimations: { ...componentAnimations.value }
    };
    currentState.componentAnimations[animationId] = {};
    updateAnimationState(currentState);

    const statusAnimationState = useStatusAnimationState();
    const { triggerResetToInitialState } = useAnimationTrigger(statusAnimationState);

    // 触发重置，应该不会报错
    await expect(triggerResetToInitialState(animationId, "0")).resolves.not.toThrow();
  });

  it("triggerComponentResetWithAnimation - 边界情况测试：组件不存在", async () => {
    const { getCurrentAnimationList, getCurrentStatusList } = useStatusAnimationData();
    const { initAnimationAndComponentDefaultConfigMap } = useStatusAnimation();

    // 初始化状态动画系统
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    const statusList = getCurrentStatusList.value;

    // 确保状态列表不为空
    if (statusList.length === 0) {
      console.warn("状态列表为空，跳过此测试");
      return;
    }

    const statusAnimationState = useStatusAnimationState();
    const { triggerComponentResetWithAnimation } = useAnimationTrigger(statusAnimationState);

    // 创建一个不存在的组件的默认配置
    const mockDefaultConfig = {
      id: "non-existent-component",
      left: 100,
      top: 100,
      width: 200,
      height: 200,
      option: { opacity: 1, rotateX: 0, rotateY: 0, rotateZ: 0 },
      display: true,
      zIndex: 1
    };

    // 触发不存在的组件重置，应该不会报错
    await expect(
      triggerComponentResetWithAnimation({
        componentId: "non-existent-component",
        defaultConfig: mockDefaultConfig as any,
        duration: 1000,
        animationId: animationList[0].id,
        statusId: statusList[0].statusId
      })
    ).resolves.not.toThrow();
  });

  it("triggerComponentResetWithAnimation - 边界情况测试：组件不可见", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化状态动画系统
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件到状态动画
    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 设置组件为不可见
    imageComponent.display = false;

    const statusAnimationState = useStatusAnimationState();
    const { triggerComponentResetWithAnimation } = useAnimationTrigger(statusAnimationState);

    // 获取组件的默认配置
    const defaultConfig = statusAnimationState.componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(defaultConfig, "应该能找到组件的默认配置").toBeDefined();

    if (defaultConfig) {
      // 触发组件重置
      await triggerComponentResetWithAnimation({
        componentId: `${imageComponent.id}`,
        defaultConfig,
        duration: 1000,
        animationId: animationList[0].id,
        statusId: statusList[0].statusId
      });

      // 验证组件已变为可见
      expect(imageComponent.display, "重置后组件应该变为可见").toBe(true);
    }
  });

  it("重置功能集成测试：多个组件同时重置", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      updatePropertyValueImpl
    } = useStatusAnimation();

    // 获取前两个组件进行测试
    const component1 = groupData.value[0];
    const component2 = groupData.value[1];

    // 初始化状态动画系统
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加两个组件到状态动画
    await handleComponentAddToStatusAnimation({ component: component1 });
    await handleComponentAddToStatusAnimation({ component: component2 });

    // 为两个组件添加不同的过渡属性
    await addTransitionPropertiesForComponent(`${component1.id}`, ["opacity", "left"]);
    await addTransitionPropertiesForComponent(`${component2.id}`, ["width", "top"]);

    // 记录两个组件的初始状态
    const initialState1 = {
      left: component1.left,
      opacity: component1.option.opacity
    };

    const initialState2 = {
      width: component2.component.width,
      top: component2.top
    };

    // 修改状态动画配置
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;

    await updatePropertyValueImpl({
      componentId: `${component1.id}`,
      statusId,
      property: "opacity",
      value: 0.2
    });
    await updatePropertyValueImpl({
      componentId: `${component1.id}`,
      statusId,
      property: "left",
      value: 800
    });
    await updatePropertyValueImpl({
      componentId: `${component2.id}`,
      statusId,
      property: "width",
      value: 420
    });
    await updatePropertyValueImpl({
      componentId: `${component2.id}`,
      statusId,
      property: "top",
      value: 100
    });

    // 先触发状态动画，使两个组件状态都改变
    const result1 = await testUtils.triggerStatusAnimation(`${component1.id}`, animationId, statusId);
    const result2 = await testUtils.triggerStatusAnimation(`${component2.id}`, animationId, statusId);

    // 验证两个组件状态都已改变
    expect(result1.animationExecuted, "组件1动画应该被执行").toBe(true);
    expect(result2.animationExecuted, "组件2动画应该被执行").toBe(true);
    expect(component1.option.opacity, "组件1 opacity应该被修改").toBe(0.2);
    expect(component1.left, "组件1 left应该被修改").toBe(800);
    expect(component2.component.width, "组件2 width应该被修改").toBe(420);
    expect(component2.top, "组件2 top应该被修改").toBe(100);

    // 使用重置功能
    const statusAnimationState = useStatusAnimationState();
    const { triggerResetToInitialState } = useAnimationTrigger(statusAnimationState);

    // 触发重置到初始状态
    await triggerResetToInitialState(animationId, "0");

    // 验证两个组件都已恢复到初始状态
    expect(component1.option.opacity, "重置后组件1 opacity应该恢复到初始值").toBe(initialState1.opacity);
    expect(component1.left, "重置后组件1 left应该恢复到初始值").toBe(initialState1.left);
    expect(component2.component.width, "重置后组件2 width应该恢复到初始值").toBe(initialState2.width);

    // 注意：如果初始状态中 rotateX 是 undefined，重置后也应该是 undefined
    expect(component2.top, "重置后组件2 top应该恢复到初始值").toBe(initialState2.top);
  });
});
