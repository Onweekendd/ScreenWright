import { describe, expect, it } from "vitest";

import { createComponentTool } from "@/mastra/tools/create-component";
import { moveComponentTool } from "@/mastra/tools/move-component";

/**
 * mastra 把 inputSchema 包成了 StandardSchema，类型上不再暴露 zod 的 safeParse，
 * 走标准接口校验——这也正是 mastra 自己拦下工具入参时用的那条路。
 */
interface StandardSchema {
  "~standard": {
    validate: (value: unknown) => { issues?: readonly unknown[] } | Promise<{ issues?: readonly unknown[] }>;
  };
}

const accepts = async (schema: unknown, input: unknown): Promise<boolean> => {
  const result = await (schema as StandardSchema)["~standard"].validate(input);
  return result.issues === undefined;
};

/**
 * 「放哪儿」这类入参的**空值形态**。
 *
 * 模型表达「不适用」的方式是把每个键填成 null，而不是省略整个对象。这不是假想：
 * create_component 线上收到过 `placement: { parentId: null, parentType: null, stateId: null }`
 * （意思是根级新建），被 zod 的 `.optional()`（不收 null）挡在了 execute 之外——
 * 报错发生在 mastra 的入参校验层，execute 压根没跑，所以这层只能用 schema 直接测。
 *
 * 挡住的还偏偏是最常用的那条路：往大屏根上放一个组件。
 */
describe("placement 入参的空值形态", () => {
  const acceptsCreate = (input: Record<string, unknown>) => accepts(createComponentTool.inputSchema, input);

  it("create_component：全 null 的 placement 能过校验（线上原样复现的入参）", async () => {
    await expect(
      acceptsCreate({
        screenId: "76_1",
        componentName: "词云",
        placement: { stateId: null, parentId: null, parentType: null },
        overrides: {}
      })
    ).resolves.toBe(true);
  });

  it("create_component：placement 整体为 null 也能过校验", async () => {
    await expect(acceptsCreate({ screenId: "76_1", componentName: "词云", placement: null })).resolves.toBe(true);
  });

  it("create_component：省略 placement 与嵌套形态一如既往", async () => {
    await expect(acceptsCreate({ screenId: "76_1", componentName: "词云" })).resolves.toBe(true);
    await expect(
      acceptsCreate({ screenId: "76_1", componentName: "词云", placement: { parentId: 4156, parentType: "group" } })
    ).resolves.toBe(true);
  });

  it("create_component：parentType 拼错仍然拒绝——收 null 不等于什么都收", async () => {
    await expect(
      acceptsCreate({ screenId: "76_1", componentName: "词云", placement: { parentId: 4156, parentType: "grup" } })
    ).resolves.toBe(false);
  });

  it("move_component：全 null 的 target 能过校验，语义同「移动到根级」", async () => {
    await expect(
      accepts(moveComponentTool.inputSchema, { componentIds: ["4152"], target: { parentId: null, stateId: null } })
    ).resolves.toBe(true);
  });
});
