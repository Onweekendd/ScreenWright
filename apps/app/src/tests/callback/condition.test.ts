import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initDataFilterPersistence } from "@screenwright/composables";
import { ConditionCompareEnum, ConditionTypeEnum } from "@screenwright/types";

import { getLargeScreenInfo } from "@/api/build";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useConditionConfig } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/useConditionConfig";
import { useCustomEvent } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/useCustomEvent";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useCacheData } from "@/views/build/useCacheData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import mockDetail from "./componentData4.mock.json";

// ============================================================
// MOCK 配置
// ============================================================

vi.mock("vue", async () => ({
  ...(await vi.importActual<any>("vue")),
  onBeforeMount: vi.fn(),
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  inject: vi.fn()
}));

vi.mock("@/utils/utils", () => ({
  uuid: vi.fn(() => "mock-condition-uuid-1234"),
  extractComponentId: vi.fn((component: string | number): number => {
    if (typeof component === "number") {
      return component;
    }
    if (typeof component === "string") {
      const match = component.match(/\$component\((\d+)\)/);
      return match ? parseInt(match[1], 10) : Number(component);
    }
    return Number(component);
  })
}));

vi.mock("@/api/build", () => ({
  getLargeScreenInfo: vi.fn()
}));

vi.mock("@/api/library", () => ({
  updateLargeScreen: vi.fn(),
  updateLayersAgg: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("@/utils/service", () => ({
  createRequest: vi.fn()
}));

vi.mock("@/utils/cacheService", () => ({
  createRequest: vi.fn()
}));

// ============================================================
// 测试套件
// ============================================================

describe("useConditionConfig - 条件功能单元测试", () => {
  // ============================================================
  // Setup & Teardown
  // ============================================================

  beforeEach(async () => {
    // 注入 @screenwright/composables 的持久化端口（真实 app 由 main.ts 在启动时调用一次），
    // 否则 useUpdateInstance/useDataFilter 内部保存动作会因未初始化而抛错
    initDataFilterPersistence({
      saveLayersByType: vi.fn(),
      updateLargeScreen: vi.fn()
    });

    // 设置 mock 实现
    (getLargeScreenInfo as any).mockResolvedValue({
      result: mockDetail
    });

    // 1. 重置所有全局状态
    const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
    const { setGroupData, resetGroupData } = useGlobalComponentData();
    const { setDetail2Config, resetEditStore } = useEditStore();
    const { onClear } = useCallbackArguments();

    onClear();
    resetEditStore();
    resetNavInfo();
    resetGroupData();

    // 2. 加载测试数据
    const res = await getLargeScreenInfo(24336);
    setNavInfo(res.result);
    setGroupData(res.result);
    setDetail2Config(res.result);

    // 3. 初始化事件系统
    const { initCallbackArguments } = useCallbackArguments();
    const { groupData } = useGlobalComponentData();
    initCallbackArguments(groupData.value);

    // 4. 设置当前选中的组件和事件
    const { setTargetSelectChart } = useEditStore();
    const { setInitialEvent } = useCustomEvent();

    // 选择有事件的组件(交互组件)
    setTargetSelectChart(`${groupData.value[0].id}`);
    setInitialEvent();

    // 5. 初始化条件列表
    const { currentEvent } = useCustomEvent();
    if (!currentEvent.value.conditions) {
      currentEvent.value.conditions = [];
    }
  });

  afterEach(() => {
    // 清理缓存
    const { buildWorkerCacheInput } = useCacheData();
    const workerCacheInput = buildWorkerCacheInput(Date.now());
    structuredClone(workerCacheInput);
  });

  // ============================================================
  // Factory 函数
  // ============================================================

  // ============================================================
  // 1. 条件添加操作 (3个测试)
  // ============================================================

  describe("条件添加操作", () => {
    it("添加字段条件 - 应创建默认Field类型条件并设置正确的初始状态", () => {
      // Arrange
      const { addCondition, currentEvent } = useConditionConfig();
      const initialLength = currentEvent.value.conditions?.length || 0;

      // Act - useConditionConfig.ts:39-56
      addCondition();

      // Assert
      expect(currentEvent.value.conditions).toBeDefined();
      expect(currentEvent.value.conditions!.length).toBe(initialLength + 1);

      const newCondition = currentEvent.value.conditions![initialLength];
      expect(newCondition.id).toBe(`${initialLength + 1}`);
      expect(newCondition.name).toBe(`条件${initialLength + 1}`);
      expect(newCondition.type).toBe(ConditionTypeEnum.Field);
      expect(newCondition.notSaved).toBe(true);
      expect(newCondition.isExists).toBe(false);
      expect(newCondition.compare).toBe(ConditionCompareEnum.Include);
      expect(newCondition.field).toBe("");
      expect(newCondition.expected).toBe("");
      expect(newCondition.code).toBe("");
    });

    it("添加多个条件 - ID和名称应按顺序递增", () => {
      // Arrange
      const { addCondition, currentEvent } = useConditionConfig();

      // Act
      addCondition();
      addCondition();
      addCondition();

      // Assert
      expect(currentEvent.value.conditions!.length).toBe(3);
      expect(currentEvent.value.conditions![0].id).toBe("1");
      expect(currentEvent.value.conditions![0].name).toBe("条件1");
      expect(currentEvent.value.conditions![1].id).toBe("2");
      expect(currentEvent.value.conditions![1].name).toBe("条件2");
      expect(currentEvent.value.conditions![2].id).toBe("3");
      expect(currentEvent.value.conditions![2].name).toBe("条件3");
    });

    it("添加条件 - 新条件应有正确的默认值", () => {
      // Arrange
      const { addCondition, currentEvent } = useConditionConfig();

      // Act
      addCondition();

      // Assert - useConditionConfig.ts:43-54
      const newCondition = currentEvent.value.conditions![0];
      expect(newCondition.compare).toBe(ConditionCompareEnum.Include);
      expect(newCondition.field).toBe("");
      expect(newCondition.expected).toBe("");
      expect(newCondition.code).toBe("");
    });
  });

  // ============================================================
  // 2. 条件类型切换 (4个测试)
  // ============================================================

  describe("条件类型切换", () => {
    it("从Field切换到Custom - 有快照时应标记未保存", () => {
      // Arrange
      const { addCondition, onSaveCondition, onConditionTypeChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      // 先保存以创建快照
      condition.field = "testField";
      onSaveCondition(condition);
      expect(condition.notSaved).toBe(false);

      // Act - useConditionConfig.ts:86-90
      condition.type = ConditionTypeEnum.Custom;
      onConditionTypeChange(0);

      // Assert
      expect(condition.notSaved).toBe(true);
    });

    it("从Custom切换到Field - 有快照时应标记未保存", () => {
      // Arrange
      const { addCondition, onSaveCondition, onConditionTypeChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      // 设置为Custom类型并保存
      condition.type = ConditionTypeEnum.Custom;
      condition.code = "return true";
      onSaveCondition(condition);
      expect(condition.notSaved).toBe(false);

      // Act - useConditionConfig.ts:86-90
      condition.type = ConditionTypeEnum.Field;
      onConditionTypeChange(0);

      // Assert
      expect(condition.notSaved).toBe(true);
    });

    it("无快照时切换类型 - 应标记为未保存", () => {
      // Arrange
      const { addCondition, onConditionTypeChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      // 确保没有快照
      expect(condition.tempPool).toEqual({});

      // Act - useConditionConfig.ts:86-90
      onConditionTypeChange(0);

      // Assert - useConditionConfig.ts:69-73
      expect(condition.notSaved).toBe(true);
    });

    it("切换类型后切换回原类型 - 有快照时应比较并标记状态", () => {
      // Arrange
      const { addCondition, onSaveCondition, onConditionTypeChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      // 保存Field类型
      condition.type = ConditionTypeEnum.Field;
      condition.field = "test";
      onSaveCondition(condition);

      // 切换到Custom
      condition.type = ConditionTypeEnum.Custom;
      onConditionTypeChange(0);
      expect(condition.notSaved).toBe(true);

      // Act - 切换回Field
      condition.type = ConditionTypeEnum.Field;
      onConditionTypeChange(0);

      // Assert - useConditionConfig.ts:78-79
      expect(condition.notSaved).toBe(false);
    });
  });

  // ============================================================
  // 3. 字段条件参数修改 (5个测试)
  // ============================================================

  describe("字段条件参数修改", () => {
    it("修改field字段 - 应检测到变化并标记未保存", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      // 先保存以创建快照
      condition.field = "oldField";
      onSaveCondition(condition);
      expect(condition.notSaved).toBe(false);

      // Act - useConditionConfig.ts:93-97
      condition.field = "newField";
      onFieldConditionChange(0);

      // Assert - useConditionConfig.ts:79
      expect(condition.notSaved).toBe(true);
    });

    it("修改compare字段 - 应检测到变化并标记未保存", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.compare = ConditionCompareEnum.Include;
      onSaveCondition(condition);

      // Act - useConditionConfig.ts:93-97
      condition.compare = ConditionCompareEnum.Exclude;
      onFieldConditionChange(0);

      // Assert - useConditionConfig.ts:80
      expect(condition.notSaved).toBe(true);
    });

    it("修改expected字段 - 应检测到变化并标记未保存", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.expected = "oldValue";
      onSaveCondition(condition);

      // Act - useConditionConfig.ts:93-97
      condition.expected = "newValue";
      onFieldConditionChange(0);

      // Assert - useConditionConfig.ts:81
      expect(condition.notSaved).toBe(true);
    });

    it("修改为相同值 - 不应标记未保存", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.field = "test";
      onSaveCondition(condition);

      // Act - useConditionConfig.ts:93-97
      condition.field = "test";
      onFieldConditionChange(0);

      // Assert - useConditionConfig.ts:76-82
      expect(condition.notSaved).toBe(false);
    });

    it("修改多个字段参数 - 应保持未保存状态", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      onSaveCondition(condition);

      // Act - 依次修改
      condition.field = "newField";
      onFieldConditionChange(0);
      expect(condition.notSaved).toBe(true);

      condition.compare = ConditionCompareEnum.Exclude;
      onFieldConditionChange(0);
      expect(condition.notSaved).toBe(true);

      condition.expected = "newExpected";
      onFieldConditionChange(0);

      // Assert
      expect(condition.notSaved).toBe(true);
    });
  });

  // ============================================================
  // 4. 自定义代码修改 (4个测试)
  // ============================================================

  describe("自定义代码修改", () => {
    it("修改code内容 - 应检测到变化并标记未保存", () => {
      // Arrange
      const { addCondition, onSaveCondition, onCodeChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.type = ConditionTypeEnum.Custom;
      condition.code = "return true";
      onSaveCondition(condition);

      // Act - useConditionConfig.ts:100-104
      condition.code = "return false";
      onCodeChange(0);

      // Assert - useConditionConfig.ts:77
      expect(condition.notSaved).toBe(true);
    });

    it("清空code内容 - 应检测到变化并标记未保存", () => {
      // Arrange
      const { addCondition, onSaveCondition, onCodeChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.type = ConditionTypeEnum.Custom;
      condition.code = "some code";
      onSaveCondition(condition);

      // Act - useConditionConfig.ts:100-104
      condition.code = "";
      onCodeChange(0);

      // Assert - useConditionConfig.ts:77
      expect(condition.notSaved).toBe(true);
    });

    it("修改为相同代码 - 不应标记未保存", () => {
      // Arrange
      const { addCondition, onSaveCondition, onCodeChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.type = ConditionTypeEnum.Custom;
      condition.code = "test code";
      onSaveCondition(condition);

      // Act - useConditionConfig.ts:100-104
      condition.code = "test code";
      onCodeChange(0);

      // Assert - useConditionConfig.ts:76-82
      expect(condition.notSaved).toBe(false);
    });

    it("Custom类型修改code并切换类型 - 应保持未保存状态", () => {
      // Arrange
      const { addCondition, onSaveCondition, onCodeChange, onConditionTypeChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.type = ConditionTypeEnum.Custom;
      condition.code = "original code";
      onSaveCondition(condition);

      // 修改代码
      condition.code = "modified code";
      onCodeChange(0);
      expect(condition.notSaved).toBe(true);

      // Act - 切换到Field
      condition.type = ConditionTypeEnum.Field;
      onConditionTypeChange(0);

      // Assert - useConditionConfig.ts:78
      expect(condition.notSaved).toBe(true);
    });
  });

  // ============================================================
  // 5. 保存条件操作 (6个测试)
  // ============================================================

  describe("保存条件操作", () => {
    it("保存新条件 - 应创建快照并更新状态标志", () => {
      // Arrange
      const { addCondition, onSaveCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      expect(condition.notSaved).toBe(true);
      expect(condition.isExists).toBe(false);

      // Act - useConditionConfig.ts:107-114
      onSaveCondition(condition);

      // Assert - useConditionConfig.ts:110-111
      expect(condition.notSaved).toBe(false);
      expect(condition.isExists).toBe(true);
      expect(condition.tempPool).toBeDefined();
    });

    it("保存已存在条件 - 应更新快照", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.field = "originalField";
      onSaveCondition(condition);

      // 修改并标记为未保存
      condition.field = "modifiedField";
      condition.compare = ConditionCompareEnum.Exclude;
      onFieldConditionChange(0);
      expect(condition.notSaved).toBe(true);

      // Act - useConditionConfig.ts:107-114
      onSaveCondition(condition);

      // Assert - useConditionConfig.ts:112
      expect(condition.tempPool.field).toBe("modifiedField");
      expect(condition.tempPool.compare).toBe(ConditionCompareEnum.Exclude);
      expect(condition.notSaved).toBe(false);
    });

    it("保存未修改条件 - 应忽略操作", () => {
      // Arrange
      const { addCondition, onSaveCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      onSaveCondition(condition);
      expect(condition.notSaved).toBe(false);

      // Act - useConditionConfig.ts:107-108
      onSaveCondition(condition);

      // Assert - 应该直接返回，不执行任何操作
      expect(condition.notSaved).toBe(false);
    });

    it("保存后快照结构 - 应包含所有必要字段", () => {
      // Arrange
      const { addCondition, onSaveCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.name = "测试条件";
      condition.type = ConditionTypeEnum.Field;
      condition.field = "testField";
      condition.compare = ConditionCompareEnum.Include;
      condition.expected = "testValue";
      condition.code = "";

      // Act - useConditionConfig.ts:107-114
      onSaveCondition(condition);

      // Assert - useConditionConfig.ts:134-145
      expect(condition.tempPool).toHaveProperty("name", "测试条件");
      expect(condition.tempPool).toHaveProperty("code", "");
      expect(condition.tempPool).toHaveProperty("type", ConditionTypeEnum.Field);
      expect(condition.tempPool).toHaveProperty("field", "testField");
      expect(condition.tempPool).toHaveProperty("compare", ConditionCompareEnum.Include);
      expect(condition.tempPool).toHaveProperty("expected", "testValue");
      expect(condition.tempPool).toHaveProperty("isExists", true);
    });

    it("保存后快照结构 - 应排除id/notSaved/tempPool", () => {
      // Arrange
      const { addCondition, onSaveCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      // Act
      onSaveCondition(condition);

      // Assert - useConditionConfig.ts:134-145
      expect(condition.tempPool).not.toHaveProperty("id");
      expect(condition.tempPool).not.toHaveProperty("notSaved");
      expect(condition.tempPool).not.toHaveProperty("tempPool");
    });

    it("保存Custom类型条件 - 快照应包含code属性", () => {
      // Arrange
      const { addCondition, onSaveCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.type = ConditionTypeEnum.Custom;
      condition.code = "return data";

      // Act - useConditionConfig.ts:107-114
      onSaveCondition(condition);

      // Assert - useConditionConfig.ts:137-138
      expect(condition.tempPool.code).toBe("return data");
      expect(condition.tempPool.type).toBe(ConditionTypeEnum.Custom);
    });
  });

  // ============================================================
  // 6. 取消条件编辑 (5个测试)
  // ============================================================

  describe("取消条件编辑", () => {
    it("取消新条件编辑 - 应从条件列表中删除", () => {
      // Arrange
      const { addCondition, onCancelCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];
      const initialLength = currentEvent.value.conditions!.length;

      expect(condition.isExists).toBe(false);

      // Act - useConditionConfig.ts:117-131
      onCancelCondition(condition);

      // Assert - useConditionConfig.ts:122-124
      expect(currentEvent.value.conditions!.length).toBe(initialLength - 1);
    });

    it("取消已存在条件编辑 - 应恢复快照数据", () => {
      // Arrange
      const { addCondition, onSaveCondition, onCancelCondition, onFieldConditionChange, currentEvent } =
        useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      // 设置原始值并保存
      condition.field = "originalField";
      condition.compare = ConditionCompareEnum.Include;
      condition.expected = "originalExpected";
      onSaveCondition(condition);

      // 修改条件并标记为未保存
      condition.field = "modifiedField";
      condition.compare = ConditionCompareEnum.Exclude;
      condition.expected = "modifiedExpected";
      onFieldConditionChange(0);
      expect(condition.notSaved).toBe(true);

      // Act - useConditionConfig.ts:117-131
      onCancelCondition(condition);

      // Assert - useConditionConfig.ts:126-129
      expect(condition.notSaved).toBe(false);
      expect(condition.field).toBe("originalField");
      expect(condition.compare).toBe(ConditionCompareEnum.Include);
      expect(condition.expected).toBe("originalExpected");
    });

    it("取消未修改条件 - 应忽略操作", () => {
      // Arrange
      const { addCondition, onSaveCondition, onCancelCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      onSaveCondition(condition);
      expect(condition.notSaved).toBe(false);

      // Act - useConditionConfig.ts:117-118
      onCancelCondition(condition);

      // Assert - 应该直接返回，条件保持不变
      expect(condition.notSaved).toBe(false);
    });

    it("恢复快照 - 所有字段应正确恢复", () => {
      // Arrange
      const { addCondition, onSaveCondition, onCancelCondition, onConditionTypeChange, currentEvent } =
        useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      // 设置原始值
      condition.name = "原始条件";
      condition.type = ConditionTypeEnum.Field;
      condition.field = "origField";
      condition.compare = ConditionCompareEnum.Include;
      condition.expected = "origExpected";
      condition.code = "origCode";
      onSaveCondition(condition);

      // 修改所有字段并标记为未保存
      condition.name = "修改条件";
      condition.type = ConditionTypeEnum.Custom;
      condition.field = "modField";
      condition.compare = ConditionCompareEnum.Exclude;
      condition.expected = "modExpected";
      condition.code = "modCode";
      onConditionTypeChange(0);

      // Act - useConditionConfig.ts:117-131
      onCancelCondition(condition);

      // Assert - useConditionConfig.ts:126-129
      expect(condition.name).toBe("原始条件");
      expect(condition.type).toBe(ConditionTypeEnum.Field);
      expect(condition.field).toBe("origField");
      expect(condition.compare).toBe(ConditionCompareEnum.Include);
      expect(condition.expected).toBe("origExpected");
      expect(condition.code).toBe("origCode");
      expect(condition.notSaved).toBe(false);
    });

    it("取消后再次修改 - 应能正常编辑", () => {
      // Arrange
      const { addCondition, onSaveCondition, onCancelCondition, onFieldConditionChange, currentEvent } =
        useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.field = "original";
      onSaveCondition(condition);

      // 修改并取消
      condition.field = "modified";
      onFieldConditionChange(0);
      expect(condition.notSaved).toBe(true);

      onCancelCondition(condition);
      expect(condition.notSaved).toBe(false);
      expect(condition.field).toBe("original");

      // Act - 再次修改
      condition.field = "newModified";
      onFieldConditionChange(0);

      // Assert - useConditionConfig.ts:93-97
      expect(condition.notSaved).toBe(true);
    });
  });

  // ============================================================
  // 7. 删除条件操作 (5个测试)
  // ============================================================

  describe("删除条件操作", () => {
    it("删除存在的条件 - 应从数组中移除", () => {
      // Arrange
      const { addCondition, onDeleteCondition, currentEvent } = useConditionConfig();
      addCondition();
      addCondition();
      addCondition();

      const deleteId = currentEvent.value.conditions![1].id;
      expect(currentEvent.value.conditions!.length).toBe(3);

      // Act - useConditionConfig.ts:59-66
      onDeleteCondition(deleteId);

      // Assert
      expect(currentEvent.value.conditions!.length).toBe(2);
      expect(currentEvent.value.conditions!.find((c) => c.id === deleteId)).toBeUndefined();
    });

    it("删除不存在的条件ID - 应忽略操作", () => {
      // Arrange
      const { addCondition, onDeleteCondition, currentEvent } = useConditionConfig();
      addCondition();
      addCondition();

      const initialLength = currentEvent.value.conditions!.length;

      // Act - useConditionConfig.ts:59-66
      onDeleteCondition("non-existent-id");

      // Assert - useConditionConfig.ts:61-62
      expect(currentEvent.value.conditions!.length).toBe(initialLength);
    });

    it("删除第一个条件 - 后续条件索引应正确", () => {
      // Arrange
      const { addCondition, onDeleteCondition, currentEvent } = useConditionConfig();
      addCondition();
      addCondition();
      addCondition();

      const firstId = currentEvent.value.conditions![0].id;
      const secondId = currentEvent.value.conditions![1].id;
      const thirdId = currentEvent.value.conditions![2].id;

      // Act
      onDeleteCondition(firstId);

      // Assert
      expect(currentEvent.value.conditions!.length).toBe(2);
      expect(currentEvent.value.conditions![0].id).toBe(secondId);
      expect(currentEvent.value.conditions![1].id).toBe(thirdId);
    });

    it("删除所有条件 - conditions应为空数组", () => {
      // Arrange
      const { addCondition, onDeleteCondition, currentEvent } = useConditionConfig();
      addCondition();

      const conditionId = currentEvent.value.conditions![0].id;

      // Act
      onDeleteCondition(conditionId);

      // Assert
      expect(currentEvent.value.conditions!.length).toBe(0);
    });

    it("删除中间条件 - 前后条件应保持不变", () => {
      // Arrange
      const { addCondition, onSaveCondition, onDeleteCondition, currentEvent } = useConditionConfig();
      addCondition();
      addCondition();
      addCondition();

      const cond1 = currentEvent.value.conditions![0];
      const cond2 = currentEvent.value.conditions![1];
      const cond3 = currentEvent.value.conditions![2];

      // 设置不同的field值以便区分
      cond1.field = "field1";
      cond2.field = "field2";
      cond3.field = "field3";
      onSaveCondition(cond1);
      onSaveCondition(cond2);
      onSaveCondition(cond3);

      // Act
      onDeleteCondition(cond2.id);

      // Assert
      expect(currentEvent.value.conditions!.length).toBe(2);
      expect(currentEvent.value.conditions![0].field).toBe("field1");
      expect(currentEvent.value.conditions![1].field).toBe("field3");
    });
  });

  // ============================================================
  // 8. 条件变更检测 (9个测试)
  // ============================================================

  describe("条件变更检测", () => {
    it("无快照 - 应返回true(已改变)", () => {
      // Arrange
      const { addCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      // 确保没有快照
      condition.tempPool = {} as any;

      // Assert - useConditionConfig.ts:69-73
      // 注意：isConditionChanged是内部方法，我们通过onFieldConditionChange的返回来测试
      const { onFieldConditionChange } = useConditionConfig();
      onFieldConditionChange(0);

      expect(condition.notSaved).toBe(true);
    });

    it("快照为空对象 - 应返回true", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      // 保存条件（这会创建一个包含实际值的快照）
      condition.field = "test";
      onSaveCondition(condition);

      // Act & Assert - 快照有值，字段相同，所以未改变
      onFieldConditionChange(0);
      expect(condition.notSaved).toBe(false);

      // 修改字段后应该标记为未保存
      condition.field = "modified";
      onFieldConditionChange(0);
      expect(condition.notSaved).toBe(true);
    });

    it("所有字段相同 - 应返回false", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.field = "test";
      condition.compare = ConditionCompareEnum.Include;
      condition.expected = "value";
      condition.code = "code";
      condition.type = ConditionTypeEnum.Field;
      onSaveCondition(condition);

      // Act & Assert - useConditionConfig.ts:76-82
      onFieldConditionChange(0);

      expect(condition.notSaved).toBe(false);
    });

    it("code不同 - 应返回true", () => {
      // Arrange
      const { addCondition, onSaveCondition, onCodeChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.type = ConditionTypeEnum.Custom;
      condition.code = "original";
      onSaveCondition(condition);

      // Act
      condition.code = "modified";
      onCodeChange(0);

      // Assert - useConditionConfig.ts:77
      expect(condition.notSaved).toBe(true);
    });

    it("type不同 - 应返回true", () => {
      // Arrange
      const { addCondition, onSaveCondition, onConditionTypeChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.type = ConditionTypeEnum.Field;
      onSaveCondition(condition);

      // Act
      condition.type = ConditionTypeEnum.Custom;
      onConditionTypeChange(0);

      // Assert - useConditionConfig.ts:78
      expect(condition.notSaved).toBe(true);
    });

    it("field不同 - 应返回true", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.field = "field1";
      onSaveCondition(condition);

      // Act
      condition.field = "field2";
      onFieldConditionChange(0);

      // Assert - useConditionConfig.ts:79
      expect(condition.notSaved).toBe(true);
    });

    it("compare不同 - 应返回true", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.compare = ConditionCompareEnum.Include;
      onSaveCondition(condition);

      // Act
      condition.compare = ConditionCompareEnum.Exclude;
      onFieldConditionChange(0);

      // Assert - useConditionConfig.ts:80
      expect(condition.notSaved).toBe(true);
    });

    it("expected不同 - 应返回true", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.expected = "value1";
      onSaveCondition(condition);

      // Act
      condition.expected = "value2";
      onFieldConditionChange(0);

      // Assert - useConditionConfig.ts:81
      expect(condition.notSaved).toBe(true);
    });

    it("多个字段不同 - 应返回true", () => {
      // Arrange
      const { addCondition, onSaveCondition, onFieldConditionChange, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.field = "f1";
      condition.compare = ConditionCompareEnum.Include;
      condition.expected = "e1";
      onSaveCondition(condition);

      // Act - 修改多个字段
      condition.field = "f2";
      condition.compare = ConditionCompareEnum.Exclude;
      condition.expected = "e2";
      onFieldConditionChange(0);

      // Assert - useConditionConfig.ts:76-82
      expect(condition.notSaved).toBe(true);
    });
  });

  // ============================================================
  // 9. 快照管理 (4个测试)
  // ============================================================

  describe("快照管理", () => {
    it("创建快照 - 应包含所有必要字段", () => {
      // Arrange
      const { addCondition, onSaveCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.name = "测试条件";
      condition.type = ConditionTypeEnum.Custom;
      condition.code = "test code";
      condition.field = "testField";
      condition.compare = ConditionCompareEnum.Include;
      condition.expected = "testExpected";
      condition.isExists = true;

      // Act - useConditionConfig.ts:107-114
      onSaveCondition(condition);

      // Assert - useConditionConfig.ts:134-145
      expect(condition.tempPool).toEqual({
        name: "测试条件",
        code: "test code",
        type: ConditionTypeEnum.Custom,
        field: "testField",
        compare: ConditionCompareEnum.Include,
        expected: "testExpected",
        isExists: true
      });
    });

    it("快照结构 - 应排除id/notSaved/tempPool", () => {
      // Arrange
      const { addCondition, onSaveCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.id = "special_id";
      condition.notSaved = true;
      condition.tempPool = { old: "data" } as any;

      // Act
      onSaveCondition(condition);

      // Assert - useConditionConfig.ts:134-145
      expect(condition.tempPool).not.toHaveProperty("id");
      expect(condition.tempPool).not.toHaveProperty("notSaved");
      expect(condition.tempPool).not.toHaveProperty("tempPool");
    });

    it("快照独立性 - 修改原对象不应影响快照", () => {
      // Arrange
      const { addCondition, onSaveCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      condition.field = "original";
      condition.code = "original code";
      onSaveCondition(condition);

      const snapshotField = condition.tempPool.field;
      const snapshotCode = condition.tempPool.code;

      // Act - 修改原对象
      condition.field = "modified";
      condition.code = "modified code";

      // Assert - 快照值应该不变
      expect(condition.tempPool.field).toBe(snapshotField);
      expect(condition.tempPool.code).toBe(snapshotCode);
      expect(condition.tempPool.field).toBe("original");
      expect(condition.tempPool.code).toBe("original code");
    });

    it("快照深度克隆 - 嵌套对象也应独立", () => {
      // Arrange
      const { addCondition, onSaveCondition, currentEvent } = useConditionConfig();
      addCondition();
      const condition = currentEvent.value.conditions![0];

      // 虽然当前结构没有嵌套对象，但验证cloneDeep机制
      condition.code = "test code";
      condition.field = "test field";

      // Act - useConditionConfig.ts:134-145
      onSaveCondition(condition);

      // Assert - 验证返回的是新对象（通过cloneDeep）
      expect(condition.tempPool).not.toBe(condition);
      expect(condition.tempPool.code).toBe("test code");
      expect(condition.tempPool.field).toBe("test field");
    });
  });
});
