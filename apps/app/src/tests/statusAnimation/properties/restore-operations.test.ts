import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "../test-utils";

import { ElMessage } from "element-plus";

import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useCacheData } from "@/views/build/useCacheData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画属性管理 - 恢复操作测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("删除属性并恢复默认值 - 基本功能测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentAnimations, componentDefaultConfigMap } =
      useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      removePropertyAndRestoreDefault
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并设置属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left"]);

    // 记录备份值
    const backupComponent = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(backupComponent, "应该有组件备份").toBeDefined();
    const backupOpacity = backupComponent!.option.opacity;

    // 修改组件的当前值
    imageComponent.option.opacity = 0.3;
    imageComponent.left = 999;

    // 验证当前值已修改
    expect(imageComponent.option.opacity, "当前opacity值已修改").toBe(0.3);
    expect(imageComponent.left, "当前left值已修改").toBe(999);

    // 删除opacity属性并恢复默认值
    await removePropertyAndRestoreDefault(`${imageComponent.id}`, "opacity");

    // 验证opacity属性被删除
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    const componentConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    expect(componentConfig.opacity, "opacity属性应该被删除").toBeUndefined();

    // 验证opacity值被恢复到备份值
    expect(imageComponent.option.opacity, "opacity值应该恢复到备份值").toBe(backupOpacity);

    // 验证left属性仍然存在且保持动画配置值
    expect(componentConfig.left, "left属性应该仍然存在").toBeDefined();
    expect(imageComponent.left, "left值应该保持修改值").toBe(999);
  });

  it("删除属性并恢复默认值 - 复合映射属性测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentDefaultConfigMap } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      removePropertyAndRestoreDefault
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并设置复合映射属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["width", "height"]);

    // 记录备份值
    const backupComponent = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    const backupWidth = backupComponent!.width;
    const backupComponentWidth = backupComponent!.component.width;

    // 修改组件的当前值
    imageComponent.component.width = 800;

    // 删除width属性并恢复默认值
    await removePropertyAndRestoreDefault(`${imageComponent.id}`, "width");

    // 验证width值被恢复到备份值（复合映射应该同时恢复外层和component层）
    expect(imageComponent.width, "外层width值应该恢复到备份值").toBe(backupWidth);
    expect(imageComponent.component.width, "component.width值应该恢复到备份值").toBe(backupComponentWidth);
  });

  it("删除属性并恢复默认值 - 边界情况测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      removePropertyAndRestoreDefault
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 测试删除不存在的属性
    await removePropertyAndRestoreDefault(`${imageComponent.id}`, "opacity"); // opacity属性未添加到动画中
    // 应该正常执行，不会报错

    // 测试不存在的组件ID
    await removePropertyAndRestoreDefault("non-existent-component", "opacity");
    expect(ElMessage.error).toHaveBeenCalledWith("组件不存在");

    // 测试未选择动画
    setSelectAnimationId("");
    await removePropertyAndRestoreDefault(`${imageComponent.id}`, "opacity");
    expect(ElMessage.error).toHaveBeenCalledWith("请先选择动画");
  });

  it("删除属性并恢复默认值 - 数组映射属性测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentDefaultConfigMap } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      removePropertyAndRestoreDefault
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并设置数组映射属性（image）
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["image"]);

    // 记录备份值
    const backupComponent = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(backupComponent, "应该有组件备份").toBeDefined();
    const backupImageValue = backupComponent!.data[0].value;

    // 修改组件的当前值
    imageComponent.data[0].value = "https://example.com/new-image.jpg";

    // 验证当前值已修改
    expect(imageComponent.data[0].value, "当前image值已修改").toBe("https://example.com/new-image.jpg");

    // 删除image属性并恢复默认值
    await removePropertyAndRestoreDefault(`${imageComponent.id}`, "image");

    // 验证image值被恢复到备份值（数组映射应该正确恢复data[0].value）
    expect(imageComponent.data[0].value, "data[0].value应该恢复到备份值").toBe(backupImageValue);

    // 验证数组结构保持完整
    expect(Array.isArray(imageComponent.data), "data应该保持数组结构").toBe(true);
    expect(imageComponent.data.length, "data数组长度应该保持").toBeGreaterThan(0);
    expect(imageComponent.data[0], "data[0]应该存在").toBeDefined();
    expect(typeof imageComponent.data[0], "data[0]应该是对象").toBe("object");
  });

  it("删除嵌套属性并恢复默认值 - option属性隔离性测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, componentDefaultConfigMap } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      removePropertyAndRestoreDefault,
      updatePropertyValueImpl
    } = useStatusAnimation();
    const { processStatusAnimationEditorCache, syncCurrentComponentListToRenderMap } = useCacheData();
    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并设置多个嵌套属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "rotateX", "rotateY", "rotateZ"]);

    // 记录备份时的 option 属性值
    const backupComponent = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(backupComponent, "应该有组件备份").toBeDefined();

    const {
      option: {
        rotateX: _backupRotateX,
        rotateY: _backupRotateY,
        rotateZ: _backupRotateZ,
        opacity: _backupOpacity,
        ...backupRestOption
      },
      ...backupRestComponent
    } = backupComponent!;

    // 使用 updatePropertyValueImpl 修改动画配置中的值
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;
    const componentId = `${imageComponent.id}`;

    await updatePropertyValueImpl({ componentId, statusId, property: "opacity", value: 0.7 });
    await updatePropertyValueImpl({ componentId, statusId, property: "rotateX", value: 60 });
    await updatePropertyValueImpl({ componentId, statusId, property: "rotateY", value: 120 });
    await updatePropertyValueImpl({ componentId, statusId, property: "rotateZ", value: 180 });

    processStatusAnimationEditorCache();
    syncCurrentComponentListToRenderMap();

    // 验证动画配置中的值已被修改
    const { componentAnimations } = useStatusAnimationData();
    const animationConfig = componentAnimations.value[animationId][statusId][componentId];
    expect(animationConfig.opacity, "动画配置中的opacity值已修改").toBe(0.7);
    expect(animationConfig.rotateX, "动画配置中的rotateX值已修改").toBe(60);
    expect(animationConfig.rotateY, "动画配置中的rotateY值已修改").toBe(120);
    expect(animationConfig.rotateZ, "动画配置中的rotateZ值已修改").toBe(180);

    // 删除 rotateX 属性并恢复默认值
    await removePropertyAndRestoreDefault(componentId, "rotateX");

    // 验证 rotateX 属性被删除
    let updatedAnimationConfig = componentAnimations.value[animationId][statusId][componentId];
    expect(updatedAnimationConfig.rotateX, "rotateX属性应该被删除").toBeUndefined();

    // 验证 rotateX 值被恢复到初始值 0
    expect(imageComponent.option.rotateX, "rotateX值应该恢复到初始值0").toBe(0);

    // 删除 rotateY 属性并恢复默认值
    await removePropertyAndRestoreDefault(componentId, "rotateY");

    // 验证 rotateY 属性被删除
    updatedAnimationConfig = componentAnimations.value[animationId][statusId][componentId];
    expect(updatedAnimationConfig.rotateY, "rotateY属性应该被删除").toBeUndefined();

    // 验证 rotateY 值被恢复到初始值 0
    expect(imageComponent.option.rotateY, "rotateY值应该恢复到初始值0").toBe(0);

    // 删除 rotateZ 属性并恢复默认值
    await removePropertyAndRestoreDefault(componentId, "rotateZ");

    // 验证 rotateZ 属性被删除
    updatedAnimationConfig = componentAnimations.value[animationId][statusId][componentId];
    expect(updatedAnimationConfig.rotateZ, "rotateZ属性应该被删除").toBeUndefined();

    // 验证 rotateZ 值被恢复到初始值 0
    expect(imageComponent.option.rotateZ, "rotateZ值应该恢复到初始值0").toBe(0);

    // 验证其他动画配置属性保持不变（opacity 应该还在）
    expect(updatedAnimationConfig.opacity, "动画配置中的opacity值应该保持").toBe(0.7);
    expect(updatedAnimationConfig.rotateX, "动画配置中的rotateX应该被删除").toBeUndefined();
    expect(updatedAnimationConfig.rotateY, "动画配置中的rotateY应该被删除").toBeUndefined();
    expect(updatedAnimationConfig.rotateZ, "动画配置中的rotateZ应该被删除").toBeUndefined();

    // 验证 option 对象的其他属性没有被意外修改
    const {
      option: { rotateX: _rotateX, rotateY: _rotateY, rotateZ: _rotateZ, opacity: _opacity, ...restOption },
      ...restComponent
    } = imageComponent;

    expect(restOption).toEqual(backupRestOption);
    expect(restComponent).toEqual(backupRestComponent);

    // 验证 option 对象结构完整性
    expect(typeof imageComponent.option, "option应该保持对象结构").toBe("object");
    expect(imageComponent.option, "option对象应该存在").toBeDefined();
    expect(imageComponent.option !== null, "option对象不应该为null").toBe(true);

    // 验证组件其他属性没有被影响
    expect(imageComponent.left, "组件left属性应该保持不变").toBeDefined();
    expect(imageComponent.top, "组件top属性应该保持不变").toBeDefined();
    expect(imageComponent.component.width, "组件width属性应该保持不变").toBeDefined();
    expect(imageComponent.component.height, "组件height属性应该保持不变").toBeDefined();

    // 记录删除后的组件状态
    const componentAfterDeletion = {
      option: { ...imageComponent.option },
      left: imageComponent.left,
      component: { ...imageComponent.component },
      top: imageComponent.top,
      zIndex: imageComponent.zIndex
    };

    // 执行缓存同步操作
    processStatusAnimationEditorCache();
    syncCurrentComponentListToRenderMap();

    // 验证执行缓存同步后组件状态没有改变
    expect(imageComponent.option.rotateX, "缓存同步后rotateX值应该保持0").toBe(0);
    expect(imageComponent.option.rotateY, "缓存同步后rotateY值应该保持0").toBe(0);
    expect(imageComponent.option.rotateZ, "缓存同步后rotateZ值应该保持0").toBe(0);
    expect(imageComponent.option.opacity, "缓存同步后opacity值应该保持修改值").toBe(0.7);

    // 验证其他属性在缓存同步后保持不变
    expect(imageComponent.left, "缓存同步后left属性应该保持不变").toBe(componentAfterDeletion.left);
    expect(imageComponent.top, "缓存同步后top属性应该保持不变").toBe(componentAfterDeletion.top);
    expect(imageComponent.component.width, "缓存同步后width属性应该保持不变").toBe(
      componentAfterDeletion.component.width
    );
    expect(imageComponent.component.height, "缓存同步后height属性应该保持不变").toBe(
      componentAfterDeletion.component.height
    );
    expect(imageComponent.zIndex, "缓存同步后zIndex属性应该保持不变").toBe(componentAfterDeletion.zIndex);

    // 验证 option 对象结构完整性在缓存同步后保持
    expect(typeof imageComponent.option, "缓存同步后option应该保持对象结构").toBe("object");
    expect(imageComponent.option, "缓存同步后option对象应该存在").toBeDefined();
    expect(imageComponent.option !== null, "缓存同步后option对象不应该为null").toBe(true);
  });
});
