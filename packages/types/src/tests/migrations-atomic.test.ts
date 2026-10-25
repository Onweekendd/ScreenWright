import { describe, expect, it } from "vitest";

import {
  isLegacySwimgOption,
  isLegacySwTextOption,
  upgradeComponentOption,
  upgradeSwimgOption,
  upgradeSwTextOption
} from "../migrations/atomic";

describe("swtext 升级函数", () => {
  it("空/当前格式 option 判定为非旧格式，原样返回", () => {
    expect(isLegacySwTextOption(undefined)).toBe(false);
    expect(isLegacySwTextOption({})).toBe(false);
    const current = { fontSize: 18, color: "#fff", textShadow: "0 0 8px #4583ff" };
    expect(isLegacySwTextOption(current)).toBe(false);
    expect(upgradeSwTextOption(current)).toEqual(current);
  });

  it("split -> letterSpacing", () => {
    const result = upgradeSwTextOption({ split: 4 });
    expect(result.letterSpacing).toBe(4);
  });

  it("isLineHeight=true 时按 lineHeight/fontSize 换算为无单位倍数", () => {
    const result = upgradeSwTextOption({ isLineHeight: true, lineHeight: 28, fontSize: 14 });
    expect(result.lineHeight).toBe(2);
  });

  it("isLineHeight=false 时不写 lineHeight", () => {
    const result = upgradeSwTextOption({ isLineHeight: false, lineHeight: 28, fontSize: 14 });
    expect(result.lineHeight).toBeUndefined();
  });

  it("selectedTextType=normal 时 color 直接搬运", () => {
    const result = upgradeSwTextOption({ selectedTextType: "normal", color: "rgba(255,255,255,1)" });
    expect(result.color).toBe("rgba(255,255,255,1)");
  });

  it("selectedTextType=gradient 时拼出 linear-gradient 字符串", () => {
    const result = upgradeSwTextOption({
      selectedTextType: "gradient",
      selectedTextColor: {
        type: "linear-gradient",
        angle: "90",
        colors: [
          { color: "#ffffff", per: 0 },
          { color: "#496adc", per: 100 }
        ]
      }
    });
    expect(result.color).toContain("linear-gradient(90deg");
    expect(result.color).toContain("%");
  });

  it("selectedTextType=multiGradient 时过滤隐藏图层并按 opacity 生成多层颜色", () => {
    const result = upgradeSwTextOption({
      selectedTextType: "multiGradient",
      multiGradientColors: [
        { id: "a", color: "rgba(255,0,0,1)", opacity: 100, isShowColor: true },
        { id: "b", color: "rgba(0,255,0,1)", opacity: 50, isShowColor: false },
        { id: "c", color: "#0000ff", opacity: 50, isShowColor: true }
      ]
    });
    expect(result.color).toContain("rgba(255, 0, 0, 1.000)");
    expect(result.color).not.toContain("rgba(0, 255, 0");
    expect(result.color).toContain("rgba(0, 0, 255, 0.500)");
  });

  it("multiGradientColors 为空数组时不产出 color", () => {
    const result = upgradeSwTextOption({ selectedTextType: "multiGradient", multiGradientColors: [] });
    expect(result.color).toBe("");
  });

  it("shadowShow=false 时不写 textShadow", () => {
    const result = upgradeSwTextOption({ shadowShow: false, shadowColor: "#000", shadowX: 1, shadowY: 1, shadowFuzzy: 2 });
    expect(result.textShadow).toBeUndefined();
  });

  it("shadowShow=true 时拼出 text-shadow 字符串", () => {
    const result = upgradeSwTextOption({ shadowShow: true, shadowColor: "#000", shadowX: 1, shadowY: 2, shadowFuzzy: 3 });
    expect(result.textShadow).toBe("1px 2px 3px #000");
  });

  it("textAlignVertical: center -> middle，其它原样透传", () => {
    expect(upgradeSwTextOption({ textAlignVertical: "center" }).verticalAlign).toBe("middle");
    expect(upgradeSwTextOption({ textAlignVertical: "top" }).verticalAlign).toBe("top");
  });

  it("iswrap 两种取值映射 whiteSpace", () => {
    expect(upgradeSwTextOption({ iswrap: true }).whiteSpace).toBe("pre-line");
    expect(upgradeSwTextOption({ iswrap: false }).whiteSpace).toBe("nowrap");
  });

  it("rotateShow=false 时不写 transform", () => {
    expect(upgradeSwTextOption({ rotateShow: false, rotateX: 10 }).transform).toBeUndefined();
  });

  it("rotateShow=true 时拼出 3D rotate transform", () => {
    const result = upgradeSwTextOption({ rotateShow: true, rotateX: 1, rotateY: 2, rotateZ: 3 });
    expect(result.transform).toBe("rotateX(1deg) rotateY(2deg) rotateZ(3deg)");
  });

  it("scroll=true 时生成 marquee 字段", () => {
    const result = upgradeSwTextOption({ scroll: true, step: 5, speed: 100 });
    expect(result.marquee).toEqual({ speed: 50 });
  });

  it("type=link 时映射 href/target", () => {
    const result = upgradeSwTextOption({ type: "link", linkHref: "https://a.com", linkTarget: "_blank" });
    expect(result.href).toBe("https://a.com");
    expect(result.target).toBe("_blank");
  });

  it("clickFormatter/textAnimation* 未决字段透传，不静默丢弃", () => {
    const result = upgradeSwTextOption({ type: "text", clickFormatter: "function(){}", textAnimationType: "typingEffect" });
    expect(result.clickFormatter).toBe("function(){}");
    expect(result.textAnimationType).toBe("typingEffect");
  });

  it("已是新格式的字段混入一个孤立旧字段（如状态动画写入的 rotateX）时，不冲掉其它新字段", () => {
    // 对应真实场景：状态动画系统给一个已经迁移过的 swtext 组件直接加了一个旧的 rotateX，
    // 不应该因为命中了 isLegacySwTextOption 就把 textShadow/animation 这些新字段一起丢了
    const mixed = { textShadow: "1px 1px 2px #000", animation: "sw-breath 2s infinite", rotateX: 10 };
    const result = upgradeSwTextOption(mixed);
    expect(result.textShadow).toBe("1px 1px 2px #000");
    expect(result.animation).toBe("sw-breath 2s infinite");
    expect(result.rotateX).toBeUndefined();
  });

  it("isLineHeight=false 混入新格式数据时，不会把旧的 px 值当新单位透出去", () => {
    const mixed = { color: "#fff", isLineHeight: false, lineHeight: 28 };
    const result = upgradeSwTextOption(mixed);
    expect(result.lineHeight).toBeUndefined();
  });

  it("幂等：升级两次结果一致", () => {
    const legacy = {
      type: "link",
      linkHref: "https://a.com",
      selectedTextType: "normal",
      color: "#fff",
      shadowShow: true,
      shadowX: 1,
      shadowY: 1,
      shadowFuzzy: 2,
      shadowColor: "#000"
    };
    const once = upgradeSwTextOption(legacy);
    const twice = upgradeSwTextOption(once);
    expect(twice).toEqual(once);
  });
});

describe("swimg 升级函数", () => {
  it("空/当前格式 option 判定为非旧格式，原样返回", () => {
    expect(isLegacySwimgOption(undefined)).toBe(false);
    const current = { objectFit: "cover", filter: "blur(4px)" };
    expect(isLegacySwimgOption(current)).toBe(false);
    expect(upgradeSwimgOption(current)).toEqual(current);
  });

  it("只拼接开关为 true 的滤镜项", () => {
    const result = upgradeSwimgOption({
      contrastShow: true,
      contrast: 120,
      brightnessShow: false,
      brightness: 80,
      gaussianBlurShow: true,
      gaussianBlur: 4,
      hueShow: true,
      hue: 30
    });
    expect(result.filter).toBe("contrast(120%) blur(4px) hue-rotate(30deg)");
  });

  it("shadowShow=true 时把 drop-shadow 拼进 filter", () => {
    const result = upgradeSwimgOption({ shadowShow: true, shadowColor: "#000", shadowX: 1, shadowY: 2, shadowFuzzy: 3 });
    expect(result.filter).toBe("drop-shadow(#000 1px 2px 3px)");
  });

  it("没有任何滤镜开关时不写 filter", () => {
    const result = upgradeSwimgOption({ rotateShow: true, rotateX: 1, rotateY: 0, rotateZ: 0 });
    expect(result.filter).toBeUndefined();
  });

  it("rotateShow=true 时拼出 transform", () => {
    const result = upgradeSwimgOption({ rotateShow: true, rotateX: 1, rotateY: 2, rotateZ: 3 });
    expect(result.transform).toBe("rotateX(1deg) rotateY(2deg) rotateZ(3deg)");
  });

  it("animationShow=true 且非 customize 时按 §5.3 预设名拼出 animation 简写", () => {
    const result = upgradeSwimgOption({
      animationShow: true,
      animationType: "clockwise",
      animationTime: 8,
      animationSpeed: "constant",
      animationDelayed: 0,
      animationLoop: true
    });
    expect(result.animation).toBe("sw-rotate 8s linear 0s infinite");
  });

  it("animationShow=false 时不写 animation", () => {
    const result = upgradeSwimgOption({ animationShow: false, animationType: "clockwise" });
    expect(result.animation).toBeUndefined();
  });

  it("animationType=customize 时保留 keyframes 并转换 animation 时长部分", () => {
    const frames = [{ offset: 0, opacity: 1 }];
    const result = upgradeSwimgOption({
      animationShow: true,
      animationType: "customize",
      customizeArray: frames,
      animationTime: 2,
      animationSpeed: "constant",
      animationDelayed: 0,
      animationLoop: false
    });
    expect(result.keyframes).toBe(frames);
    expect(result.animation).toBe("2s linear 0s 1");
  });

  it("duration -> transition", () => {
    expect(upgradeSwimgOption({ duration: "1000" }).transition).toBe("opacity 1000ms");
  });

  it("已是新格式的字段混入一个孤立旧字段（如状态动画写入的 rotateX）时，不冲掉其它新字段", () => {
    const mixed = { filter: "blur(4px)", background: "#000", rotateX: 10 };
    const result = upgradeSwimgOption(mixed);
    expect(result.filter).toBe("blur(4px)");
    expect(result.background).toBe("#000");
    expect(result.rotateX).toBeUndefined();
  });

  it("幂等：升级两次结果一致", () => {
    const legacy = { rotateShow: true, rotateX: 1, rotateY: 0, rotateZ: 0, contrastShow: true, contrast: 120 };
    const once = upgradeSwimgOption(legacy);
    const twice = upgradeSwimgOption(once);
    expect(twice).toEqual(once);
  });
});

describe("upgradeComponentOption 顶层分发", () => {
  it("swtext/swimg 按 prop 分发，其它 prop 原样返回", () => {
    const textComp = { component: { prop: "swtext" }, option: { split: 2 } };
    expect(upgradeComponentOption(textComp).option).toEqual({ letterSpacing: 2 });

    const imgComp = { component: { prop: "swimg" }, option: { duration: "500" } };
    expect(upgradeComponentOption(imgComp).option).toEqual({ transition: "opacity 500ms" });

    const other = { component: { prop: "echartline" }, option: { foo: "bar" } };
    expect(upgradeComponentOption(other)).toBe(other);
  });
});
