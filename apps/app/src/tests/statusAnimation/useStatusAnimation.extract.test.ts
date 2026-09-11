import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestUtils } from "./test-utils";

import { ComponentConfigBuilder } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/components/hooks/generators/ComponentConfigBuilder";
import type { ComponentAnimationConfig } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/type";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

describe("状态动画生成器反向提取测试", () => {
  let testUtils: ReturnType<typeof createTestUtils>;

  beforeEach(async () => {
    testUtils = createTestUtils();
    await testUtils.setupTestEnvironment();
  });

  afterEach(() => {
    testUtils.cleanupTestEnvironment();
  });

  it("生成器反向提取 - 基本功能测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 创建指导模板，指示需要提取哪些字段
    const template = {
      left: 0, // 值不重要，只是表示需要提取这个字段
      top: 0,
      width: 0,
      opacity: 0,
      zIndex: 0
    } as Partial<ComponentAnimationConfig>;

    const result = builder.extract({ component: imageComponent, animationConfig: template });

    // 验证提取的字段
    expect(result.config.left).toBe(imageComponent.left);
    expect(result.config.top).toBe(imageComponent.top);
    expect(result.config.width).toBe(imageComponent.component.width);
    expect(result.config.opacity).toBe(imageComponent.option.opacity);
    expect(result.config.zIndex).toBe(imageComponent.zIndex);

    // 验证未请求的字段没有被提取
    expect(result.config.height).toBeUndefined();
    expect(result.config.rotateX).toBeUndefined();
    expect(result.config.display).toBeUndefined();

    // 验证应用的映射数量
    expect(result.appliedMappings.length).toBe(5);

    // 验证跳过的映射原因
    const skippedReasons = result.skippedMappings.map((s) => s.reason);
    expect(skippedReasons).toEqual([]);
  });

  it("生成器反向提取 - 直接映射测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 只请求直接映射的字段
    const template = {
      left: 0,
      top: 0,
      display: false,
      zIndex: 0
    } as Partial<ComponentAnimationConfig>;

    const result = builder.extract({ component: imageComponent, animationConfig: template });

    // 验证直接映射的提取
    expect(result.config.left).toBe(imageComponent.left);
    expect(result.config.top).toBe(imageComponent.top);
    expect(result.config.display).toBe(imageComponent.display);
    expect(result.config.zIndex).toBe(imageComponent.zIndex);

    expect(result.appliedMappings.length).toBe(4);

    // 验证所有应用的映射都是直接映射
    result.appliedMappings.forEach((mapping) => {
      expect(mapping.type).toBe("direct");
    });
  });

  it("生成器反向提取 - 嵌套映射测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 只请求嵌套映射的字段
    const template = {
      opacity: 0,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0
    } as Partial<ComponentAnimationConfig>;

    const result = builder.extract({ component: imageComponent, animationConfig: template });

    // 验证嵌套映射的提取
    expect(result.config.opacity).toBe(imageComponent.option.opacity);
    expect(result.config.rotateX).toBe(imageComponent.option.rotateX);
    expect(result.config.rotateY).toBe(imageComponent.option.rotateY);
    expect(result.config.rotateZ).toBe(imageComponent.option.rotateZ);

    expect(result.appliedMappings.length).toBe(4);

    // 验证所有应用的映射都是嵌套映射
    result.appliedMappings.forEach((mapping) => {
      expect(mapping.type).toBe("nested");
    });
  });

  it("生成器反向提取 - 复合映射测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 只请求复合映射的字段
    const template = {
      width: 0,
      height: 0
    } as Partial<ComponentAnimationConfig>;

    const result = builder.extract({ component: imageComponent, animationConfig: template });

    // 验证复合映射的提取（应该从第一个目标路径提取值）
    expect(result.config.width).toBe(imageComponent.component.width);
    expect(result.config.height).toBe(imageComponent.component.height);

    expect(result.appliedMappings.length).toBe(2);

    // 验证所有应用的映射都是嵌套映射
    result.appliedMappings.forEach((mapping) => {
      expect(mapping.type).toBe("nested");
    });
  });

  it("生成器反向提取 - 混合映射测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 请求混合类型的字段
    const template = {
      left: 0, // 直接映射
      width: 0, // 复合映射
      opacity: 0, // 嵌套映射
      rotateX: 0, // 嵌套映射
      display: false, // 直接映射
      zIndex: 0 // 直接映射
    } as Partial<ComponentAnimationConfig>;

    const result = builder.extract({ component: imageComponent, animationConfig: template });

    // 验证所有类型的映射都被正确提取
    expect(result.config.left).toBe(imageComponent.left); // 直接
    expect(result.config.width).toBe(imageComponent.component.width); // 复合
    expect(result.config.opacity).toBe(imageComponent.option.opacity); // 嵌套
    expect(result.config.rotateX).toBe(imageComponent.option.rotateX); // 嵌套
    expect(result.config.display).toBe(imageComponent.display); // 直接
    expect(result.config.zIndex).toBe(imageComponent.zIndex); // 直接

    expect(result.appliedMappings.length).toBe(6);

    // 验证映射类型分布
    const mappingTypes = result.appliedMappings.map((m) => m.type);
    expect(mappingTypes).toContain("direct");
    expect(mappingTypes).toContain("nested");
    expect(mappingTypes).not.toContain("compound");
  });

  it("生成器反向提取 - 空模板测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 空模板，不请求任何字段
    const template = {} as Partial<ComponentAnimationConfig>;

    const result = builder.extract({ component: imageComponent, animationConfig: template });

    // 验证没有字段被提取
    expect(result.config).toEqual({});
    expect(result.appliedMappings.length).toBe(0);

    // 所有映射都应该被跳过，原因是not_requested
    expect(result.skippedMappings.length).toBe(0);
    result.skippedMappings.forEach((skipped) => {
      expect(skipped.reason).toBe("not_requested");
    });
  });

  it("生成器反向提取 - 值验证测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 修改组件的一些值为无效值（模拟边界情况）
    const modifiedComponent = {
      ...imageComponent,
      option: {
        ...imageComponent.option,
        opacity: 2.5 // 无效的透明度值
      }
    };

    const template = {
      left: 0,
      opacity: 0,
      width: 0
    } as Partial<ComponentAnimationConfig>;

    const result = builder.extract({ component: modifiedComponent, animationConfig: template });

    // 验证有效值被提取
    expect(result.config.left).toBe(modifiedComponent.left);
    expect(result.config.width).toBe(modifiedComponent.component.width);

    // 验证无效值被跳过
    expect(result.config.opacity).toBeUndefined();

    // 验证跳过原因
    const opacitySkipped = result.skippedMappings.find((s) => s.mapping.source === "opacity");
    expect(opacitySkipped?.reason).toBe("validation_failed");
  });

  it("生成器反向提取 - 双向转换一致性测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 完整的模板
    const fullTemplate = {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      opacity: 0,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      display: false,
      zIndex: 0
    } as Partial<ComponentAnimationConfig>;

    // 1. 从组件反向提取配置
    const extractResult = builder.extract({ component: imageComponent, animationConfig: fullTemplate });
    const extractedConfig = extractResult.config;

    // 2. 使用提取的配置构建组件配置
    const buildResult = builder.build({ animationConfig: extractedConfig, component: imageComponent });
    const builtConfig = buildResult.config;

    // 3. 验证双向转换的一致性
    // 对于直接映射的字段，值应该相同
    expect(builtConfig.left).toBe(extractedConfig.left);
    expect(builtConfig.top).toBe(extractedConfig.top);
    expect(builtConfig.display).toBe(extractedConfig.display);
    expect(builtConfig.zIndex).toBe(extractedConfig.zIndex);

    // 对于嵌套映射的字段，应该映射到正确的嵌套位置
    expect(builtConfig.component?.width).toBe(extractedConfig.width);
    expect(builtConfig.component?.height).toBe(extractedConfig.height);

    // 对于嵌套映射的字段，应该映射到正确的嵌套位置
    expect(builtConfig.option?.opacity).toBe(extractedConfig.opacity);
    expect(builtConfig.option?.rotateX).toBe(extractedConfig.rotateX);
    expect(builtConfig.option?.rotateY).toBe(extractedConfig.rotateY);
    expect(builtConfig.option?.rotateZ).toBe(extractedConfig.rotateZ);
  });

  it("生成器反向提取 - 自定义映射测试", () => {
    const { groupData } = useGlobalComponentData();
    const imageComponent = groupData.value[0];
    const builder = ComponentConfigBuilder.createDefault();

    // 添加自定义映射
    builder.addMapping({
      source: "customProperty" as any,
      target: "customField",
      type: "direct" as any,
      description: "自定义反向映射测试"
    });

    // 为组件添加自定义字段
    const modifiedComponent = {
      ...imageComponent,
      customField: "test-value"
    };

    const template = {
      left: 0,
      customProperty: "placeholder"
    } as any;

    const result = builder.extract({ component: modifiedComponent, animationConfig: template });

    // 验证标准映射
    expect(result.config.left).toBe(modifiedComponent.left);

    // 验证自定义映射
    expect((result.config as any).customProperty).toBe("test-value");

    const customMapping = result.appliedMappings.find((m) => (m.source as string) === "customProperty");
    expect(customMapping).toBeDefined();
    expect(customMapping?.target).toBe("customField");
  });
});
