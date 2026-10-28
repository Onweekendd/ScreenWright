import { describe, expect, it } from "vitest";

import { containerMenuItem } from "@/views/build/components/agentBI/hooks/canvas/containerMenuItem";

describe("containerMenuItem", () => {
  it("动态面板、分组不在组件菜单里，给出固定的菜单项", () => {
    expect(containerMenuItem("动态面板")).toMatchObject({ id: 69, moduleId: 69, title: "动态面板" });
    expect(containerMenuItem("分组")).toMatchObject({ id: 75, moduleId: 75, title: "分组" });
  });

  it("其它组件不归它管，返回 undefined 交给组件菜单去查", () => {
    expect(containerMenuItem("图片")).toBeUndefined();
    expect(containerMenuItem("面板")).toBeUndefined();
  });
});
