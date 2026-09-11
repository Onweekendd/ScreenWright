import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "../test-utils";

import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画属性管理 - 基本操作测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("按需为组件添加过渡属性（批量到所有状态）", async () => {
    const { groupData } = useGlobalComponentData();
    const {
      statusAnimations,
      componentAnimations,
      getCurrentAnimationList,
      getCurrentStatusList,
      selectAnimationId,
      selectStatusId,
      getRenderTableData
    } = useStatusAnimationData();
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
    expect(animationList.length, "有一个动画").toBe(1);

    setSelectAnimationId(animationList[0].id);
    expect(selectAnimationId.value, "选择动画").toBe(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    expect(statusList.length, "有一个状态").toBe(1);

    setSelectStatusId(statusList[0].statusId);
    expect(selectStatusId.value, "选择状态").toBe(statusList[0].statusId);

    // 先添加组件（仅 zIndex）
    await handleComponentAddToStatusAnimation({ component: imageComponent });

    const currentStatusId = selectStatusId.value;
    expect(
      componentAnimations.value[selectAnimationId.value][currentStatusId][imageComponent.id],
      "初次仅有zIndex"
    ).toEqual({
      zIndex: imageComponent.zIndex,
      componentId: `${imageComponent.id}`
    });

    expect(getRenderTableData.value.length, "有一个组件").toBe(1);
    expect(getRenderTableData.value[0]?.children?.length, "只有一个组").toBe(1);
    expect(getRenderTableData.value[0]?.children?.[0]?.children?.length, "只有一个属性").toBe(1);

    // 按需添加属性：opacity、left、image
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left", "image"]);

    // 校验所有状态均被更新（当前仅1个状态）
    const allStatuses = Object.keys(statusAnimations.value[selectAnimationId.value]);
    allStatuses.forEach((sid) => {
      const cfg = componentAnimations.value[selectAnimationId.value][sid][imageComponent.id];
      expect(cfg.componentId).toBe(`${imageComponent.id}`);
      expect(cfg.zIndex).toBe(imageComponent.zIndex);
      expect(cfg.opacity).toBe(imageComponent.option.opacity);
      expect(cfg.left).toBe(imageComponent.left);

      // 图片组件的图片属性在data中
      expect(cfg.image).toBe(imageComponent.data[0].value);
    });

    expect(getRenderTableData.value.length, "有一个组件").toBe(1);

    expect(getRenderTableData.value[0]?.children?.length, "4个组").toBe(4);

    expect(
      getRenderTableData.value[0]?.children?.map((group) => group.group),
      "4个组"
    ).toMatchObject(expect.arrayContaining(["层级", "透明度", "定位", "图片"]));

    expect(
      getRenderTableData.value[0]?.children?.map((group) => group.children?.map((prop) => prop.property)).flat()
    ).toMatchObject(expect.arrayContaining(["zIndex", "opacity", "left", "image"]));

    // 验证每个组中都有一个属性
    getRenderTableData.value[0]?.children?.forEach((group) => {
      expect(group.children?.length, `${group.group}组有一个属性`).toBe(1);
    });
  });

  it("getRenderTableData 边界安全测试", () => {
    const { getRenderTableData, setSelectAnimationId } = useStatusAnimationData();

    // 测试未选择动画时
    expect(getRenderTableData.value, "未选择动画时为空数组").toEqual([]);

    // 测试选择不存在的动画
    setSelectAnimationId("non-existent-animation");
    expect(getRenderTableData.value, "不存在的动画时为空数组").toEqual([]);

    // 测试选择存在的动画但没有状态
    const { initAnimationAndComponentDefaultConfigMap } = useStatusAnimation();
    initAnimationAndComponentDefaultConfigMap();

    const { getCurrentAnimationList } = useStatusAnimationData();
    const animationList = getCurrentAnimationList();

    if (animationList.length > 0) {
      setSelectAnimationId(animationList[0].id);
      // 此时有动画但没有组件
      expect(getRenderTableData.value, "有动画但没有组件时为空数组").toEqual([]);
    }
  });

  it("getRenderTableData 渐进式属性添加测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getRenderTableData, getCurrentAnimationList, getCurrentStatusList } = useStatusAnimationData();
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

    // 添加组件（仅 zIndex）
    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 验证初始状态：只有层级属性组
    let renderData = getRenderTableData.value;
    expect(renderData.length, "有一个组件").toBe(1);
    expect(renderData[0].children?.length, "只有层级组").toBe(1);
    expect(renderData[0].children?.[0].group, "是层级组").toBe("层级");
    expect(renderData[0].children?.[0].children?.length, "只有zIndex属性").toBe(1);
    expect(renderData[0].children?.[0].children?.[0].property, "是zIndex属性").toBe("zIndex");

    // 添加定位属性
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["left", "top"]);

    renderData = getRenderTableData.value;
    expect(renderData[0].children?.length, "有定位组和层级组").toBe(2);

    // 查找定位组
    const positionGroup = renderData[0].children?.find((group) => group.group === "定位");
    expect(positionGroup, "定位组存在").toBeDefined();
    expect(positionGroup?.children?.length, "定位组有2个属性").toBe(2);

    const propertyNames = positionGroup?.children?.map((prop) => prop.property) || [];
    expect(propertyNames, "包含left和top").toEqual(expect.arrayContaining(["left", "top"]));

    // 添加透明度属性
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity"]);

    renderData = getRenderTableData.value;
    expect(renderData[0].children?.length, "有3个组").toBe(3);

    // 查找透明度组
    const opacityGroup = renderData[0].children?.find((group) => group.group === "透明度");
    expect(opacityGroup, "透明度组存在").toBeDefined();
    expect(opacityGroup?.children?.length, "透明度组有1个属性").toBe(1);
    expect(opacityGroup?.children?.[0].property, "是opacity属性").toBe("opacity");

    // 添加图片属性（如果是图片组件）
    if (imageComponent.component.prop === "swimg") {
      await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["image"]);

      renderData = getRenderTableData.value;
      expect(renderData[0].children?.length, "有4个组").toBe(4);

      const imageGroup = renderData[0].children?.find((group) => group.group === "图片");
      expect(imageGroup, "图片组存在").toBeDefined();
      expect(imageGroup?.children?.length, "图片组有1个属性").toBe(1);
      expect(imageGroup?.children?.[0].property, "是image属性").toBe("image");
    }
  });

  it("getRenderTableData 多组件属性独立性测试", async () => {
    const { groupData } = useGlobalComponentData();
    const { getRenderTableData, getCurrentAnimationList, getCurrentStatusList } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId,
      addTransitionPropertiesForComponent
    } = useStatusAnimation();

    // 假设有多个组件（至少2个）
    if (groupData.value.length < 2) {
      console.warn("测试需要至少2个组件，跳过多组件测试");
      return;
    }

    const [component1, component2] = groupData.value;
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加第一个组件（仅 zIndex）
    await handleComponentAddToStatusAnimation({ component: component1 });

    // 添加第二个组件（仅 zIndex）
    await handleComponentAddToStatusAnimation({ component: component2 });

    let renderData = getRenderTableData.value;
    expect(renderData.length, "有两个组件").toBe(2);

    // 验证两个组件都只有层级属性
    renderData.forEach((componentNode, index) => {
      expect(componentNode.children?.length, `组件${index + 1}只有层级组`).toBe(1);
      expect(componentNode.children?.[0].group, `组件${index + 1}是层级组`).toBe("层级");
    });

    // 只为第一个组件添加定位属性
    await addTransitionPropertiesForComponent(`${component1.id}`, ["left", "top"]);

    renderData = getRenderTableData.value;
    expect(renderData.length, "仍有两个组件").toBe(2);

    // 验证第一个组件有定位和层级属性
    const component1Node = renderData.find((node) => node.id === `${component1.id}`);
    expect(component1Node?.children?.length, "组件1有2个属性组").toBe(2);

    // 验证第二个组件仍只有层级属性
    const component2Node = renderData.find((node) => node.id === `${component2.id}`);
    expect(component2Node?.children?.length, "组件2仍只有层级组").toBe(1);

    // 为第二个组件添加不同的属性
    await addTransitionPropertiesForComponent(`${component2.id}`, ["display"]);

    renderData = getRenderTableData.value;
    const updatedComponent2Node = renderData.find((node) => node.id === `${component2.id}`);
    expect(updatedComponent2Node?.children?.length, "组件2现在有2个属性组").toBe(2);

    // 验证组件间属性独立性
    const component1Groups = component1Node?.children?.map((group) => group.group) || [];
    const component2Groups = updatedComponent2Node?.children?.map((group) => group.group) || [];

    expect(component1Groups, "组件1有定位和层级").toEqual(expect.arrayContaining(["定位", "层级"]));
    expect(component2Groups, "组件2有显示和层级").toEqual(expect.arrayContaining(["显示", "层级"]));
  });
});
