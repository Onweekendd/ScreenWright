import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ref } from "vue";

import type { ComponentType } from "@screenwright/types";

// 不挂载组件，直接调用 hook；仅拦截 vue 生命周期，computed/ref/watch 保留真实行为
vi.mock("vue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue")>()),
  onMounted: vi.fn(),
  onBeforeUnmount: vi.fn()
}));

// useText 把取数/option 读取委托给 useBaseData，这里 mock 掉，
// 直接控制 dataChart / option / clickFormatter，聚焦验证 useText 如何把 option 转换成渲染样式。
vi.mock("@screenwright/composables", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    useBaseData: vi.fn()
  };
});

import { useBaseData } from "@screenwright/composables";

import {
  DEFAULTS,
  formatTextValue,
  isGradientColor,
  textShadowToDropShadow,
  useText
} from "@material/components/ScreenwrightText/components/swText/useText";

// ============================================================
// 辅助
// ============================================================

/** 构造 useBaseData 的返回值，option/dataChart 是测试中可修改的 ref */
const setupUseBaseData = (option: Record<string, unknown>, dataValue: unknown = { value: "" }) => {
  const optionRef = ref<Record<string, unknown>>(option);
  const dataChartRef = ref<any>(dataValue);
  vi.mocked(useBaseData).mockReturnValue({
    isBuild: { value: false },
    dataChart: dataChartRef,
    option: optionRef,
    width: ref(200),
    clickFormatter: vi.fn()
  } as any);
  return { optionRef, dataChartRef };
};

const mockElement = {} as ComponentType;

// ============================================================
// 测试套件
// ============================================================

describe("useText", () => {
  beforeEach(() => {
    vi.mocked(useBaseData).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("useText，旧格式 option（selectedTextType/iswrap/shadowShow/textAlignVertical/scroll）自动升级并渲染", () => {
    setupUseBaseData({
      selectedTextType: "normal",
      color: "#112233",
      iswrap: true,
      textAlignVertical: "top",
      shadowShow: true,
      shadowColor: "rgba(0,0,0,1)",
      shadowX: 1,
      shadowY: 2,
      shadowFuzzy: 3,
      scroll: true,
      step: 5,
      speed: 100
    });

    const { option, getTextStyle, styleBox, isMarquee } = useText(mockElement);

    expect(option.value.color, "旧 color 字段应原样搬运").toBe("#112233");
    expect(getTextStyle.value.whiteSpace, "iswrap=true 应转成 pre-line").toBe("pre-line");
    expect(styleBox.value.alignItems, "textAlignVertical=top 应映射为 flex-start").toBe("flex-start");
    expect(getTextStyle.value.textShadow, "非渐变文字下阴影走 text-shadow").toBe("1px 2px 3px rgba(0,0,0,1)");
    expect(isMarquee.value, "旧 scroll=true 应升级为 marquee 存在").toBe(true);
  });

  it("useText，当前格式 option 直接使用，不做二次转换", () => {
    setupUseBaseData({ color: "#abcdef", fontSize: 20 });

    const { option, getTextStyle } = useText(mockElement);

    expect(option.value.color).toBe("#abcdef");
    expect(getTextStyle.value.fontSize, "当前格式字段应直接透传").toBe("20px");
    expect(getTextStyle.value.color).toBe("#abcdef");
  });

  it("useText，color 为 linear-gradient 时，getTextStyle 生成 background-clip 渐变文字样式", () => {
    setupUseBaseData({ color: "linear-gradient(90deg, #fff, #000)" });

    const { getTextStyle } = useText(mockElement);

    expect(getTextStyle.value.backgroundImage).toBe("linear-gradient(90deg, #fff, #000)");
    expect(getTextStyle.value.backgroundClip).toBe("text");
    expect(getTextStyle.value.WebkitBackgroundClip).toBe("text");
    expect(getTextStyle.value.WebkitTextFillColor).toBe("transparent");
    expect(getTextStyle.value.color).toBe("transparent");
  });

  it("useText，渐变文字同时设置 textShadow 时，转成 filter: drop-shadow(...) 而非 text-shadow", () => {
    setupUseBaseData({
      color: "linear-gradient(90deg, #fff, #000)",
      textShadow: "1px 2px 3px #000"
    });

    const { getTextStyle } = useText(mockElement);

    expect(getTextStyle.value.filter).toBe("drop-shadow(1px 2px 3px #000)");
    expect(getTextStyle.value.textShadow, "渐变文字下不应再输出 text-shadow").toBeUndefined();
  });

  it("useText，option.marquee 存在即视为跑马灯，宽度变为 fit-content", () => {
    setupUseBaseData({ marquee: { speed: 50 } });

    const { isMarquee, getTextStyle } = useText(mockElement);

    expect(isMarquee.value).toBe(true);
    expect(getTextStyle.value.width).toBe("fit-content");
  });

  it("useText，仅有旧字段 type='scroll' 但无 scroll 布尔值时，不应触发跑马灯（已修复的死代码路径）", () => {
    setupUseBaseData({ type: "scroll" });

    const { isMarquee } = useText(mockElement);

    expect(isMarquee.value, "type='scroll' 不再是判定依据").toBe(false);
  });

  it("useText，option.href 存在即视为超链接，linkHref/linkTarget 读取自 option", () => {
    setupUseBaseData({ href: "https://example.com", target: "_blank" });

    const { isLink, linkHref, linkTarget } = useText(mockElement);

    expect(isLink.value).toBe(true);
    expect(linkHref.value).toBe("https://example.com");
    expect(linkTarget.value).toBe("_blank");
  });

  it("useText，空 option 时 isLink 为 false", () => {
    setupUseBaseData({});

    const { isLink } = useText(mockElement);

    expect(isLink.value).toBe(false);
  });

  it("useText，空 option 时使用 DEFAULTS 兜底，getTextStyle 无 NaN/undefined 字符串泄漏", () => {
    setupUseBaseData({});

    const { getTextStyle } = useText(mockElement);

    expect(getTextStyle.value.fontFamily).toBe(DEFAULTS.fontFamily);
    expect(getTextStyle.value.fontSize).toBe(`${DEFAULTS.fontSize}px`);
    expect(getTextStyle.value.color).toBe(DEFAULTS.color);
    expect(getTextStyle.value.lineHeight).toBe(DEFAULTS.lineHeight);
    expect(getTextStyle.value.whiteSpace).toBe(DEFAULTS.whiteSpace);
    expect(getTextStyle.value.textOverflow).toBe(DEFAULTS.textOverflow);
    expect(JSON.stringify(getTextStyle.value)).not.toMatch(/NaN|undefined/);
  });
});

// ============================================================
// 纯函数单测：颜色/阴影/数值格式化
// ============================================================

describe("isGradientColor", () => {
  it("isGradientColor，linear-gradient 前缀，返回 true", () => {
    expect(isGradientColor("linear-gradient(90deg, #fff, #000)")).toBe(true);
  });

  it("isGradientColor，radial-gradient 前缀，返回 true", () => {
    expect(isGradientColor("radial-gradient(circle, #fff, #000)")).toBe(true);
  });

  it("isGradientColor，纯色字符串，返回 false", () => {
    expect(isGradientColor("#ffffff")).toBe(false);
  });

  it("isGradientColor，undefined，返回 false", () => {
    expect(isGradientColor(undefined)).toBe(false);
  });
});

describe("textShadowToDropShadow", () => {
  it("textShadowToDropShadow，单层阴影，转成单个 drop-shadow 函数", () => {
    expect(textShadowToDropShadow("1px 2px 3px #000")).toBe("drop-shadow(1px 2px 3px #000)");
  });

  it("textShadowToDropShadow，多层阴影（逗号分隔），转成多个 drop-shadow 函数并用空格拼接", () => {
    expect(textShadowToDropShadow("1px 1px 0 #fff, 2px 2px 4px #000")).toBe(
      "drop-shadow(1px 1px 0 #fff) drop-shadow(2px 2px 4px #000)"
    );
  });
});

describe("formatTextValue", () => {
  it("formatTextValue，decimals=2，数字保留两位小数", () => {
    expect(formatTextValue(1234.5678, { decimals: 2 })).toBe("1234.57");
  });

  it("formatTextValue，thousands=true，千分位分隔", () => {
    expect(formatTextValue(1234567, { thousands: true })).toBe("1,234,567");
  });

  it("formatTextValue，decimals+thousands+template 组合，得到完整格式化文本", () => {
    expect(formatTextValue(1234.5678, { decimals: 2, thousands: true, template: "{value} kWh" })).toBe(
      "1,234.57 kWh"
    );
  });

  it("formatTextValue，非数字内容，decimals/thousands 不生效但 template 仍替换", () => {
    expect(formatTextValue("大屏标题", { decimals: 2, thousands: true, template: "标题：{value}" })).toBe(
      "标题：大屏标题"
    );
  });

  it("formatTextValue，undefined 内容，返回空字符串", () => {
    expect(formatTextValue(undefined, {})).toBe("");
  });
});
