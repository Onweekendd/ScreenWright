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

const runResume = (resumeData: Record<string, unknown>, args: Record<string, unknown> = {}) => {
  const execute = createComponentTool.execute as unknown as (
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ) => Promise<{ success: boolean; filePath?: string; message: string; validationErrors?: string[] }>;

  return execute(
    { screenId: SCREEN_ID, componentName: "条形图", ...args },
    { requestContext: { get: () => undefined }, agent: { resumeData, suspend: async () => undefined } }
  );
};

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
    const result = await runResume({ component: builtComponent(9101, "新条形图") });

    expect(result.success).toBe(true);
    expect(result.filePath).toBe(`screen_${SCREEN_ID}/component/9101_新条形图.json`);
    expect(existsSync(path.join(OUTPUT_DIR, result.filePath!))).toBe(true);
    expect(createScreenEditor(SCREEN_ID).component.find(9101)).not.toBeNull();
  });

  it("带 placement 时落进目标分组的子目录", async () => {
    const result = await runResume(
      { component: builtComponent(9102, "组内条形图") },
      { placement: { parentId: 4156, parentType: "group" } }
    );

    expect(result.filePath).toBe(`screen_${SCREEN_ID}/component/4156_分组/9102_组内条形图.json`);
    expect(existsSync(path.join(OUTPUT_DIR, result.filePath!))).toBe(true);
  });

  it("回传的组件过不了 schema 时不落盘，返回 validationErrors", async () => {
    const broken = { ...builtComponent(9103, "坏组件"), zIndex: "not-a-number" };

    const result = await runResume({ component: broken });

    expect(result.success).toBe(false);
    expect(result.validationErrors?.join("\n")).toContain("zIndex");
    // 首次执行时校验过的是后端 template，回来的这一份是前端另建的，必须重新挡一道
    expect(existsSync(path.join(screenDir, "component", "9103_坏组件.json"))).toBe(false);
    expect(createScreenEditor(SCREEN_ID).component.find(9103)).toBeNull();
  });

  it("目标容器不存在时如实报错，工作区保持原样", async () => {
    const before = readJson(path.join(screenDir, "component", "4152_条形图.json"));

    const result = await runResume(
      { component: builtComponent(9104, "孤儿") },
      { placement: { parentId: 999999, parentType: "group" } }
    );

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
    const result = await runResume({ error: "组件数量已达上限" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("组件数量已达上限");
  });

  /**
   * placement 的空值形态归 execute 收口，下游只认 undefined 一种「没有」。
   * schema 侧收不收 null 见 placement-input.test.ts；这里测的是收下来之后怎么解释。
   */
  describe("placement 规整", () => {
    it("全 null 的 placement 按根级处理，不会被当成「有个叫 null 的容器」", async () => {
      const result = await runResume(
        { component: builtComponent(9107, "根级词云") },
        { placement: { parentId: null, parentType: null, stateId: null } }
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(`screen_${SCREEN_ID}/component/9107_根级词云.json`);
      expect(existsSync(path.join(OUTPUT_DIR, result.filePath!))).toBe(true);
    });

    it("只给 parentId 不给 parentType 时当场说清楚，不挂起也不落盘", async () => {
      const before = readJson(path.join(screenDir, "component", "4152_条形图.json"));

      // resumeData 为空即首次执行：这条要在读模板、交前端之前就拦住
      const result = await runResume({}, { placement: { parentId: 4156 } });

      expect(result.success).toBe(false);
      expect(result.message).toContain("parentType");
      expect(readJson(path.join(screenDir, "component", "4152_条形图.json"))).toEqual(before);
    });
  });
});
