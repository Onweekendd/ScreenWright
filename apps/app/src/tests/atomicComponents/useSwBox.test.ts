import { describe, expect, it } from "vitest";

import { buildSwBoxStyle } from "@material/components/ScreenwrightMedia/components/swBox/useSwBox";

// ============================================================
// buildSwBoxStyle：纯函数，空 option 得到透明盒子默认样式，
// 各字段单独设置时正确进入 style 对象（方案文档 §4.3）。
// ============================================================

describe("buildSwBoxStyle", () => {
  it("空 option 时返回透明盒子的默认样式（pointerEvents 默认 none，不含其他字段）", () => {
    const style = buildSwBoxStyle(undefined);
    expect(style).toEqual({ pointerEvents: "none" });
  });

  it("null option 同样得到默认样式", () => {
    const style = buildSwBoxStyle(null);
    expect(style).toEqual({ pointerEvents: "none" });
  });

  it("pointerEvents=true 时映射为 auto", () => {
    const style = buildSwBoxStyle({ pointerEvents: true });
    expect(style.pointerEvents).toBe("auto");
  });

  it("background 透传（支持渐变字符串）", () => {
    const style = buildSwBoxStyle({ background: "linear-gradient(90deg, #000, #fff)" });
    expect(style.background).toBe("linear-gradient(90deg, #000, #fff)");
  });

  it("border 透传", () => {
    const style = buildSwBoxStyle({ border: "1px solid rgba(69,131,255,.4)" });
    expect(style.border).toBe("1px solid rgba(69,131,255,.4)");
  });

  it("borderRadius 为数字时补 px 单位", () => {
    const style = buildSwBoxStyle({ borderRadius: 8 });
    expect(style.borderRadius).toBe("8px");
  });

  it("borderRadius 为字符串时按 CSS 原样透传", () => {
    const style = buildSwBoxStyle({ borderRadius: "8px 8px 0 0" });
    expect(style.borderRadius).toBe("8px 8px 0 0");
  });

  it("boxShadow 透传", () => {
    const style = buildSwBoxStyle({ boxShadow: "inset 0 0 20px rgba(69,131,255,.5)" });
    expect(style.boxShadow).toBe("inset 0 0 20px rgba(69,131,255,.5)");
  });

  it("backdropFilter 透传", () => {
    const style = buildSwBoxStyle({ backdropFilter: "blur(8px)" });
    expect(style.backdropFilter).toBe("blur(8px)");
  });

  it("opacity 透传", () => {
    const style = buildSwBoxStyle({ opacity: 0.5 });
    expect(style.opacity).toBe(0.5);
  });

  it("clipPath 透传", () => {
    const style = buildSwBoxStyle({ clipPath: "polygon(12px 0,100% 0,100% 100%,0 100%,0 12px)" });
    expect(style.clipPath).toBe("polygon(12px 0,100% 0,100% 100%,0 100%,0 12px)");
  });

  it("transform 透传", () => {
    const style = buildSwBoxStyle({ transform: "rotate(3deg)" });
    expect(style.transform).toBe("rotate(3deg)");
  });

  it("animation 透传（内置预设关键帧名）", () => {
    const style = buildSwBoxStyle({ animation: "sw-breath 3s infinite" });
    expect(style.animation).toBe("sw-breath 3s infinite");
  });

  it("所有字段同时设置时全部正确进入 style 对象", () => {
    const option = {
      background: "#123456",
      border: "1px solid #fff",
      borderRadius: 4,
      boxShadow: "0 0 4px #000",
      backdropFilter: "blur(4px)",
      opacity: 0.8,
      clipPath: "circle(50%)",
      transform: "scale(1.1)",
      animation: "sw-zoom 2s infinite",
      pointerEvents: true
    };
    const style = buildSwBoxStyle(option);
    expect(style).toEqual({
      pointerEvents: "auto",
      background: "#123456",
      border: "1px solid #fff",
      borderRadius: "4px",
      boxShadow: "0 0 4px #000",
      backdropFilter: "blur(4px)",
      opacity: 0.8,
      clipPath: "circle(50%)",
      transform: "scale(1.1)",
      animation: "sw-zoom 2s infinite"
    });
  });
});
