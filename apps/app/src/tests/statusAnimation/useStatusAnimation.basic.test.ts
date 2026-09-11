import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "./test-utils";

import { ElMessage } from "element-plus";

import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画基础功能测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("状态动画初始化", () => {
    const { groupData } = useGlobalComponentData();
    const { animations, statusAnimations, componentAnimations, componentDefaultConfigMap } = useStatusAnimationData();
    const { initAnimationAndComponentDefaultConfigMap } = useStatusAnimation();

    const imageComponent = groupData.value[0];

    initAnimationAndComponentDefaultConfigMap();

    expect(Object.keys(animations.value).length, "只有一个动画").toBe(1);
    expect(Object.keys(statusAnimations.value).length, "只有一个状态动画").toBe(1);
    expect(Object.keys(componentAnimations.value).length, "没有组件动画").toBe(1);
    expect(componentDefaultConfigMap.value.size, "没有组件默认配置").toBe(0);
    expect(componentDefaultConfigMap.value.get(`${imageComponent.id}`), "没有组件默认配置").toBeUndefined();
  });

  it("添加图片组件到状态动画", async () => {
    const { groupData } = useGlobalComponentData();
    const {
      animations,
      statusAnimations,
      componentAnimations,
      componentDefaultConfigMap,
      getCurrentAnimationList,
      getCurrentStatusList,
      selectAnimationId,
      selectStatusId
    } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    expect(animationList.length, "有一个动画").toBe(1);

    setSelectAnimationId(animationList[0].id);
    expect(selectAnimationId.value, "选择动画").toBe(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    expect(statusList.length, "有一个状态").toBe(1);

    setSelectStatusId(statusList[0].statusId);
    expect(selectStatusId.value, "选择状态").toBe(statusList[0].statusId);

    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 验证 ElMessage.error 被调用
    expect(ElMessage.error).not.toHaveBeenCalled();

    expect(Object.keys(animations.value).length, "只有一个动画").toBe(1);
    expect(Object.keys(statusAnimations.value).length, "只有一个状态动画").toBe(1);
    expect(Object.keys(componentAnimations.value).length, "有一个组件动画").toBe(1);
    expect(
      componentAnimations.value[selectAnimationId.value][selectStatusId.value][imageComponent.id],
      "有一个组件动画"
    ).toEqual({
      zIndex: imageComponent.zIndex,
      componentId: `${imageComponent.id}`
    });
    expect(componentDefaultConfigMap.value.size, "有一个组件备份").toBe(1);
    expect(componentDefaultConfigMap.value.get(`${imageComponent.id}`), "有一个组件默认配置").toEqual(imageComponent);
  });

  it("全量创建组件动画配置", async () => {
    const { groupData } = useGlobalComponentData();
    const { componentAnimations, getCurrentAnimationList, getCurrentStatusList, selectAnimationId, selectStatusId } =
      useStatusAnimationData();
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

    // 添加组件到状态动画
    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 添加所有可能的属性
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, [
      "left",
      "top",
      "width",
      "height",
      "opacity",
      "rotateX",
      "rotateY",
      "rotateZ",
      "display",
      "zIndex",
      "image"
    ]);

    const componentAnimationConfig =
      componentAnimations.value[selectAnimationId.value][selectStatusId.value][imageComponent.id];

    // 验证基础属性
    expect(componentAnimationConfig).toMatchObject({
      left: imageComponent.left,
      top: imageComponent.top,
      width: imageComponent.component.width,
      height: imageComponent.component.height,
      rotateX: imageComponent.option.rotateX,
      rotateY: imageComponent.option.rotateY,
      rotateZ: imageComponent.option.rotateZ,
      opacity: imageComponent.option.opacity,
      display: imageComponent.display,
      zIndex: imageComponent.zIndex,
      componentId: `${imageComponent.id}`
    });

    // 验证组件ID是字符串类型
    expect(typeof componentAnimationConfig.componentId).toBe("string");

    // 验证图片属性（如果是图片组件）
    if (imageComponent.component.prop === "swimg") {
      expect(componentAnimationConfig.image).toBeDefined();
      expect(typeof componentAnimationConfig.image).toBe("string");
    }
  });

  it("编辑器可见性状态管理 - 快照和重置功能测试", async () => {
    const { groupData } = useGlobalComponentData();
    const {
      setEditorVisible,
      componentDefaultConfigMap,
      getCurrentAnimationList,
      getCurrentStatusList,
      selectAnimationId,
      selectStatusId
    } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent,
      updatePropertyValueImpl
    } = useStatusAnimation();
    setEditorVisible(false);

    const imageComponent = groupData.value[0];

    const initialLeft = imageComponent.left;
    const initialTop = imageComponent.top;
    const initialOpacity = imageComponent.option.opacity;
    const initImage = imageComponent.data[0].value;

    const modifiedLeft = initialLeft + 100;
    const modifiedTop = initialTop + 50;
    const modifiedOpacity = initialOpacity - 0.3;

    imageComponent.left = modifiedLeft;
    imageComponent.top = modifiedTop;
    imageComponent.option.opacity = modifiedOpacity;

    // 1. 初始化状态动画系统
    initAnimationAndComponentDefaultConfigMap();
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);
    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 验证组件配置已修改
    expect(imageComponent.left).toBe(modifiedLeft);
    expect(imageComponent.top).toBe(modifiedTop);
    expect(imageComponent.option.opacity).toBe(modifiedOpacity);

    setEditorVisible(true);
    expect(componentDefaultConfigMap.value.has(`${imageComponent.id}`)).toBe(false);

    await handleComponentAddToStatusAnimation({ component: imageComponent });

    expect(componentDefaultConfigMap.value.has(`${imageComponent.id}`)).toBe(true);
    const snapshot = componentDefaultConfigMap.value.get(`${imageComponent.id}`);
    expect(snapshot).toBeDefined();

    // 验证快照保存了修改后的状态
    expect(snapshot!.left).toBe(modifiedLeft);
    expect(snapshot!.top).toBe(modifiedTop);
    expect(snapshot!.option.opacity).toBe(modifiedOpacity);

    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["left", "top", "opacity"]);

    // 6. 再次修改组件状态（模拟动画触发或用户操作）
    const animationLeft = modifiedLeft + 200;
    const animationTop = modifiedTop + 100;
    const animationOpacity = modifiedOpacity - 0.2;
    const newImage = "https://example.com/new-image.jpg";

    updatePropertyValueImpl({
      componentId: `${imageComponent.id}`,
      statusId: statusList[0].statusId,
      property: "left",
      value: animationLeft
    });

    updatePropertyValueImpl({
      componentId: `${imageComponent.id}`,
      statusId: statusList[0].statusId,
      property: "top",
      value: animationTop
    });

    updatePropertyValueImpl({
      componentId: `${imageComponent.id}`,
      statusId: statusList[0].statusId,
      property: "opacity",
      value: animationOpacity
    });

    updatePropertyValueImpl({
      componentId: `${imageComponent.id}`,
      statusId: statusList[0].statusId,
      property: "image",
      value: newImage
    });

    await testUtils.animationHelper.triggerStatusAnimation(
      `${imageComponent.id}`,
      selectAnimationId.value,
      statusList[0].statusId
    );
    // 验证组件状态已再次改变
    expect(imageComponent.left).toBe(animationLeft);
    expect(imageComponent.top).toBe(animationTop);
    expect(imageComponent.option.opacity).toBe(animationOpacity);
    expect(imageComponent.data[0].value).toBe(newImage);

    // 7. 调用 setEditorVisible(false) - 应该重置到快照状态
    setEditorVisible(false);

    // 8. 验证组件是否恢复到快照状态
    expect(imageComponent.left).toBe(modifiedLeft);
    expect(imageComponent.top).toBe(modifiedTop);
    expect(imageComponent.option.opacity).toBe(modifiedOpacity);
    expect(imageComponent.data[0].value).toBe(initImage);

    // 9. 验证编辑器状态已清除
    expect(selectAnimationId.value).toBe("");
    expect(selectStatusId.value).toBe("");
  });

  it("编辑器可见性状态管理 - 关闭时清空状态测试", () => {
    const {
      setEditorVisible,
      selectAnimationId,
      selectStatusId,
      selectedRowId,
      setSelectAnimationId,
      setSelectStatusId,
      setSelectedRowId
    } = useStatusAnimationData();

    // 设置一些状态
    setSelectAnimationId("test-animation-id");
    setSelectStatusId("test-status-id");
    setSelectedRowId("test-row-id");

    // 验证状态已设置
    expect(selectAnimationId.value).toBe("test-animation-id");
    expect(selectStatusId.value).toBe("test-status-id");
    expect(selectedRowId.value).toBe("test-row-id");

    // 关闭编辑器
    setEditorVisible(false);

    // 验证所有状态已清空
    expect(selectAnimationId.value).toBe("");
    expect(selectStatusId.value).toBe("");
    expect(selectedRowId.value).toBe("");
  });
});
