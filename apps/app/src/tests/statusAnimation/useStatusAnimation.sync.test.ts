import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "./test-utils";

import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画配置同步测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("配置同步应该使用生成器反向提取现有属性", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      syncComponentConfigDirect
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并添加特定属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left", "width"]);

    // 修改组件的属性值
    imageComponent.left = 999;
    imageComponent.option.opacity = 0.3;
    imageComponent.component.width = 888;

    // 使用配置同步功能（非防抖版本）
    await syncComponentConfigDirect(imageComponent);

    // 验证只有已存在的属性被同步
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    const syncedConfig = componentAnimations.value[animationId][statusId][imageComponent.id];

    // 验证已存在的属性被正确同步
    expect(syncedConfig.left).toBe(999);
    expect(syncedConfig.opacity).toBe(0.3);
    expect(syncedConfig.width).toBe(888);

    // 验证componentId始终正确
    expect(syncedConfig.componentId).toBe(`${imageComponent.id}`);

    // 验证未添加的属性不存在（除了zIndex和componentId这些基础属性）
    expect(syncedConfig.top).toBeUndefined();
    expect(syncedConfig.height).toBeUndefined();
    expect(syncedConfig.rotateX).toBeUndefined();
  });

  it("配置同步应该只提取模板指定的属性", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      syncComponentConfigDirect
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件，只添加部分属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["left", "opacity"]);

    // 修改组件的多个属性（包括未添加到动画中的属性）
    imageComponent.left = 500;
    imageComponent.option.opacity = 0.5;
    imageComponent.component.width = 600; // 这个属性没有添加到动画中
    imageComponent.option.rotateX = 45; // 这个属性也没有添加到动画中

    // 使用配置同步功能（非防抖版本）
    await syncComponentConfigDirect(imageComponent);

    // 获取同步后的配置
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    const syncedConfig = componentAnimations.value[animationId][statusId][imageComponent.id];

    // 验证只有已存在的属性被同步
    expect(syncedConfig.left).toBe(500); // 已存在，应该被同步
    expect(syncedConfig.opacity).toBe(0.5); // 已存在，应该被同步

    // 验证未添加到动画中的属性不会被同步到配置中
    expect(syncedConfig.width).toBeUndefined();
    expect(syncedConfig.rotateX).toBeUndefined();

    // 验证基础属性存在
    expect(syncedConfig.zIndex).toBeDefined();
    expect(syncedConfig.componentId).toBe(`${imageComponent.id}`);
  });

  it("配置同步应该正确处理图片属性", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      syncComponentConfigDirect
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并添加图片属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["left", "image"]);

    // 修改组件的图片数据
    imageComponent.data[0].value = "https://example.com/test-image.jpg";
    imageComponent.left = 300;

    // 使用配置同步功能（非防抖版本）
    await syncComponentConfigDirect(imageComponent);

    // 获取同步后的配置
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    const syncedConfig = componentAnimations.value[animationId][statusId][imageComponent.id];

    // 验证图片属性使用传统方法处理（仍然能正确同步）
    expect(syncedConfig.image).toBe("https://example.com/test-image.jpg");
    expect(syncedConfig.left).toBe(300);

    // 验证componentId正确
    expect(syncedConfig.componentId).toBe(`${imageComponent.id}`);
  });

  it("配置同步应该处理复合映射属性", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      syncComponentConfigDirect
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并添加复合映射属性（width和height）
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["width", "height", "left"]);

    // 修改组件的尺寸
    imageComponent.component.width = 800;
    imageComponent.component.height = 600;
    imageComponent.left = 400;

    // 使用配置同步功能（非防抖版本）
    await syncComponentConfigDirect(imageComponent);

    // 获取同步后的配置
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    const syncedConfig = componentAnimations.value[animationId][statusId][imageComponent.id];

    // 验证复合映射属性被正确同步
    expect(syncedConfig.width).toBe(800);
    expect(syncedConfig.height).toBe(600);
    expect(syncedConfig.left).toBe(400);

    // 验证componentId正确
    expect(syncedConfig.componentId).toBe(`${imageComponent.id}`);
  });

  it("配置同步应该处理嵌套映射属性", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      syncComponentConfigDirect
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并添加嵌套映射属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "rotateX", "rotateY"]);

    // 修改组件的嵌套属性
    imageComponent.option.opacity = 0.7;
    imageComponent.option.rotateX = 45;
    imageComponent.option.rotateY = 90;

    // 使用配置同步功能（非防抖版本）
    await syncComponentConfigDirect(imageComponent);

    // 获取同步后的配置
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    const syncedConfig = componentAnimations.value[animationId][statusId][imageComponent.id];

    // 验证嵌套映射属性被正确同步
    expect(syncedConfig.opacity).toBe(0.7);
    expect(syncedConfig.rotateX).toBe(45);
    expect(syncedConfig.rotateY).toBe(90);

    // 验证未添加的嵌套属性不存在
    expect(syncedConfig.rotateZ).toBeUndefined();

    // 验证componentId正确
    expect(syncedConfig.componentId).toBe(`${imageComponent.id}`);
  });

  it("配置同步应该只在绑定的状态动画属性改变时才更新 - 模拟正常操作", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      syncComponentConfigDirect
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并添加特定属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["left", "opacity"]);

    // 记录初始配置
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    const initialConfig = componentAnimations.value[animationId][statusId][imageComponent.id];

    // 场景1：不修改任何属性，直接同步 - 应该返回失败状态
    const result1 = await syncComponentConfigDirect(imageComponent);
    expect(result1.success).toBe(false);
    expect(result1.message).toBe("组件动画配置未发生变化");

    // 场景2：修改一个未绑定的属性，然后同步 - 应该返回失败状态
    const originalWidth = imageComponent.component.width;
    imageComponent.component.width = originalWidth + 100; // 只修改未绑定的width属性

    const result2 = await syncComponentConfigDirect(imageComponent);
    expect(result2.success).toBe(false);
    expect(result2.message).toBe("组件动画配置未发生变化");

    // 验证配置确实没有变化
    const configAfterWidthChange = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterWidthChange.left).toBe(initialConfig.left);
    expect(configAfterWidthChange.opacity).toBe(initialConfig.opacity);
    expect(configAfterWidthChange.width).toBeUndefined(); // 未绑定的属性不应被同步

    // 场景3：修改一个已绑定的属性，然后同步 - 应该返回成功状态
    const originalLeft = imageComponent.left;
    imageComponent.left = originalLeft + 50; // 只修改已绑定的left属性

    const result3 = await syncComponentConfigDirect(imageComponent);
    expect(result3.success).toBe(true);
    expect(result3.message).toBe("组件动画配置已添加");

    // 验证left属性被成功同步
    const configAfterLeftChange = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterLeftChange.left).toBe(originalLeft + 50);
    expect(configAfterLeftChange.opacity).toBe(initialConfig.opacity); // opacity保持不变

    // 场景4：修改另一个已绑定的属性，然后同步 - 应该返回成功状态
    const originalOpacity = imageComponent.option.opacity;
    imageComponent.option.opacity = originalOpacity - 0.2; // 只修改已绑定的opacity属性

    const result4 = await syncComponentConfigDirect(imageComponent);
    expect(result4.success).toBe(true);
    expect(result4.message).toBe("组件动画配置已添加");

    // 验证opacity属性被成功同步
    const configAfterOpacityChange = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterOpacityChange.left).toBe(originalLeft + 50); // left保持上次的值
    expect(configAfterOpacityChange.opacity).toBe(originalOpacity - 0.2);

    // 场景5：再次同步相同的值 - 应该返回失败状态（配置未变化）
    const result5 = await syncComponentConfigDirect(imageComponent);
    expect(result5.success).toBe(false);
    expect(result5.message).toBe("组件动画配置未发生变化");

    // 场景6：修改另一个未绑定的属性，然后同步 - 应该返回失败状态
    imageComponent.component.height = 800; // 只修改未绑定的height属性

    const result6 = await syncComponentConfigDirect(imageComponent);
    expect(result6.success).toBe(false);
    expect(result6.message).toBe("组件动画配置未发生变化");

    // 验证height属性未被同步，其他属性保持不变
    const finalConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(finalConfig.left).toBe(originalLeft + 50); // left保持上次的值
    expect(finalConfig.opacity).toBe(originalOpacity - 0.2); // opacity保持上次的值
    expect(finalConfig.height).toBeUndefined(); // height未被同步
  });

  it("配置同步应该正确区分绑定和未绑定属性的变化 - 模拟正常操作", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      syncComponentConfigDirect
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件，只绑定部分属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["left", "width"]); // 只绑定left和width

    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;

    // 场景1：先修改一个绑定的属性，然后同步
    const originalLeft = imageComponent.left;
    imageComponent.left = originalLeft + 50; // 修改绑定的属性

    const result1 = await syncComponentConfigDirect(imageComponent);
    expect(result1.success).toBe(true);
    expect(result1.message).toBe("组件动画配置已添加");

    // 验证left属性被同步
    const configAfterLeftChange = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterLeftChange.left).toBe(originalLeft + 50);

    // 场景2：修改一个未绑定的属性，然后同步
    imageComponent.top = 999; // 修改未绑定的属性

    const result2 = await syncComponentConfigDirect(imageComponent);
    expect(result2.success).toBe(false);
    expect(result2.message).toBe("组件动画配置未发生变化");

    // 验证top属性未被同步，left保持不变
    const configAfterTopChange = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterTopChange.left).toBe(originalLeft + 50); // left保持不变
    expect(configAfterTopChange.top).toBeUndefined(); // top未被同步

    // 场景3：修改另一个绑定的属性，然后同步
    const originalWidth = imageComponent.component.width;
    imageComponent.component.width = originalWidth + 100; // 修改绑定的属性

    const result3 = await syncComponentConfigDirect(imageComponent);
    expect(result3.success).toBe(true);
    expect(result3.message).toBe("组件动画配置已添加");

    // 验证width属性被同步，left保持上次的值
    const configAfterWidthChange = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterWidthChange.left).toBe(originalLeft + 50); // left保持上次的值
    expect(configAfterWidthChange.width).toBe(originalWidth + 100); // width被同步

    // 场景4：修改另一个未绑定的属性，然后同步
    imageComponent.component.height = 888; // 修改未绑定的属性

    const result4 = await syncComponentConfigDirect(imageComponent);
    expect(result4.success).toBe(false);
    expect(result4.message).toBe("组件动画配置未发生变化");

    // 验证height属性未被同步，其他属性保持不变
    const finalConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(finalConfig.left).toBe(originalLeft + 50); // left保持不变
    expect(finalConfig.width).toBe(originalWidth + 100); // width保持不变
    expect(finalConfig.height).toBeUndefined(); // height未被同步
    expect(finalConfig.top).toBeUndefined(); // top依然未被同步
  });

  it("配置同步应该在属性被删除后失效 - 模拟正常操作", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      removeTransitionPropertiesForComponent,
      syncComponentConfigDirect
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并添加多个属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["left", "opacity", "width", "height"]);

    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;

    // 场景1：修改所有绑定的属性，验证同步成功
    const originalLeft = imageComponent.left;
    const originalOpacity = imageComponent.option.opacity;
    const originalWidth = imageComponent.component.width;
    const originalHeight = imageComponent.component.height;

    imageComponent.left = originalLeft + 100;

    const result1 = await syncComponentConfigDirect(imageComponent);
    expect(result1.success).toBe(true);
    expect(result1.message).toBe("组件动画配置已添加");

    // 验证left属性被同步
    const configAfterLeftChange = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterLeftChange.left).toBe(originalLeft + 100);

    // 场景2：修改opacity属性，验证同步成功
    imageComponent.option.opacity = originalOpacity - 0.3;

    const result2 = await syncComponentConfigDirect(imageComponent);
    expect(result2.success).toBe(true);
    expect(result2.message).toBe("组件动画配置已添加");

    // 验证opacity属性被同步
    const configAfterOpacityChange = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterOpacityChange.left).toBe(originalLeft + 100); // left保持不变
    expect(configAfterOpacityChange.opacity).toBe(originalOpacity - 0.3);

    // 场景3：删除部分属性（left和width）
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["left", "width"]);

    // 验证属性被删除
    const configAfterRemoval = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterRemoval.left).toBeUndefined(); // left被删除
    expect(configAfterRemoval.width).toBeUndefined(); // width被删除
    expect(configAfterRemoval.opacity).toBe(originalOpacity - 0.3); // opacity仍然存在
    expect(configAfterRemoval.height).toBeDefined(); // height仍然存在

    // 场景4：修改被删除的属性（left），验证同步失败
    imageComponent.left = originalLeft + 200;

    const result4 = await syncComponentConfigDirect(imageComponent);
    expect(result4.success).toBe(false);
    expect(result4.message).toBe("组件动画配置未发生变化");

    // 验证left属性未被同步（因为已被删除）
    const configAfterDeletedLeftChange = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterDeletedLeftChange.left).toBeUndefined(); // left仍然不存在
    expect(configAfterDeletedLeftChange.opacity).toBe(originalOpacity - 0.3); // opacity保持不变

    // 场景5：修改另一个被删除的属性（width），验证同步失败
    imageComponent.component.width = originalWidth + 200;

    const result5 = await syncComponentConfigDirect(imageComponent);
    expect(result5.success).toBe(false);
    expect(result5.message).toBe("组件动画配置未发生变化");

    // 验证width属性未被同步（因为已被删除）
    const configAfterDeletedWidthChange = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterDeletedWidthChange.width).toBeUndefined(); // width仍然不存在
    expect(configAfterDeletedWidthChange.opacity).toBe(originalOpacity - 0.3); // opacity保持不变

    // 场景6：修改仍然存在的属性（opacity），验证同步成功
    imageComponent.option.opacity = originalOpacity - 0.5;

    const result6 = await syncComponentConfigDirect(imageComponent);
    expect(result6.success).toBe(true);
    expect(result6.message).toBe("组件动画配置已添加");

    // 验证opacity属性被成功同步
    const configAfterExistingOpacityChange = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(configAfterExistingOpacityChange.opacity).toBe(originalOpacity - 0.5);
    expect(configAfterExistingOpacityChange.left).toBeUndefined(); // left仍然不存在
    expect(configAfterExistingOpacityChange.width).toBeUndefined(); // width仍然不存在

    // 场景7：修改另一个仍然存在的属性（height），验证同步成功
    imageComponent.component.height = originalHeight + 150;

    const result7 = await syncComponentConfigDirect(imageComponent);
    expect(result7.success).toBe(true);
    expect(result7.message).toBe("组件动画配置已添加");

    // 验证height属性被成功同步
    const finalConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(finalConfig.height).toBe(originalHeight + 150);
    expect(finalConfig.opacity).toBe(originalOpacity - 0.5); // opacity保持上次的值
    expect(finalConfig.left).toBeUndefined(); // left仍然不存在
    expect(finalConfig.width).toBeUndefined(); // width仍然不存在
  });
});
