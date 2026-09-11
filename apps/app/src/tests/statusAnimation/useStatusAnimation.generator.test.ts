import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUtils } from "./test-utils";

import {
  buildComponent,
  ComponentConfigBuilder
} from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/components/hooks/generators";
import { PropertyMappingType } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/components/hooks/generators/types";
import type { ComponentAnimationConfig } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/type";
import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画生成器系统测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("生成器基本功能测试 - 空配置", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];

    // 测试空配置 - 使用 Partial 类型
    const emptyConfig = {} as Partial<ComponentAnimationConfig>;
    const result = buildComponent(emptyConfig, imageComponent);

    expect(result.config, "空配置应该返回空对象").toEqual({});
    expect(result.appliedMappings, "空配置时应用映射为空").toEqual([]);
    expect(result.skippedMappings.length, "空配置时跳过映射数量应为0").toBe(0);

    // 验证跳过的映射都是因为缺少值
    result.skippedMappings.forEach((skipped: any) => {
      expect(skipped.reason, "跳过原因应为missing_value").toBe("missing_value");
    });
  });

  it("生成器基本功能测试 - 直接映射", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];

    // 测试直接映射属性
    const config = {
      left: 100,
      top: 200,
      display: true,
      zIndex: 10
    } as Partial<ComponentAnimationConfig>;

    const result = buildComponent(config, imageComponent);

    expect(result.config.left, "left应该直接映射").toBe(100);
    expect(result.config.top, "top应该直接映射").toBe(200);
    expect(result.config.display, "display应该直接映射").toBe(true);
    expect(result.config.zIndex, "zIndex应该直接映射").toBe(10);

    expect(result.appliedMappings.length, "应用了4个映射").toBe(4);
    expect(result.skippedMappings.length, "跳过的映射数量").toBe(0);

    // 验证应用的映射类型
    const appliedSources = result.appliedMappings.map((m: any) => m.source);
    expect(appliedSources).toEqual(expect.arrayContaining(["left", "top", "display", "zIndex"]));
  });

  it("生成器基本功能测试 - 嵌套映射", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];

    // 测试嵌套映射属性
    const config = {
      opacity: 0.5,
      rotateX: 45,
      rotateY: 90,
      rotateZ: 180
    } as Partial<ComponentAnimationConfig>;

    const result = buildComponent(config, imageComponent);

    expect(result.config.option?.opacity, "opacity应该映射到option.opacity").toBe(0.5);
    expect(result.config.option?.rotateX, "rotateX应该映射到option.rotateX").toBe(45);
    expect(result.config.option?.rotateY, "rotateY应该映射到option.rotateY").toBe(90);
    expect(result.config.option?.rotateZ, "rotateZ应该映射到option.rotateZ").toBe(180);

    expect(result.appliedMappings.length, "应用了4个映射").toBe(4);

    // 验证映射类型为嵌套
    result.appliedMappings.forEach((mapping: any) => {
      expect(mapping.type, "应该是嵌套映射").toBe(PropertyMappingType.NESTED);
    });
  });

  it("生成器基本功能测试 - 嵌套映射", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];

    // 测试嵌套映射属性
    const config = {
      width: 300,
      height: 400
    } as Partial<ComponentAnimationConfig>;

    const result = buildComponent(config, imageComponent);

    // width 和 height 应该映射到 component 层
    expect(result.config.component?.width, "width应该映射到component.width").toBe(300);
    expect(result.config.component?.height, "height应该映射到component.height").toBe(400);

    expect(result.appliedMappings.length, "应用了2个映射").toBe(2);

    // 验证映射类型为嵌套
    result.appliedMappings.forEach((mapping: any) => {
      expect(mapping.type, "应该是嵌套映射").toBe(PropertyMappingType.NESTED);
    });
  });

  it("生成器基本功能测试 - 混合映射", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];

    // 测试包含所有类型的混合配置
    const config = {
      left: 100, // 直接映射
      top: 200, // 直接映射
      width: 300, // 复合映射
      height: 400, // 复合映射
      opacity: 0.8, // 嵌套映射
      rotateX: 30, // 嵌套映射
      display: true, // 直接映射
      zIndex: 5 // 直接映射
    } as Partial<ComponentAnimationConfig>;

    const result = buildComponent(config, imageComponent);

    // 验证直接映射
    expect(result.config.left).toBe(100);
    expect(result.config.top).toBe(200);
    expect(result.config.display).toBe(true);
    expect(result.config.zIndex).toBe(5);

    // 验证嵌套映射
    expect(result.config.component?.width).toBe(300);
    expect(result.config.component?.height).toBe(400);

    // 验证嵌套映射
    expect(result.config.option?.opacity).toBe(0.8);
    expect(result.config.option?.rotateX).toBe(30);

    expect(result.appliedMappings.length, "应用了8个映射").toBe(8);

    // 验证映射类型分布
    const mappingTypes = result.appliedMappings.map((m: any) => m.type);
    expect(mappingTypes).toContain(PropertyMappingType.DIRECT);
    expect(mappingTypes).toContain(PropertyMappingType.NESTED);
    expect(mappingTypes).not.toContain(PropertyMappingType.COMPOUND);
  });

  it("生成器值验证测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];

    // 测试无效值被跳过
    const config = {
      left: "invalid", // 应该是number，但传入string
      opacity: 2.5, // 应该在0-1之间，但传入2.5
      width: -100, // 应该大于0，但传入负数
      top: 200 // 有效值
    } as any;

    const result = buildComponent(config, imageComponent);

    // 只有有效的top应该被应用
    expect(result.config.top, "有效的top应该被应用").toBe(200);
    expect(result.config.left, "无效的left应该被跳过").toBeUndefined();
    expect(result.config.opacity, "无效的opacity应该被跳过").toBeUndefined();
    expect(result.config.width, "无效的width应该被跳过").toBeUndefined();

    expect(result.appliedMappings.length, "只应用了1个有效映射").toBe(1);
    expect(result.skippedMappings.length, "跳过了3个无效映射").toBe(3);

    // 验证跳过原因
    const validationFailures = result.skippedMappings.filter((s: any) => s.reason === "validation_failed");
    expect(validationFailures.length, "有3个验证失败").toBe(3);
  });

  it("生成器与动画触发集成测试", async () => {
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

    // 添加组件并设置多种类型的属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, [
      "left",
      "top", // 直接映射
      "width",
      "height", // 复合映射
      "opacity",
      "rotateX" // 嵌套映射
    ]);

    // 记录初始状态（虽然未使用，但保留用于调试）
    const _initialState = {
      left: imageComponent.left,
      top: imageComponent.top,
      width: imageComponent.width,
      componentWidth: imageComponent.component.width,
      opacity: imageComponent.option.opacity,
      rotateX: imageComponent.option.rotateX
    };

    // 修改状态动画配置
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;

    const originalComponentConfig = componentAnimations.value[animationId][statusId][imageComponent.id];
    const updatedComponentAnimations = {
      ...componentAnimations.value[animationId][statusId],
      [imageComponent.id]: {
        ...originalComponentConfig,
        left: 500, // 直接映射
        top: 600, // 直接映射
        width: 800, // 复合映射
        height: 900, // 复合映射
        opacity: 0.3, // 嵌套映射
        rotateX: 60 // 嵌套映射
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

    // 验证生成器正确应用了所有类型的映射
    expect(imageComponent.left, "直接映射 - left").toBe(500);
    expect(imageComponent.top, "直接映射 - top").toBe(600);
    expect(imageComponent.component.width, "嵌套映射 - component.width").toBe(800);
    expect(imageComponent.component.height, "嵌套映射 - component.height").toBe(900);
    expect(imageComponent.option.opacity, "嵌套映射 - opacity").toBe(0.3);
    expect(imageComponent.option.rotateX, "嵌套映射 - rotateX").toBe(60);
  });

  it("生成器自定义映射测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];

    // 创建自定义生成器，添加自定义映射
    const customBuilder = ComponentConfigBuilder.createDefault();

    // 添加一个自定义的直接映射
    customBuilder.addMapping({
      source: "customProperty" as any,
      target: "customTarget",
      type: PropertyMappingType.DIRECT,
      validator: (value) => typeof value === "string",
      description: "自定义映射测试"
    });

    const config = {
      customProperty: "test-value",
      left: 100 // 标准映射
    } as any;

    const result = customBuilder.build({ animationConfig: config, component: imageComponent });

    expect(result.config.customTarget, "自定义映射应该生效").toBe("test-value");
    expect(result.config.left, "标准映射仍然生效").toBe(100);

    const customMapping = result.appliedMappings.find((m: any) => m.source === "customProperty");
    expect(customMapping, "自定义映射被应用").toBeDefined();
    expect(customMapping?.target, "自定义映射目标正确").toBe("customTarget");
  });

  it("生成器边界情况测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];

    // 测试 undefined 和 null 值
    const config = {
      left: undefined,
      top: null,
      width: 0, // 边界值
      opacity: 0, // 边界值
      zIndex: 999 // 有效值
    } as any;

    const result = buildComponent(config, imageComponent);

    // undefined 应该被跳过
    expect(result.config.left).toBeUndefined();

    // null 应该被处理（因为不是 undefined）
    expect(result.config.top).toBeUndefined();

    // 边界值应该根据验证器决定
    // width: 0 应该被跳过（验证器要求 > 0）
    expect(result.config.width).toBeUndefined();

    // opacity: 0 应该通过（验证器允许 0-1）
    expect(result.config.option?.opacity).toBe(0);

    // 有效值应该通过
    expect(result.config.zIndex).toBe(999);

    // 验证跳过的映射
    const skippedSources = result.skippedMappings.map((s: any) => s.mapping.source);
    expect(skippedSources).toContain("left"); // undefined
    expect(skippedSources).toContain("width"); // 验证失败

    // 验证应用的映射
    const appliedSources = result.appliedMappings.map((m: any) => m.source);
    expect(appliedSources).not.toContain("top"); // undefined 但不是 null
    expect(appliedSources).toContain("opacity"); // 边界值但有效
    expect(appliedSources).toContain("zIndex"); // 有效值
  });

  it("生成器应该正确处理按需属性赋值", async () => {
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

    // 初始化
    initAnimationAndComponentDefaultConfigMap();

    // 设置选择的动画和状态
    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    // 添加组件并只添加部分属性
    await handleComponentAddToStatusAnimation({ component: imageComponent });
    await addTransitionPropertiesForComponent(`${imageComponent.id}`, ["opacity", "left", "width"]);

    // 使用生成器验证构建过程
    const builder = ComponentConfigBuilder.createDebug();
    const mockAnimationData = {
      componentId: `${imageComponent.id}`,
      left: 500,
      width: 600,
      opacity: 0.6,
      rotateX: 30 // 这个属性没有被添加到状态动画中，不应该影响组件
    };

    const result = builder.build({ animationConfig: mockAnimationData, component: imageComponent });

    // 验证生成器正确识别了所有属性
    expect(result.appliedMappings.length).toBeGreaterThan(0);
    expect(result.config.left).toBe(500);
    expect(result.config.component?.width).toBe(600);
    expect(result.config.option?.opacity).toBe(0.6);

    // 验证未定义的属性不会被设置
    expect(result.config.top).toBeUndefined();
    expect(result.config.height).toBeUndefined();
  });

  it("生成器应该支持动态添加新的属性映射", async () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];

    const builder = ComponentConfigBuilder.createDefault();

    // 添加自定义映射
    builder.addMapping({
      source: "left",
      target: "customPosition.x",
      type: "nested" as any,
      description: "自定义X位置映射"
    });

    const mockAnimationData = {
      componentId: `${imageComponent.id}`,
      left: 999
    };

    const result = builder.build({ animationConfig: mockAnimationData, component: imageComponent });

    // 验证自定义映射生效
    expect((result.config as any).customPosition?.x).toBe(999);
  });

  it("生成器应该正确验证属性值", async () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];

    const builder = ComponentConfigBuilder.createDefault();

    const invalidAnimationData = {
      componentId: `${imageComponent.id}`,
      left: 300, // 有效值
      opacity: 2, // 无效值：超出 0-1 范围
      width: -100 // 无效值：负数
    };

    const result = builder.build({ animationConfig: invalidAnimationData, component: imageComponent });

    // 有效值应该被应用
    expect(result.config.left).toBe(300);

    // 无效值应该被跳过
    expect(result.config.option?.opacity).toBeUndefined();
    expect(result.config.width).toBeUndefined();

    // 验证跳过原因
    const opacitySkipped = result.skippedMappings.find((s) => s.mapping.source === "opacity");
    const widthSkipped = result.skippedMappings.find((s) => s.mapping.source === "width");

    expect(opacitySkipped?.reason).toBe("validation_failed");
    expect(widthSkipped?.reason).toBe("validation_failed");
  });

  it("生成器应该保持原有的合并图片功能兼容性", async () => {
    const { groupData } = useGlobalComponentData();
    const { getCurrentAnimationList, getCurrentStatusList, setComponentAnimations } = useStatusAnimationData();
    const {
      initAnimationAndComponentDefaultConfigMap,
      handleComponentAddToStatusAnimation,
      setSelectAnimationId,
      setSelectStatusId
    } = useStatusAnimation();

    const imageComponent = groupData.value[0];
    initAnimationAndComponentDefaultConfigMap();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    await handleComponentAddToStatusAnimation({ component: imageComponent });

    // 模拟触发动画（包含图片属性）
    const animationId = animationList[0].id;
    const statusId = statusList[0].statusId;

    const updatedComponentAnimations = {
      [`${imageComponent.id}`]: {
        componentId: `${imageComponent.id}`,
        left: 400,
        top: imageComponent.top,
        width: imageComponent.component.width,
        height: imageComponent.component.height,
        opacity: imageComponent.option.opacity,
        rotateX: imageComponent.option.rotateX,
        rotateY: imageComponent.option.rotateY,
        rotateZ: imageComponent.option.rotateZ,
        display: imageComponent.display,
        zIndex: imageComponent.zIndex,
        image: "https://example.com/new-image.jpg"
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

    // 验证位置变化（通过生成器处理）
    expect(imageComponent.left).toBe(400);

    // 验证图片变化（通过原有的 mergeImage 处理）
    expect(imageComponent.data[0].value).toBe("https://example.com/new-image.jpg");
  });

  it("生成器嵌套对象 不再按需属性 而是使用完整对象", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 只配置部分嵌套属性，使用groupData中的原始组件
    const partialConfig = {
      componentId: `${imageComponent.id}`,
      opacity: 0.5,
      rotateX: 45
      // 注意：没有配置 rotateY, rotateZ 等
    };

    const result = builder.build({ animationConfig: partialConfig, component: imageComponent });

    // 验证只配置的属性被应用
    expect(result.config.option?.opacity).toBe(0.5);
    expect(result.config.option?.rotateX).toBe(45);

    // 验证未配置的嵌套属性应该是undefined（按需属性，不创建完整对象）
    expect(result.config.option?.rotateY).toBeDefined(); // 按需属性，未配置
    expect(result.config.option?.rotateZ).toBeDefined(); // 按需属性，未配置

    // 验证应用的映射数量正确
    expect(result.appliedMappings.length).toBe(2); // 只有 opacity 和 rotateX

    // 验证映射类型
    const appliedSources = result.appliedMappings.map((m: any) => m.source);
    expect(appliedSources).toEqual(expect.arrayContaining(["opacity", "rotateX"]));
    expect(appliedSources).not.toContain("rotateY");
    expect(appliedSources).not.toContain("rotateZ");
  });

  it("生成器复合映射不再按需 而是使用完整对象", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 只配置部分复合属性，使用groupData中的原始组件
    const partialConfig = {
      componentId: `${imageComponent.id}`,
      width: 400
      // 注意：没有配置 height 等
    };

    const result = builder.build({ animationConfig: partialConfig, component: imageComponent });

    // 验证配置的属性被正确应用（嵌套映射）
    expect(result.config.component?.width).toBe(400);

    // 验证未配置的复合属性应该是undefined（按需属性，不创建完整对象）
    expect(result.config.component?.height).toBeDefined(); // 按需属性，未配置

    // 验证应用的映射数量
    expect(result.appliedMappings.length).toBe(1); // 只有 width
  });

  it("生成器混合嵌套和复合映射不再按需", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 只配置部分属性，使用groupData中的原始组件
    const partialConfig = {
      componentId: `${imageComponent.id}`,
      opacity: 0.3, // 嵌套映射
      width: 500, // 复合映射
      left: 100 // 直接映射
      // 注意：没有配置 rotateX, rotateY, height 等
    };

    const result = builder.build({ animationConfig: partialConfig, component: imageComponent });

    // 验证配置的属性被应用
    expect(result.config.left).toBe(100); // 直接映射
    expect(result.config.component?.width).toBe(500); // 嵌套映射
    expect(result.config.option?.opacity).toBe(0.3); // 嵌套映射

    // 验证未配置的嵌套属性应该是undefined（按需属性，不创建完整对象）
    expect(result.config.option?.rotateX).toBeDefined(); // 按需属性，未配置
    expect(result.config.option?.rotateY).toBeDefined(); // 按需属性，未配置
    expect(result.config.option?.rotateZ).toBeDefined(); // 按需属性，未配置

    // 验证未配置的嵌套属性应该是undefined（按需属性，不创建完整对象）
    expect(result.config.component?.height).toBeDefined(); // 按需属性，未配置

    // 验证应用的映射数量
    expect(result.appliedMappings.length).toBe(3); // left, width, opacity
  });
});
