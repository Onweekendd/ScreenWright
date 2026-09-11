import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "../test-utils";

import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画属性管理 - 重置操作测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("图片属性过渡后使用 resetComponentConfig 恢复默认值", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentDefaultConfigMap, resetComponentConfig } =
      useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      updatePropertyValueImpl,
      onAddAnimation,
      addStatus
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 假设是图片组件，如果不是跳过测试
    if (imageComponent.component.prop !== "swimg") {
      console.warn("当前组件不是图片组件，跳过图片属性测试");
      return;
    }

    initAnimationAndComponentDefaultConfigMap();

    await onAddAnimation({
      statusIndex: 2
    });

    await onAddAnimation({
      statusIndex: 3
    });

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[1].id);

    await addStatus();
    await addStatus();

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 记录原始图片值
    const originalImageValue = imageComponent.data[0].value;
    expect(originalImageValue, "应该有原始图片值").toBeDefined();

    // 验证备份中保存了原始值
    const backupComponent = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(backupComponent, "应该有组件备份").toBeDefined();
    expect(backupComponent!.data[0].value, "备份中应该保存原始图片值").toBe(originalImageValue);

    // 添加组件并设置图片属性过渡
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["image"]);

    // 使用 updatePropertyValueImpl 修改图片属性值（模拟用户在动画编辑器中修改了图片）
    const newImageValue = "https://example.com/new-animated-image.jpg";
    await updatePropertyValueImpl({
      componentId: `${imageComponent.id}`,
      statusId: statusList[1].statusId,
      property: "image",
      value: newImageValue
    });

    setSelectStatusId(statusList[1].statusId);
    const result = await testUtils.triggerStatusAnimation(
      `${imageComponent.id}`,
      animationList[1].id,
      statusList[1].statusId
    );

    expect(result.animationExecuted, "动画应该被执行").toBe(true);
    expect(result.stateApplied, "状态应该被应用").toBe(true);
    expect(result.styleCreated, "样式应该被创建").toBe(true);
    expect(result.styleCleaned, "样式应该被清理").toBe(true);

    // 验证动画配置中的图片值已经被修改
    const { componentAnimations } = useStatusAnimationData();
    const animationConfig = componentAnimations.value[animationList[1].id][statusList[1].statusId][imageComponent.id];
    expect(animationConfig.image, "动画配置中的图片值应该已被修改").toBe(newImageValue);
    expect(animationConfig.image, "动画配置中的图片值应该与原始值不同").not.toBe(originalImageValue);

    const backupComponent2 = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(backupComponent2!.data[0].value, "备份中的图片值应该未被修改").toBe(originalImageValue);

    // 调用 resetComponentConfig 恢复默认值
    resetComponentConfig();

    // 验证组件的图片值已恢复到原始默认值
    expect(imageComponent.data[0].value, "图片值应该恢复到原始默认值").toBe(originalImageValue);

    // 验证数组结构保持完整
    expect(Array.isArray(imageComponent.data), "data应该保持数组结构").toBe(true);
    expect(imageComponent.data.length, "data数组长度应该保持").toBeGreaterThan(0);
    expect(imageComponent.data[0], "data[0]应该存在").toBeDefined();
    expect(typeof imageComponent.data[0], "data[0]应该是对象").toBe("object");
  });

  it("图片属性过渡后使用 resetComponentConfig 恢复默认值 - 多属性同时测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentDefaultConfigMap, resetComponentConfig } =
      useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      updatePropertyValueImpl
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 假设是图片组件，如果不是跳过测试
    if (imageComponent.component.prop !== "swimg") {
      console.warn("当前组件不是图片组件，跳过图片属性测试");
      return;
    }

    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 记录所有原始值
    const originalValues = {
      image: imageComponent.data[0].value,
      opacity: imageComponent.option.opacity,
      left: imageComponent.left,
      width: imageComponent.width,
      componentWidth: imageComponent.component.width
    };

    // 验证备份中保存了原始值
    const backupComponent = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(backupComponent, "应该有组件备份").toBeDefined();
    expect(backupComponent!.data[0].value, "备份中应该保存原始图片值").toBe(originalValues.image);
    expect(backupComponent!.option.opacity, "备份中应该保存原始透明度").toBe(originalValues.opacity);
    expect(backupComponent!.left, "备份中应该保存原始left值").toBe(originalValues.left);
    expect(backupComponent!.width, "备份中应该保存原始width值").toBe(originalValues.width);
    expect(backupComponent!.component.width, "备份中应该保存原始component.width值").toBe(originalValues.componentWidth);

    // 添加组件并设置多个属性过渡
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["image", "opacity", "left", "width"]);

    // 使用 updatePropertyValueImpl 修改所有属性值
    const newValues = {
      image: "https://example.com/new-animated-image.jpg",
      opacity: 0.3,
      left: 999,
      width: 800
    };

    const componentId = `${imageComponent.id}`;
    const statusId = statusList[0].statusId;

    await updatePropertyValueImpl({ componentId, statusId, property: "image", value: newValues.image });
    await updatePropertyValueImpl({ componentId, statusId, property: "opacity", value: newValues.opacity });
    await updatePropertyValueImpl({ componentId, statusId, property: "left", value: newValues.left });
    await updatePropertyValueImpl({ componentId, statusId, property: "width", value: newValues.width });

    // 验证动画配置中的所有值已被修改
    const { componentAnimations } = useStatusAnimationData();
    const animationConfig = componentAnimations.value[animationList[0].id][statusId][componentId];
    expect(animationConfig.image, "动画配置中的图片值应该已被修改").toBe(newValues.image);
    expect(animationConfig.opacity, "动画配置中的透明度应该已被修改").toBe(newValues.opacity);
    expect(animationConfig.left, "动画配置中的left值应该已被修改").toBe(newValues.left);
    expect(animationConfig.width, "动画配置中的width值应该已被修改").toBe(newValues.width);

    // 调用 resetComponentConfig 恢复所有默认值
    resetComponentConfig();

    // 验证所有值都已恢复到原始默认值
    expect(imageComponent.data[0].value, "图片值应该恢复到原始默认值").toBe(originalValues.image);
    expect(imageComponent.option.opacity, "透明度应该恢复到原始默认值").toBe(originalValues.opacity);
    expect(imageComponent.left, "left值应该恢复到原始默认值").toBe(originalValues.left);
    expect(imageComponent.width, "width值应该恢复到原始默认值").toBe(originalValues.width);
    expect(imageComponent.component.width, "component.width值应该恢复到原始默认值").toBe(originalValues.componentWidth);

    // 验证复杂数据结构保持完整
    expect(Array.isArray(imageComponent.data), "data应该保持数组结构").toBe(true);
    expect(typeof imageComponent.option, "option应该保持对象结构").toBe("object");
    expect(typeof imageComponent.component, "component应该保持对象结构").toBe("object");
  });

  it("图片属性过渡后使用 resetComponentConfig 恢复默认值 - 边界情况测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { componentDefaultConfigMap, resetComponentConfig, getCurrentAnimationList, getCurrentStatusList } =
      useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      updatePropertyValueImpl
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    // 假设是图片组件，如果不是跳过测试
    if (imageComponent.component.prop !== "swimg") {
      console.warn("当前组件不是图片组件，跳过图片属性测试");
      return;
    }

    // 测试没有快照的情况下调用 resetComponentConfig
    expect(componentDefaultConfigMap.value.size, "初始时应该没有备份").toBe(0);

    // 记录当前值
    const currentImageValue = imageComponent.data[0].value;

    // 调用 resetComponentConfig（应该不会有任何影响）
    resetComponentConfig();

    // 验证值没有改变
    expect(imageComponent.data[0].value, "没有备份时值不应该改变").toBe(currentImageValue);

    // 初始化并设置状态动画，然后进行快照
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    if (animationList.length > 0) {
      setSelectAnimationId(animationList[0].id);

      const statusList = getCurrentStatusList.value;
      if (statusList.length > 0) {
        setSelectStatusId(statusList[0].statusId);

        await handleComponentAddToStatusAnimation({ component: imageComponent });

        // 验证快照已创建
        expect(componentDefaultConfigMap.value.has(`${imageComponent.id}`), "应该创建了组件备份").toBe(true);

        // 添加组件到状态动画并设置图片属性
        await handleComponentAddToStatusAnimation({ component: imageComponent });
        await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["image"]);

        // 使用 updatePropertyValueImpl 修改图片值
        const newImageValue = "https://example.com/modified-image.jpg";
        await updatePropertyValueImpl({
          componentId: `${imageComponent.id}`,
          statusId: statusList[0].statusId,
          property: "image",
          value: newImageValue
        });

        // 验证动画配置中的值已修改
        const { componentAnimations } = useStatusAnimationData();
        const animationConfig =
          componentAnimations.value[animationList[0].id][statusList[0].statusId][imageComponent.id];
        expect(animationConfig.image, "动画配置中的图片值应该已被修改").toBe(newImageValue);

        // 调用 resetComponentConfig 恢复
        resetComponentConfig();

        // 验证已恢复到快照时的值
        expect(imageComponent.data[0].value, "图片值应该恢复到快照时的值").toBe(currentImageValue);
      }
    }
  });
});
