import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "./test-utils";

import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useCacheData } from "@/views/build/useCacheData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画缓存数据测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("应该在状态动画编辑器可见时正确处理组件缓存和恢复", async () => {
    const { groupData, allComponentMap } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, setEditorVisible } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      triggerSingleComponentAnimation
    } = useStatusAnimation();
    const { processStatusAnimationEditorCache } = useCacheData();

    const imageComponent = groupData.value[0];
    const componentId = imageComponent.id.toString();

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 确保编辑器可见
    setEditorVisible(true);

    // 添加组件并添加部分过渡属性（不是所有属性）
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(componentId, ["left", "opacity"]); // 只添加部分属性

    // 记录初始状态
    const originalLeft = imageComponent.left;
    const originalOpacity = imageComponent.option.opacity;
    const originalWidth = imageComponent.component.width; // 这个属性不在过渡属性中
    const originalHeight = imageComponent.component.height; // 这个属性不在过渡属性中
    const originalTop = imageComponent.top; // 这个属性不在过渡属性中
    const originalZIndex = imageComponent.zIndex; // 这个属性不在过渡属性中

    // 触发状态动画，修改组件状态
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    await triggerSingleComponentAnimation(componentId, animationId, statusId);

    // 验证动画后组件状态发生了变化（只有过渡属性会变化）
    const componentAfterAnimation = allComponentMap.value.get(componentId);
    expect(componentAfterAnimation).toBeDefined();

    // 手动修改一些非过渡属性，模拟用户操作
    imageComponent.component.width = originalWidth + 100; // 修改非过渡属性
    imageComponent.component.height = originalHeight + 50; // 修改非过渡属性
    imageComponent.top = originalTop + 20; // 修改非过渡属性

    // 调用 processStatusAnimationEditorCache 处理缓存
    processStatusAnimationEditorCache();

    // 验证组件被恢复到备份状态，但非过渡属性应该保留当前值
    const componentAfterCache = allComponentMap.value.get(componentId);
    expect(componentAfterCache).toBeDefined();

    // 验证非过渡属性被保留（因为它们不在动画配置中）
    expect(componentAfterCache!.component.width).toBe(originalWidth + 100); // 非过渡属性保持修改后的值
    expect(componentAfterCache!.component.height).toBe(originalHeight + 50); // 非过渡属性保持修改后的值
    expect(componentAfterCache!.top).toBe(originalTop + 20); // 非过渡属性保持修改后的值

    // 验证过渡属性被恢复到备份状态（原始状态）
    expect(componentAfterCache!.left).toBe(originalLeft); // 过渡属性被恢复
    expect(componentAfterCache!.option.opacity).toBe(originalOpacity); // 过渡属性被恢复

    // 基础属性应该保持不变
    expect(componentAfterCache!.zIndex).toBe(originalZIndex);
  });

  it("应该正确同步当前组件列表到渲染组件Map", async () => {
    const { groupData, allComponentMap } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, setEditorVisible } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent
    } = useStatusAnimation();
    const { processStatusAnimationEditorCache, syncCurrentComponentListToRenderMap } = useCacheData();

    const imageComponent = groupData.value[0];
    const componentId = imageComponent.id.toString();

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 确保编辑器可见
    setEditorVisible(true);

    // 添加组件并添加过渡属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(componentId, ["left", "opacity", "width"]);

    // 记录初始状态（在缓存处理之前）
    const originalLeft = imageComponent.left;
    const originalOpacity = imageComponent.option.opacity;
    const originalWidth = imageComponent.component.width;

    // 修改组件属性
    imageComponent.left = originalLeft + 200;
    imageComponent.option.opacity = originalOpacity - 0.4;
    imageComponent.component.width = originalWidth + 150;

    const modifiedLeft = imageComponent.left;
    const modifiedOpacity = imageComponent.option.opacity;
    const modifiedWidth = imageComponent.component.width;

    // 调用 processStatusAnimationEditorCache 生成缓存
    processStatusAnimationEditorCache();

    // 验证组件被恢复到备份状态
    const componentAfterCache = allComponentMap.value.get(componentId);
    expect(componentAfterCache!.left).toBe(originalLeft);
    expect(componentAfterCache!.option.opacity).toBe(originalOpacity);
    expect(componentAfterCache!.component.width).toBe(originalWidth);

    // 现在调用 syncCurrentComponentListToRenderMap 来恢复到修改后的状态
    syncCurrentComponentListToRenderMap();

    // 验证组件被恢复到修改后的状态
    const componentAfterSync = allComponentMap.value.get(componentId);
    expect(componentAfterSync!.left).toBe(modifiedLeft);
    expect(componentAfterSync!.option.opacity).toBe(modifiedOpacity);
    expect(componentAfterSync!.component.width).toBe(modifiedWidth);
  });

  it("应该在编辑器不可见时跳过缓存处理", async () => {
    const { groupData, allComponentMap } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, setEditorVisible } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent
    } = useStatusAnimation();
    const { processStatusAnimationEditorCache, syncCurrentComponentListToRenderMap } = useCacheData();

    const imageComponent = groupData.value[0];
    const componentId = imageComponent.id.toString();

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 设置编辑器不可见
    setEditorVisible(false);

    // 添加组件并添加过渡属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(componentId, ["left", "opacity"]);

    // 记录初始状态
    const originalLeft = imageComponent.left;
    const originalOpacity = imageComponent.option.opacity;

    // 修改组件属性
    imageComponent.left = originalLeft + 100;
    imageComponent.option.opacity = originalOpacity - 0.2;

    // 调用 processStatusAnimationEditorCache，但由于编辑器不可见，应该跳过处理
    processStatusAnimationEditorCache();

    // 验证组件状态没有被改变（因为编辑器不可见）
    const componentAfterCache = allComponentMap.value.get(componentId);
    expect(componentAfterCache!.left).toBe(originalLeft + 100); // 保持修改后的值
    expect(componentAfterCache!.option.opacity).toBe(originalOpacity - 0.2); // 保持修改后的值

    // 调用 syncCurrentComponentListToRenderMap 也应该跳过处理
    syncCurrentComponentListToRenderMap();

    // 验证组件状态仍然没有被改变
    const componentAfterSync = allComponentMap.value.get(componentId);
    expect(componentAfterSync!.left).toBe(originalLeft + 100);
    expect(componentAfterSync!.option.opacity).toBe(originalOpacity - 0.2);
  });

  it("应该正确处理只有部分属性在过渡配置中的情况", async () => {
    const { groupData, allComponentMap } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, setEditorVisible } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent
    } = useStatusAnimation();
    const { processStatusAnimationEditorCache } = useCacheData();

    const imageComponent = groupData.value[0];
    const componentId = imageComponent.id.toString();

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 确保编辑器可见
    setEditorVisible(true);

    // 添加组件但只添加一个过渡属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(componentId, ["left"]); // 只添加left属性

    // 记录初始状态
    const originalLeft = imageComponent.left;
    const originalOpacity = imageComponent.option.opacity;
    const originalWidth = imageComponent.component.width;
    const originalHeight = imageComponent.component.height;
    const originalTop = imageComponent.top;

    // 修改多个属性（包括过渡和非过渡属性）
    imageComponent.left = originalLeft + 80; // 过渡属性
    imageComponent.option.opacity = originalOpacity - 0.3; // 非过渡属性
    imageComponent.component.width = originalWidth + 120; // 非过渡属性
    imageComponent.component.height = originalHeight + 80; // 非过渡属性
    imageComponent.top = originalTop + 30; // 非过渡属性

    // 调用 processStatusAnimationEditorCache 处理缓存
    processStatusAnimationEditorCache();

    // 验证组件状态
    const componentAfterCache = allComponentMap.value.get(componentId);
    expect(componentAfterCache).toBeDefined();

    // 验证过渡属性被恢复到备份状态
    expect(componentAfterCache!.left).toBe(originalLeft); // left是过渡属性，应该被恢复

    // 验证非过渡属性保持修改后的值
    expect(componentAfterCache!.option.opacity).toBe(originalOpacity - 0.3); // opacity不是过渡属性，保持修改后的值
    expect(componentAfterCache!.component.width).toBe(originalWidth + 120); // width不是过渡属性，保持修改后的值
    expect(componentAfterCache!.component.height).toBe(originalHeight + 80); // height不是过渡属性，保持修改后的值
    expect(componentAfterCache!.top).toBe(originalTop + 30); // top不是过渡属性，保持修改后的值
  });
});
