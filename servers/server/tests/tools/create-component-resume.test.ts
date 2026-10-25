import { cpSync, existsSync, readFileSync, rmSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// 在模块加载前设置 WORKSPACE_PATH：resume 分支会**写**工作区，不能直接用只读的 mock 目录
const OUTPUT_DIR = path.resolve(__dirname, "output-create-component");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

import { createScreenEditor } from "@/mastra/services/bi-data-sync/screen-read";
import { createComponentTool } from "@/mastra/tools/create-component";

const SCREEN_ID = "75_1";
const FIXTURE = path.resolve(__dirname, "..", "data-read", "mock", `screen_${SCREEN_ID}`);
const screenDir = path.join(OUTPUT_DIR, `screen_${SCREEN_ID}`);

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8")) as Record<string, any>;

/** 前端建好并回传的组件：真实 id 已由业务接口分配，菜单默认值与位置尺寸也都算过了 */
const builtComponent = (id: number, name: string) => ({
  ...readJson(path.join(FIXTURE, "component", "4152_条形图.json")),
  id,
  name,
  title: name,
  left: 10,
  top: 20
});

/** 前端对一个 create_component op 的回执：回传建好的组件 */
const createdOk = (id: number, name: string) => ({ ok: true, component: builtComponent(id, name) });

/** 前端的创建回执：canvas_ops 的 results 与发出去的 ops 按下标一一对应（校验没过的项不在 ops 里） */
const created = (id: number, name: string) => ({ results: [createdOk(id, name)] });

interface ToolResult {
  success: boolean;
  filePath?: string;
  message: string;
  validationErrors?: string[];
  results?: Array<{ index: number; componentName: string; success: boolean; filePath?: string; message: string }>;
}

const execute = createComponentTool.execute as unknown as (
  input: Record<string, unknown>,
  context: Record<string, unknown>
) => Promise<ToolResult>;

const runBatchResume = (resumeData: Record<string, unknown>, components: Array<Record<string, unknown>>) =>
  execute(
    { screenId: SCREEN_ID, components },
    { requestContext: { get: () => undefined }, agent: { resumeData, suspend: async () => undefined } }
  );

const runResume = (resumeData: Record<string, unknown> | undefined, args: Record<string, unknown> = {}) =>
  execute(
    { screenId: SCREEN_ID, componentName: "条形图", ...args },
    { requestContext: { get: () => undefined }, agent: { resumeData, suspend: async () => undefined } }
  );

/**
 * create_component 的 resume 分支：**前端建、后端写**。
 *
 * 前端只负责它独有的那部分（业务接口分配真实 id、按组件菜单建实例），建好把整个组件回传；
 * 放进树、整屏落盘、推导路径全在后端。工作区因此只有一个写入者，
 * 返回给 agent 的 filePath 也一定已经落地（前端那侧的回写是 debounce + 不 await 的）。
 */
describe("create_component resume", () => {
  const copyFixture = () =>
    cpSync(FIXTURE, screenDir, { recursive: true, filter: (src) => !src.split(/[\\/]/).includes(".git") });
  const cleanOutput = () => rmSync(OUTPUT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });

  beforeEach(() => {
    cleanOutput();
    copyFixture();
  });

  afterEach(cleanOutput);

  it("前端回传组件后由后端落盘，filePath 指向真实存在的文件", async () => {
    const result = await runResume(created(9101, "新条形图"));

    expect(result.success).toBe(true);
    expect(result.filePath).toBe(`screen_${SCREEN_ID}/component/9101_新条形图.json`);
    expect(existsSync(path.join(OUTPUT_DIR, result.filePath!))).toBe(true);
    expect(createScreenEditor(SCREEN_ID).component.find(9101)).not.toBeNull();
  });

  it("带 placement 时落进目标分组的子目录", async () => {
    const result = await runResume(created(9102, "组内条形图"), { placement: { parentId: 4156, parentType: "group" } });

    expect(result.filePath).toBe(`screen_${SCREEN_ID}/component/4156_分组/9102_组内条形图.json`);
    expect(existsSync(path.join(OUTPUT_DIR, result.filePath!))).toBe(true);
  });

  it("回传的组件过不了 schema 时不落盘，返回 validationErrors", async () => {
    const broken = { ...builtComponent(9103, "坏组件"), zIndex: 5 };

    const result = await runResume({ results: [{ ok: true, component: broken }] });

    expect(result.success).toBe(false);
    expect(result.validationErrors?.join("\n")).toContain("zIndex");
    // 首次执行时校验过的是后端 template，回来的这一份是前端另建的，必须重新挡一道
    expect(existsSync(path.join(screenDir, "component", "9103_坏组件.json"))).toBe(false);
    expect(createScreenEditor(SCREEN_ID).component.find(9103)).toBeNull();
  });

  it("目标容器不存在时如实报错，工作区保持原样", async () => {
    const before = readJson(path.join(screenDir, "component", "4152_条形图.json"));

    const result = await runResume(created(9104, "孤儿"), { placement: { parentId: 999999, parentType: "group" } });

    expect(result.success).toBe(false);
    expect(result.message).toContain("写入工作区失败");
    expect(readJson(path.join(screenDir, "component", "4152_条形图.json"))).toEqual(before);
  });

  it("用户拒绝时不落盘", async () => {
    const result = await runResume({ approved: false });

    expect(result.success).toBe(false);
    expect(result.message).toContain("用户取消");
    expect(
      createScreenEditor(SCREEN_ID)
        .component.getLayers()
        .map((item) => item.id)
    ).toEqual([4152, 4153, 4166, 4156, 4157]);
  });

  it("前端创建失败时透传错误，不落盘", async () => {
    const result = await runResume({ results: [{ ok: false, error: "组件数量已达上限" }] });

    expect(result.success).toBe(false);
    expect(result.message).toBe("组件数量已达上限");
  });

  /**
   * placement 的空值形态归 execute 收口，下游只认 undefined 一种「没有」。
   * schema 侧收不收 null 见 placement-input.test.ts；这里测的是收下来之后怎么解释。
   */
  describe("placement 规整", () => {
    it("全 null 的 placement 按根级处理，不会被当成「有个叫 null 的容器」", async () => {
      const result = await runResume(created(9107, "根级词云"), {
        placement: { parentId: null, parentType: null, stateId: null }
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(`screen_${SCREEN_ID}/component/9107_根级词云.json`);
      expect(existsSync(path.join(OUTPUT_DIR, result.filePath!))).toBe(true);
    });

    it("只给 parentId 不给 parentType 时当场说清楚，不挂起也不落盘", async () => {
      const before = readJson(path.join(screenDir, "component", "4152_条形图.json"));

      // 没有 resumeData 即首次执行：这条要在读模板、交前端之前就拦住
      const result = await runResume(undefined, { placement: { parentId: 4156 } });

      expect(result.success).toBe(false);
      expect(result.message).toContain("parentType");
      expect(readJson(path.join(screenDir, "component", "4152_条形图.json"))).toEqual(before);
    });
  });

  /**
   * 批量：一次挂起带多个 op，回执 results[k] 对应第 k 个发给前端的 op。
   * 校验没过的项不发给前端，由后端自己记「第 k 个 op 对应入参第几项」。
   * 各项互相独立——一项失败不能连累同批其它项落盘。
   */
  describe("批量创建", () => {
    const two = [{ componentName: "条形图" }, { componentName: "条形图" }];

    it("每项回执各自落盘，results 按 index 逐项列出", async () => {
      const result = await runBatchResume({ results: [createdOk(9201, "甲"), createdOk(9202, "乙")] }, two);

      expect(result.success).toBe(true);
      expect(result.results?.map((r) => [r.index, r.success, r.filePath])).toEqual([
        [0, true, `screen_${SCREEN_ID}/component/9201_甲.json`],
        [1, true, `screen_${SCREEN_ID}/component/9202_乙.json`]
      ]);
      expect(createScreenEditor(SCREEN_ID).component.find(9201)).not.toBeNull();
      expect(createScreenEditor(SCREEN_ID).component.find(9202)).not.toBeNull();
    });

    it("前面的项在准备阶段就被拦下时，回执仍按发给前端的顺序对回入参下标", async () => {
      // 第 1 项（下标 0）缺 parentType 被拦，只有下标 1 的项发给了前端，所以 results 只有一条
      const result = await runBatchResume(created(9205, "戊"), [
        { componentName: "条形图", placement: { parentId: 4156 } },
        { componentName: "条形图" }
      ]);

      expect(result.results?.[0]).toMatchObject({ index: 0, success: false });
      expect(result.results?.[1]).toMatchObject({
        index: 1,
        success: true,
        filePath: `screen_${SCREEN_ID}/component/9205_戊.json`
      });
    });

    it("回执数量和发给前端的 op 数对不上时拒绝，不落盘", async () => {
      const result = await runBatchResume(created(9206, "己"), two);

      expect(result.success).toBe(false);
      expect(result.message).toContain("回执数量");
      expect(createScreenEditor(SCREEN_ID).component.find(9206)).toBeNull();
    });

    it("入参 placement 带的是纯数字 id；发给前端的 ops 与入参一一对应", async () => {
      const suspended: Array<Record<string, any>> = [];
      await execute(
        {
          screenId: SCREEN_ID,
          components: [{ componentName: "条形图", placement: { parentId: 4156, parentType: "group" } }]
        },
        {
          requestContext: { get: () => undefined },
          agent: { suspend: async (payload: Record<string, any>) => void suspended.push(payload) }
        }
      );

      expect(suspended[0]).toMatchObject({
        type: "canvas_ops",
        ops: [{ op: "create_component", placement: { parentId: 4156, parentType: "group" } }]
      });
      expect(suspended[0]!.approval).toBeUndefined();
    });

    it("ASK 模式：整批只带一个 approval", async () => {
      const suspended: Array<Record<string, any>> = [];
      await execute(
        { screenId: SCREEN_ID, components: two },
        {
          requestContext: { get: (key: string) => (key === "mode" ? "ask_before_edit" : undefined) },
          agent: { suspend: async (payload: Record<string, any>) => void suspended.push(payload) }
        }
      );

      expect(suspended[0]!.approval).toEqual({ purpose: expect.stringContaining("创建 2 个组件") });
      expect(suspended[0]!.ops).toHaveLength(2);
    });

    it("一项前端创建失败时，另一项照常落盘，整体 success 为 false", async () => {
      const result = await runBatchResume(
        { results: [{ ok: false, error: "组件数量已达上限" }, createdOk(9203, "丙")] },
        two
      );

      expect(result.success).toBe(false);
      expect(result.results?.[0]).toMatchObject({ index: 0, success: false, message: "组件数量已达上限" });
      expect(result.results?.[1]).toMatchObject({ index: 1, success: true });
      expect(createScreenEditor(SCREEN_ID).component.find(9203)).not.toBeNull();
    });

    it("首次执行就被拦下的项（没发给前端）在回执里缺席，原因仍要还给 agent", async () => {
      // 第 2 项只给 parentId 不给 parentType：placement 在读模板之前就被拒，所以不会进 suspend 载荷
      const result = await runBatchResume(created(9204, "丁"), [
        { componentName: "条形图" },
        { componentName: "条形图", placement: { parentId: 4156 } }
      ]);

      expect(result.success).toBe(false);
      expect(result.results?.[0]).toMatchObject({ index: 0, success: true });
      expect(result.results?.[1]).toMatchObject({ index: 1, success: false });
      expect(result.results?.[1]?.message).toContain("parentType");
    });

    it("用户拒绝时整批都不落盘", async () => {
      const result = await runBatchResume({ approved: false }, two);

      expect(result.success).toBe(false);
      expect(result.message).toContain("用户取消");
    });

    it("components 与顶层 componentName 同时传时当场说清楚，不挂起", async () => {
      const result = await execute(
        { screenId: SCREEN_ID, componentName: "条形图", components: two },
        { requestContext: { get: () => undefined }, agent: { resumeData: undefined, suspend: async () => undefined } }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("components");
    });

    it("全部项都过不了准备阶段时直接返回各自原因，不挂起", async () => {
      let suspended = false;
      const result = await execute(
        {
          screenId: SCREEN_ID,
          components: [
            { componentName: "条形图", placement: { parentId: 4156 } },
            { componentName: "折线图", placement: { parentId: 4157 } }
          ]
        },
        {
          requestContext: { get: () => undefined },
          agent: {
            resumeData: undefined,
            suspend: async () => {
              suspended = true;
            }
          }
        }
      );

      expect(suspended).toBe(false);
      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.results?.every((r) => !r.success && r.message.includes("parentType"))).toBe(true);
    });
  });
});
