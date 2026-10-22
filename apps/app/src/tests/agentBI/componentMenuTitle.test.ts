import { describe, expect, it } from "vitest";

import { componentMenuTitle } from "@/views/build/components/agentBI/hooks/componentMenuTitle";

describe("componentMenuTitle", () => {
  it("agent 给组件起了实例名时，仍按组件类型名去菜单里找", () => {
    // 实测载荷：name 是 agent 起的实例名，title 才是菜单里的类型名
    expect(componentMenuTitle({ name: "天空底图", title: "图片" })).toBe("图片");
  });

  it("没有 title 的旧载荷退回 name", () => {
    expect(componentMenuTitle({ name: "文本框" })).toBe("文本框");
  });
});
