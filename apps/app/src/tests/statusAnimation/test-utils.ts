import { vi } from "vitest";

import { useStatusAnimationState } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/components/hooks/useStatusAnimationState";
import { useAnimation } from "@/views/build/components/buildRender/hooks/useAnimation";
import { useGlobalAnimation } from "@/views/build/components/buildRender/hooks/useGlobalAnimation";

import { AnimationTestHelper } from "../animation-testing/helpers/AnimationTestHelper";
// 多过滤器测试 当前一个条形图组件绑定了4个过滤器
import mockDetail from "./componentData.mock.json";
import mockDetail2 from "./componentData2.mock.json";

// 模拟Vue的组件生命周期
const mockOnBeforeMount = vi.fn();
const mockOnMounted = vi.fn();
const mockOnUnmounted = vi.fn();
const mockInject = vi.fn();

vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onBeforeMount: (fn: Function) => mockOnBeforeMount(fn),
  onMounted: (fn: Function) => mockOnMounted(fn),
  onUnmounted: (fn: Function) => mockOnUnmounted(fn),
  inject: (key: any, defaultValue?: any) => mockInject(key, defaultValue)
}));

// 保留原始 uuid 生成随机值
vi.mock("@/utils/utils", async () => {
  const actual = (await vi.importActual("@/utils/utils")) as any;
  return {
    ...actual,
    uuid: actual.uuid // 使用真实的 uuid 函数，产生随机值
  };
});

// mock 获取大屏详情接口，每次返回 mockDetail 的深拷贝
vi.mock("@/api/build", () => ({
  getLargeScreenInfo: vi.fn().mockImplementation((mockData: number) => {
    if (mockData === 1) {
      return Promise.resolve({ result: JSON.parse(JSON.stringify(mockDetail)) });
    } else {
      return Promise.resolve({ result: JSON.parse(JSON.stringify(mockDetail2)) });
    }
  })
}));

vi.mock("@/api/library", () => ({
  updateLargeScreen: vi.fn().mockResolvedValue({ success: true, code: 200 }),

  // 更新组件数据接口 mock每次成功
  updateLayersAgg: vi.fn().mockResolvedValue({ success: true }),

  delLayersAgg: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("@/api/visual", () => ({
  getScreenMeta: vi.fn().mockResolvedValue({
    result: {
      updatedTime: "2025-08-26 10:00:00"
    }
  })
}));

vi.mock("@/utils/service", () => ({
  createRequest: vi.fn()
}));

vi.mock("@/utils/cacheService", () => ({
  createRequest: vi.fn()
}));

vi.mock("@/utils/config", () => ({
  BaseName: {
    Online: "online",
    System: "system"
  }
}));

// mock Element Plus 消息组件
vi.mock("element-plus", () => {
  const error = vi.fn((msg?: any) => {
    // 测试环境下以醒目的红色输出错误
    console.error(`\x1b[31m${String(msg)}\x1b[0m`);
  });
  return {
    ElMessage: {
      error,
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    },
    ElMessageBox: {
      confirm: vi.fn()
    }
  };
});

import dayjs from "dayjs";

import { getLargeScreenInfo } from "@/api/build";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { useStatusAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useCacheData } from "@/views/build/useCacheData";
import { useCacheTime } from "@/views/build/useCacheTime";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useDataFilter } from "../../views/build/useDataFilter";
import { useLargeScreenInfo } from "../../views/build/useLargeScreenInfo";

/**
 * 测试工具类，提供所有状态动画测试的公共设置和工具函数
 */
export class StatusAnimationTestUtils {
  public animationHelper: AnimationTestHelper;

  constructor() {
    this.animationHelper = new AnimationTestHelper();
  }

  /**
   * 设置测试环境，在每个测试前调用
   */
  async setupTestEnvironment(mockData = 1) {
    const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
    const { setGroupData, groupData, resetGroupData } = useGlobalComponentData();
    const { initCallbackArguments, onClear } = useCallbackArguments();
    const { setDetail2Config, resetEditStore } = useEditStore();
    const { resetDataFilter, cloneDataFilterOnInit } = useDataFilter();
    const { resetState, setEditorVisible } = useStatusAnimationData();
    const { lastCacheTime } = useCacheTime();

    // 清理所有 mock 调用记录
    vi.clearAllMocks();

    onClear();
    resetEditStore();
    resetNavInfo();
    resetGroupData();
    resetDataFilter();
    resetState();

    // 通过 mock 接口返回的数据进行初始化
    const res = await getLargeScreenInfo(mockData);
    setNavInfo(res.result);
    setGroupData(res.result);
    setDetail2Config(res.result);
    initCallbackArguments(groupData.value);
    cloneDataFilterOnInit();
    lastCacheTime.value = dayjs("2025-08-26 10:00:00").valueOf();
    setEditorVisible(true);

    // 为测试组件注册动画触发器
    groupData.value.forEach((component) => {
      const { triggerAnimation } = useAnimation(component.id);
      const { registerAnimationTrigger } = useGlobalAnimation();
      registerAnimationTrigger(component.id.toString(), triggerAnimation);
    });
  }

  /**
   * 清理测试环境，在每个测试后调用
   */
  cleanupTestEnvironment() {
    const { buildWorkerCacheInput } = useCacheData();
    const { editorVisible } = useStatusAnimationData();

    editorVisible.value = false;

    const workerCacheInput = buildWorkerCacheInput(Date.now());

    structuredClone(workerCacheInput);

    // 清理动画触发器注册表
    const { resetTriggerRegistry } = useGlobalAnimation();
    resetTriggerRegistry();

    // 清理动画测试助手
    if (this.animationHelper) {
      this.animationHelper.cleanup();
    }
  }

  /**
   * 获取测试用的图片组件
   */
  getImageComponent() {
    const { groupData } = useGlobalComponentData();
    return groupData.value[0];
  }

  /**
   * 初始化状态动画系统
   */
  initStatusAnimation() {
    const { initAnimationAndComponentDefaultConfigMap } = useStatusAnimation();
    initAnimationAndComponentDefaultConfigMap();
  }

  /**
   * 设置当前选择的动画和状态
   */
  setupCurrentAnimationAndStatus() {
    const { getCurrentAnimationList, getCurrentStatusList, setSelectAnimationId, setSelectStatusId } =
      useStatusAnimationData();

    const animationList = getCurrentAnimationList();
    setSelectAnimationId(animationList[0].id);

    const statusList = getCurrentStatusList.value;
    setSelectStatusId(statusList[0].statusId);

    return {
      animationId: animationList[0].id,
      statusId: statusList[0].statusId
    };
  }

  /**
   * 添加组件到状态动画
   */
  async addComponentToStatusAnimation(component: any) {
    const { handleComponentAddToStatusAnimation } = useStatusAnimation();
    await handleComponentAddToStatusAnimation({ component });
  }

  /**
   * 为组件添加过渡属性
   */
  async addTransitionProperties(
    componentId: string,
    properties: Array<
      | "left"
      | "top"
      | "zIndex"
      | "display"
      | "width"
      | "height"
      | "opacity"
      | "rotateX"
      | "rotateY"
      | "rotateZ"
      | "image"
    >
  ) {
    const { addTransitionPropertiesForComponent } = useStatusAnimation();
    await addTransitionPropertiesForComponent(componentId, properties);
  }

  /**
   * 删除组件的过渡属性
   */
  async removeTransitionProperties(
    componentId: string,
    properties: Array<
      | "left"
      | "top"
      | "zIndex"
      | "display"
      | "width"
      | "height"
      | "opacity"
      | "rotateX"
      | "rotateY"
      | "rotateZ"
      | "image"
    >
  ) {
    const { removeTransitionPropertiesForComponent } = useStatusAnimation();
    await removeTransitionPropertiesForComponent(componentId, properties);
  }

  /**
   * 触发状态动画
   */
  async triggerStatusAnimation(componentId: string, animationId: string, statusId: string) {
    const statusAnimationState = useStatusAnimationState();
    return await this.animationHelper.triggerStatusAnimation(componentId, animationId, statusId, statusAnimationState);
  }

  /**
   * 同步组件配置
   */
  async syncComponentConfig(component: any) {
    const { syncComponentConfigDirect } = useStatusAnimation();
    await syncComponentConfigDirect(component);
  }
}

/**
 * 创建测试工具实例的工厂函数
 */
export function createTestUtils(): StatusAnimationTestUtils {
  return new StatusAnimationTestUtils();
}
