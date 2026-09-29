import { describe, expect, it, vi } from "vitest";

import { ref } from "vue";

// 不挂载组件，直接调用 hook；仅拦截 vue 生命周期，computed/ref/watch 保留真实行为
vi.mock("vue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue")>()),
  onMounted: vi.fn(),
  onBeforeUnmount: vi.fn()
}));

// useSwImg 把取数/option 读取委托给 useBaseData，毛玻璃样式委托给 useFrostedStyle，
// 这里 mock 掉两者，直接控制 option/dataChart，聚焦验证 useSwImg 自身的样式派生逻辑。
const mockOption = ref<Record<string, any>>({});
const mockDataChart = ref<any>({});

vi.mock("@screenwright/composables", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@screenwright/composables")>();
  return {
    ...actual,
    useBaseData: vi.fn(() => ({
      dataChart: mockDataChart,
      option: mockOption,
      isBuild: { value: false },
      clickFormatter: undefined
    })),
    useFrostedStyle: vi.fn(() => ({
      getFrostedStyle: ref({})
    }))
  };
});

import {
  buildAnimationStyle,
  buildFilterStyle,
  buildTransformStyle,
  useSwImg
} from "@material/components/ScreenwrightMedia/components/swImg/useSwImg";

// ============================================================
// 纯函数：option.filter / option.transform 在新 schema 里已是完整 CSS 字符串，直接透传
// ============================================================

describe("buildFilterStyle", () => {
  it("option.filter 已是完整 CSS filter 字符串，原样透传", () => {
    expect(buildFilterStyle({ filter: "blur(4px) brightness(1.2) grayscale(1)" })).toEqual({
      filter: "blur(4px) brightness(1.2) grayscale(1)"
    });
  });

  it("option.filter 未设置时透传 undefined", () => {
    expect(buildFilterStyle({})).toEqual({ filter: undefined });
  });
});

describe("buildTransformStyle", () => {
  it("option.transform 已是完整 CSS transform 字符串，原样透传", () => {
    expect(buildTransformStyle({ transform: "scaleX(-1)" })).toEqual({ transform: "scaleX(-1)" });
  });

  it("option.transform 未设置时透传 undefined", () => {
    expect(buildTransformStyle({})).toEqual({ transform: undefined });
  });
});

describe("buildAnimationStyle", () => {
  it("option.animation 存在时映射为 animation + WebkitAnimation", () => {
    expect(buildAnimationStyle({ animation: "sw-rotate 8s linear infinite" })).toEqual({
      animation: "sw-rotate 8s linear infinite",
      WebkitAnimation: "sw-rotate 8s linear infinite"
    });
  });

  it("option.animation 未设置时返回空对象（不覆盖 keyframes 驱动的动画）", () => {
    expect(buildAnimationStyle({})).toEqual({});
  });
});

// ============================================================
// useSwImg：legacy 格式 option 经 upgradeSwimgOption 自动升级后，
// 驱动出正确的当前 schema 样式（旋转 -> transform）
// ============================================================

describe("useSwImg", () => {
  it("legacy 格式 option（rotateShow/rotateX/Y/Z）自动升级为 transform，并进入 img 样式", () => {
    mockOption.value = {
      rotateShow: true,
      rotateX: 10,
      rotateY: 20,
      rotateZ: 30
    };
    mockDataChart.value = { value: "a.png" };

    const { option, styleImgBoxName } = useSwImg({} as any);

    expect(option.value.transform, "legacy 旋转字段应升级为 CSS transform 字符串").toBe(
      "rotateX(10deg) rotateY(20deg) rotateZ(30deg)"
    );
    expect(styleImgBoxName.value.transform, "样式对象应携带升级后的 transform").toBe(
      "rotateX(10deg) rotateY(20deg) rotateZ(30deg)"
    );
  });

  it("legacy 格式 option（滤镜开关）自动升级为 filter 字符串，并进入 img 样式", () => {
    mockOption.value = {
      contrastShow: true,
      contrast: 120,
      gaussianBlurShow: true,
      gaussianBlur: 4
    };
    mockDataChart.value = { value: "a.png" };

    const { option, styleImgBoxName } = useSwImg({} as any);

    expect(option.value.filter).toBe("contrast(120%) blur(4px)");
    expect(styleImgBoxName.value.filter).toBe("contrast(120%) blur(4px)");
  });

  it("当前格式 option（无 legacy 字段）经 upgradeSwimgOption 保持恒等", () => {
    mockOption.value = {
      objectFit: "cover",
      opacity: 0.5,
      pointerEvents: true
    };
    mockDataChart.value = { value: "a.png" };

    const { option, styleImgBoxName } = useSwImg({} as any);

    expect(option.value).toEqual(mockOption.value);
    expect(styleImgBoxName.value.objectFit).toBe("cover");
    expect(styleImgBoxName.value.opacity).toBe(0.5);
    expect(styleImgBoxName.value.pointerEvents).toBe("auto");
  });
});
