import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "./test-utils";

import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画触发测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("组件动画触发时按需赋值属性测试", async () => {
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

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件（仅 zIndex 和 componentId）
    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 只添加 opacity 和 left 属性
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]);

    // 记录组件初始状态的关键属性
    const initialState = {
      left: imageComponent.left,
      top: imageComponent.top,
      width: imageComponent.width,
      height: imageComponent.height,
      componentWidth: imageComponent.component.width,
      componentHeight: imageComponent.component.height,
      opacity: imageComponent.option.opacity,
      rotateX: imageComponent.option.rotateX,
      rotateY: imageComponent.option.rotateY,
      rotateZ: imageComponent.option.rotateZ,
      display: imageComponent.display,
      zIndex: imageComponent.zIndex
    };

    // 修改状态动画配置中的属性值，使其与当前组件状态不同
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;

    // 使用正确的 immer 方法来更新组件动画配置
    const originalComponentConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    const updatedComponentAnimations = {
      ...componentAnimations.value[animationId][statusId],
      [imageComponent.id]: {
        ...originalComponentConfig,
        opacity: 0.5, // 假设原来是 1
        left: 999 // 假设原来不是 999
      }
    };

    setComponentAnimations(animationId, statusId, updatedComponentAnimations);

    // 创建状态实例并传递给 AnimationTestHelper
    const result = await testUtils.triggerStatusAnimation(`${imageComponent.id}`, animationId, statusId);

    // 验证动画执行成功
    expect(result.animationExecuted, "动画应该被执行").toBe(true);
    expect(result.stateApplied, "状态应该被应用").toBe(true);
    expect(result.styleCreated, "样式应该被创建").toBe(true);
    expect(result.styleCleaned, "样式应该被清理").toBe(true);

    // 验证只有添加的属性被修改
    expect(imageComponent.option.opacity, "opacity属性应该被修改").toBe(0.5);
    expect(imageComponent.left, "left属性应该被修改").toBe(999);

    // 验证未添加的属性保持不变
    expect(imageComponent.top, "top属性应该保持不变").toBe(initialState.top);
    expect(imageComponent.width, "width属性应该保持不变").toBe(initialState.width);
    expect(imageComponent.height, "height属性应该保持不变").toBe(initialState.height);
    expect(imageComponent.component.width, "component.width应该保持不变").toBe(initialState.componentWidth);
    expect(imageComponent.component.height, "component.height应该保持不变").toBe(initialState.componentHeight);
    // 注意：因为 option 对象被重新创建，未在动画配置中的嵌套属性会是 undefined
    // 但我们应该检查这些属性是否被正确保持为原始值
    expect(imageComponent.option.rotateX, "rotateX应该保持原始值").toBe(initialState.rotateX);
    expect(imageComponent.option.rotateY, "rotateY应该保持原始值").toBe(initialState.rotateY);
    expect(imageComponent.option.rotateZ, "rotateZ应该保持原始值").toBe(initialState.rotateZ);
    expect(imageComponent.display, "display应该保持不变").toBe(initialState.display);
  });

  it("组件动画触发时嵌套属性按需赋值测试", async () => {
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

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件
    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 只添加 width 和 rotateX 属性
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["width", "rotateX"]);

    // 记录组件初始状态的关键属性
    const initialState = {
      left: imageComponent.left,
      top: imageComponent.top,
      width: imageComponent.width,
      height: imageComponent.height,
      componentWidth: imageComponent.component.width,
      componentHeight: imageComponent.component.height,
      opacity: imageComponent.option.opacity,
      rotateX: imageComponent.option.rotateX,
      rotateY: imageComponent.option.rotateY,
      rotateZ: imageComponent.option.rotateZ
    };

    // 修改状态动画配置中的属性值
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;

    // 使用正确的 immer 方法来更新组件动画配置
    const originalComponentConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    const updatedComponentAnimations = {
      ...componentAnimations.value[animationId][statusId],
      [imageComponent.id]: {
        ...originalComponentConfig,
        width: 888,
        rotateX: 45
      }
    };

    setComponentAnimations(animationId, statusId, updatedComponentAnimations);

    // 创建状态实例并传递给 AnimationTestHelper
    const result = await testUtils.triggerStatusAnimation(`${imageComponent.id}`, animationId, statusId);

    // 验证动画执行成功
    expect(result.animationExecuted, "动画应该被执行").toBe(true);
    expect(result.stateApplied, "状态应该被应用").toBe(true);
    expect(result.styleCreated, "样式应该被创建").toBe(true);
    expect(result.styleCleaned, "样式应该被清理").toBe(true);

    // 验证添加的属性被修改
    expect(imageComponent.component.width, "component.width属性应该被修改").toBe(888);
    expect(imageComponent.option.rotateX, "rotateX属性应该被修改").toBe(45);

    // 验证未添加的属性保持不变或为undefined
    expect(imageComponent.left, "left属性应该保持不变").toBe(initialState.left);
    expect(imageComponent.top, "top属性应该保持不变").toBe(initialState.top);
    expect(imageComponent.height, "height属性应该保持不变").toBe(initialState.height);
    // 注意：因为 component 对象被重新创建，未在动画配置中的嵌套属性应该是原始值
    expect(imageComponent.component.height, "component.height应该保持原始值").toBe(initialState.componentHeight);
    // 注意：因为 option 对象被重新创建，未在动画配置中的嵌套属性应该是原始值
    expect(imageComponent.option.opacity, "opacity应该保持原始值").toBe(initialState.opacity);
    expect(imageComponent.option.rotateY, "rotateY应该保持原始值").toBe(initialState.rotateY);
    expect(imageComponent.option.rotateZ, "rotateZ应该保持原始值").toBe(initialState.rotateZ);
  });

  it("组件动画触发时未添加任何属性的安全性测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件（仅 zIndex 和 componentId，不添加其他属性）
    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 记录组件初始状态的所有关键属性
    const initialState = {
      left: imageComponent.left,
      top: imageComponent.top,
      width: imageComponent.width,
      height: imageComponent.height,
      componentWidth: imageComponent.component.width,
      componentHeight: imageComponent.component.height,
      opacity: imageComponent.option.opacity,
      rotateX: imageComponent.option.rotateX,
      rotateY: imageComponent.option.rotateY,
      rotateZ: imageComponent.option.rotateZ,
      display: imageComponent.display,
      zIndex: imageComponent.zIndex
    };

    // 使用 AnimationTestHelper 触发状态动画
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    const result = await testUtils.triggerStatusAnimation(`${imageComponent.id}`, animationId, statusId);

    // 验证动画执行成功
    expect(result.animationExecuted, "动画应该被执行").toBe(true);
    expect(result.stateApplied, "状态应该被应用").toBe(true);
    expect(result.styleCreated, "样式应该被创建").toBe(true);
    expect(result.styleCleaned, "样式应该被清理").toBe(true);

    // 验证所有属性都保持不变（除了可能的 zIndex，因为它是默认添加的）
    expect(imageComponent.left, "left属性应该保持不变").toBe(initialState.left);
    expect(imageComponent.top, "top属性应该保持不变").toBe(initialState.top);
    expect(imageComponent.width, "width属性应该保持不变").toBe(initialState.width);
    expect(imageComponent.height, "height属性应该保持不变").toBe(initialState.height);
    expect(imageComponent.component.width, "component.width应该保持不变").toBe(initialState.componentWidth);
    expect(imageComponent.component.height, "component.height应该保持不变").toBe(initialState.componentHeight);
    expect(imageComponent.option.opacity, "opacity应该保持不变").toBe(initialState.opacity);
    expect(imageComponent.option.rotateX, "rotateX应该保持不变").toBe(initialState.rotateX);
    expect(imageComponent.option.rotateY, "rotateY应该保持不变").toBe(initialState.rotateY);
    expect(imageComponent.option.rotateZ, "rotateZ应该保持不变").toBe(initialState.rotateZ);
    expect(imageComponent.display, "display应该保持不变").toBe(initialState.display);
  });
});
