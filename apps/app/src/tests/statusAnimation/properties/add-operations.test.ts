import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "../test-utils";

import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画属性管理 - 添加操作测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("添加属性时跳过已存在的属性 - 基本功能测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并设置初始属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]);

    // 验证初始属性已添加
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    let componentConfig = componentAnimations.value[animationId][statusId][imageComponent.id];

    expect(componentConfig.opacity, "opacity属性已添加").toBeDefined();
    expect(componentConfig.left, "left属性已添加").toBeDefined();

    // 记录初始值
    const initialOpacity = componentConfig.opacity;
    const initialLeft = componentConfig.left;

    // 尝试再次添加相同的属性（应该跳过）
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]);

    // 验证属性值没有被覆盖
    componentConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(componentConfig.opacity, "opacity属性值未被覆盖").toBe(initialOpacity);
    expect(componentConfig.left, "left属性值未被覆盖").toBe(initialLeft);

    // 添加部分新属性和部分已存在属性的混合列表
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "top", "width"]); // opacity已存在，top和width是新的

    componentConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(componentConfig.opacity, "opacity属性值仍未被覆盖").toBe(initialOpacity);
    expect(componentConfig.top, "新属性top已添加").toBeDefined();
    expect(componentConfig.width, "新属性width已添加").toBeDefined();
  });

  it("添加属性时跳过已存在的属性 - 多状态一致性测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      addStatus
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件和初始属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity"]);

    // 添加新状态
    await addStatus();

    const updatedStatusList = getCurrentStatusList.value;
    expect(updatedStatusList.length, "现在有2个状态").toBe(2);

    // 尝试添加已存在的属性到所有状态
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]); // opacity已存在，left是新的

    // 验证所有状态中的属性
    const animationId = animationList[0].id;
    updatedStatusList.forEach((status) => {
      const config = componentAnimations.value[animationId][status.statusId][imageComponent.id];
      expect(config.opacity, `状态${status.statusName}有opacity属性`).toBeDefined();
      expect(config.left, `状态${status.statusName}有新的left属性`).toBeDefined();
    });
  });

  it("添加属性时跳过已存在的属性 - 完全跳过测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件和初始属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]);

    // 记录添加后的配置
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    const initialConfig = { ...componentAnimations.value[animationId][statusId][imageComponent.id] };

    // 尝试添加完全相同的属性列表（应该完全跳过）
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]);

    // 验证配置完全未变
    const finalConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(finalConfig, "配置应该完全未变").toEqual(initialConfig);
  });

  it("添加属性时跳过已存在的属性 - 空列表和边界情况测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 测试空属性列表
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, []);
    // 应该正常执行，不会报错

    // 测试添加到空组件（组件存在但没有动画属性）
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity"]);
    // 应该正常添加，因为没有已存在的属性
  });

  it("添加属性时备份组件属性值更新测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentDefaultConfigMap } = useStatusAnimationData();
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

    // 添加组件并设置初始属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]);

    // 记录初始备份值
    const initialBackup = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(initialBackup, "应该有初始备份").toBeDefined();
    const initialOpacity = initialBackup!.option.opacity;
    const initialLeft = initialBackup!.left;

    // 直接修改组件属性值（模拟用户在属性面板中修改）
    imageComponent.option.opacity = 0.8;
    imageComponent.left = 500;

    // 验证组件值已修改
    expect(imageComponent.option.opacity, "组件opacity值已修改").toBe(0.8);
    expect(imageComponent.left, "组件left值已修改").toBe(500);

    // 删除所有属性（这会触发备份更新）
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]);

    // 验证组件值被恢复到备份值
    expect(imageComponent.option.opacity, "删除后opacity应该恢复到初始备份值").toBe(initialOpacity);
    expect(imageComponent.left, "删除后left应该恢复到初始备份值").toBe(initialLeft);

    // 再次修改组件属性值
    imageComponent.option.opacity = 0.9;
    imageComponent.left = 600;

    // 验证组件值已修改
    expect(imageComponent.option.opacity, "第二次修改opacity值").toBe(0.9);
    expect(imageComponent.left, "第二次修改left值").toBe(600);

    // 重新添加属性（这应该会更新备份）
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]);

    // 验证备份已更新为最新的组件值
    const updatedBackup = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(updatedBackup, "应该有更新后的备份").toBeDefined();
    expect(updatedBackup!.option.opacity, "备份opacity应该更新为最新值").toBe(0.9);
    expect(updatedBackup!.left, "备份left应该更新为最新值").toBe(600);

    // 再次删除属性验证恢复到最新备份值
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]);

    // 验证组件值被恢复到最新的备份值
    expect(imageComponent.option.opacity, "第二次删除后opacity应该恢复到最新备份值").toBe(0.9);
    expect(imageComponent.left, "第二次删除后left应该恢复到最新备份值").toBe(600);

    // 验证备份值确实是最新的
    const finalBackup = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(finalBackup!.option.opacity, "最终备份opacity应该是最新值").toBe(0.9);
    expect(finalBackup!.left, "最终备份left应该是最新值").toBe(600);
  });

  it("添加属性时备份组件属性值更新 - 嵌套属性测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentDefaultConfigMap } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      removeTransitionPropertiesForComponent,
      updatePropertyValueImpl
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并设置初始嵌套属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "rotateX"]);

    // 记录初始备份值
    const initialBackup = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(initialBackup, "应该有初始备份").toBeDefined();
    const initialOpacity = initialBackup!.option.opacity;
    const initialRotateX = initialBackup!.option.rotateX;

    // 直接修改组件的嵌套属性值
    await updatePropertyValueImpl({
      componentId: `${imageComponent.id}`,
      statusId: statusList[0].statusId,
      property: "opacity",
      value: 0.6
    });
    await updatePropertyValueImpl({
      componentId: `${imageComponent.id}`,
      statusId: statusList[0].statusId,
      property: "rotateX",
      value: 45
    });

    await testUtils.triggerStatusAnimation(`${imageComponent.id}`, animationList[0].id, statusList[0].statusId);

    // 验证组件值已修改
    expect(imageComponent.option.opacity, "组件opacity值已修改").toBe(0.6);
    expect(imageComponent.option.rotateX, "组件rotateX值已修改").toBe(45);

    // 删除所有属性
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "rotateX"]);

    // 验证组件值被恢复到初始备份值
    expect(imageComponent.option.opacity, "删除后opacity应该恢复到初始备份值").toBe(initialOpacity);
    expect(imageComponent.option.rotateX, "删除后rotateX应该恢复到初始备份值").toBe(initialRotateX);

    // 再次修改组件属性值
    imageComponent.option.opacity = 0.7;
    imageComponent.option.rotateX = 90;

    // 验证组件值已修改
    expect(imageComponent.option.opacity, "第二次修改opacity值").toBe(0.7);
    expect(imageComponent.option.rotateX, "第二次修改rotateX值").toBe(90);

    // 重新添加属性（这应该会更新备份）
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "rotateX"]);

    // 验证备份已更新为最新的组件值
    const updatedBackup = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(updatedBackup, "应该有更新后的备份").toBeDefined();
    expect(updatedBackup!.option.opacity, "备份opacity应该更新为最新值").toBe(0.7);
    expect(updatedBackup!.option.rotateX, "备份rotateX应该更新为最新值").toBe(90);

    // 再次删除属性验证恢复到最新备份值
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "rotateX"]);

    // 验证组件值被恢复到最新的备份值
    expect(imageComponent.option.opacity, "第二次删除后opacity应该恢复到最新备份值").toBe(0.7);
    expect(imageComponent.option.rotateX, "第二次删除后rotateX应该恢复到最新备份值").toBe(90);

    // 验证备份值确实是最新的
    const finalBackup = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(finalBackup!.option.opacity, "最终备份opacity应该是最新值").toBe(0.7);
    expect(finalBackup!.option.rotateX, "最终备份rotateX应该是最新值").toBe(90);
  });

  it("添加属性时备份组件属性值更新 - 复合属性测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentDefaultConfigMap } = useStatusAnimationData();
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

    // 添加组件并设置初始复合属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["width", "height"]);

    // 记录初始备份值
    const initialBackup = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(initialBackup, "应该有初始备份").toBeDefined();
    const initialComponentWidth = initialBackup!.component.width;
    const initialComponentHeight = initialBackup!.component.height;

    // 直接修改组件的复合属性值
    imageComponent.component.width = 800;
    imageComponent.component.height = 600;

    // 验证组件值已修改
    expect(imageComponent.component.width, "组件component.width值已修改").toBe(800);
    expect(imageComponent.component.height, "组件component.height值已修改").toBe(600);

    // 删除所有属性
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["width", "height"]);

    // 验证组件值被恢复到初始备份值
    expect(imageComponent.component.width, "删除后component.width应该恢复到初始备份值").toBe(initialComponentWidth);
    expect(imageComponent.component.height, "删除后component.height应该恢复到初始备份值").toBe(initialComponentHeight);

    // 再次修改组件属性值
    imageComponent.component.width = 1000;
    imageComponent.component.height = 800;

    // 验证组件值已修改
    expect(imageComponent.component.width, "第二次修改width值").toBe(1000);
    expect(imageComponent.component.height, "第二次修改height值").toBe(800);

    // 重新添加属性（这应该会更新备份）
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["width", "height"]);

    // 验证备份已更新为最新的组件值
    const updatedBackup = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(updatedBackup, "应该有更新后的备份").toBeDefined();
    expect(updatedBackup!.component.width, "备份width应该更新为最新值").toBe(1000);
    expect(updatedBackup!.component.height, "备份height应该更新为最新值").toBe(800);
    expect(updatedBackup!.component.width, "备份component.width应该更新为最新值").toBe(1000);
    expect(updatedBackup!.component.height, "备份component.height应该更新为最新值").toBe(800);

    // 再次删除属性验证恢复到最新备份值
    await removeTransitionPropertiesForComponent(`${imageComponent.id}`, ["width", "height"]);

    // 验证组件值被恢复到最新的备份值
    expect(imageComponent.component.width, "第二次删除后width应该恢复到最新备份值").toBe(1000);
    expect(imageComponent.component.height, "第二次删除后height应该恢复到最新备份值").toBe(800);
    expect(imageComponent.component.width, "第二次删除后component.width应该恢复到最新备份值").toBe(1000);
    expect(imageComponent.component.height, "第二次删除后component.height应该恢复到最新备份值").toBe(800);

    // 验证备份值确实是最新的
    const finalBackup = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(finalBackup!.component.width, "最终备份width应该是最新值").toBe(1000);
    expect(finalBackup!.component.height, "最终备份height应该是最新值").toBe(800);
    expect(finalBackup!.component.width, "最终备份component.width应该是最新值").toBe(1000);
    expect(finalBackup!.component.height, "最终备份component.height应该是最新值").toBe(800);
  });
});
