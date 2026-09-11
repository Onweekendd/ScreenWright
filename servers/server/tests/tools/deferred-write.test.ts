import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// 在模块加载前设置 WORKSPACE_PATH：这些用例会**写**工作区，不能直接用只读的 mock 目录
const OUTPUT_DIR = path.resolve(__dirname, "output-deferred");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

import { createScreenEditor } from "@/mastra/services/bi-data-sync/screen-read";
import { createDataFilterTool } from "@/mastra/tools/file/create-data-filter";
import { deleteFileTool } from "@/mastra/tools/file/delete-file";

const SCREEN_ID = "75_1";
const FIXTURE = path.resolve(__dirname, "..", "data-read", "mock", `screen_${SCREEN_ID}`);
const screenDir = path.join(OUTPUT_DIR, `screen_${SCREEN_ID}`);
const filterDir = path.join(screenDir, "dataFilterArr");

interface ToolResult {
  success: boolean;
  message: string;
}

const run = (
  tool: { execute?: unknown },
  input: Record<string, unknown>,
  resumeData?: Record<string, unknown>
): Promise<ToolResult> => {
  const execute = tool.execute as (i: Record<string, unknown>, c: Record<string, unknown>) => Promise<ToolResult>;
  const suspended: Array<Record<string, unknown>> = [];
  return execute(input, {
    requestContext: { get: () => undefined },
    // suspend 的返回值被工具直接 return 出去，这里只需要它别抛；载荷内容由各用例自行断言
    agent: { resumeData, suspend: async (payload: Record<string, unknown>) => void suspended.push(payload) }
  });
};

/** 先建好一条真实的过滤器：过 create_data_filter 的 resume 分支，两个文件与组件绑定都是真的 */
const seedFilter = (name: string, bindComponent: Array<{ label: string; id: number }> = []) =>
  run(createDataFilterTool, { screenId: SCREEN_ID, name, bindComponent }, { filterSaved: true });

/**
 * 「落盘推迟到前端确认之后」。
 *
 * delete_file 与 create_data_filter 过去都是**先动磁盘再挂起**：文件已经删了/写了，前端才被问要不要。
 * 用户一拒绝，或者前端保存失败，工作区就跟画布分叉了，而且没有任何东西会把它纠回来。
 * 这批用例钉的就是这个顺序——挂起时磁盘一个字节都没动，确认回来了才写。
 */
describe("前端确认之前不动工作区", () => {
  const copyFixture = () =>
    cpSync(FIXTURE, screenDir, { recursive: true, filter: (src) => !src.split(/[\\/]/).includes(".git") });
  const cleanOutput = () => rmSync(OUTPUT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });

  beforeEach(() => {
    cleanOutput();
    copyFixture();
  });

  afterEach(cleanOutput);

  describe("create_data_filter", () => {
    const input = { screenId: SCREEN_ID, name: "销售额", bindComponent: [{ label: "条形图", id: 4152 }] };

    it("首次执行只挂起，不写任何文件", async () => {
      await run(createDataFilterTool, input);

      expect(existsSync(path.join(filterDir, "销售额.json"))).toBe(false);
      expect(existsSync(path.join(filterDir, "销售额.js"))).toBe(false);
    });

    it("前端保存成功后才写出 {name}.json 与 {name}.js，并同步绑定", async () => {
      const result = await run(createDataFilterTool, input, { filterSaved: true });

      expect(result.success).toBe(true);
      expect(existsSync(path.join(filterDir, "销售额.json"))).toBe(true);
      expect(readFileSync(path.join(filterDir, "销售额.js"), "utf8")).toContain("=>");
      const component = JSON.parse(readFileSync(path.join(screenDir, "component", "4152_条形图.json"), "utf8")) as {
        listenArgs: Array<{ filterName: string }>;
      };
      expect(component.listenArgs.map((item) => item.filterName)).toContain("销售额");
    });

    it("前端保存失败时一个文件都不留", async () => {
      const result = await run(createDataFilterTool, input, { filterSaved: false, error: "画布上没有这个组件" });

      expect(result.success).toBe(false);
      expect(result.message).toBe("画布上没有这个组件");
      expect(existsSync(path.join(filterDir, "销售额.json"))).toBe(false);
    });

    it("用户拒绝时一个文件都不留", async () => {
      const result = await run(createDataFilterTool, input, { approved: false });

      expect(result.success).toBe(false);
      expect(existsSync(path.join(filterDir, "销售额.json"))).toBe(false);
    });

    it("同名过滤器已存在时首次执行就拒绝，不挂起也不覆盖", async () => {
      await seedFilter("销售额");
      const before = readFileSync(path.join(filterDir, "销售额.json"), "utf8");

      const result = await run(createDataFilterTool, input);

      expect(result.success).toBe(false);
      expect(result.message).toContain("已存在");
      expect(readFileSync(path.join(filterDir, "销售额.json"), "utf8")).toBe(before);
    });
  });

  describe("delete_file：过滤器", () => {
    const filterPath = () => path.join(filterDir, "销售额.json");

    it("首次执行只挂起，两个文件都还在", async () => {
      await seedFilter("销售额", [{ label: "条形图", id: 4152 }]);

      await run(deleteFileTool, { path: filterPath() });

      // 改之前这里是先 unlink 再 suspend，用户还没点「确定」文件就没了
      expect(existsSync(filterPath())).toBe(true);
      expect(existsSync(path.join(filterDir, "销售额.js"))).toBe(true);
    });

    it("前端解绑成功后两个文件才消失，组件上的 listenArgs 也被摘干净", async () => {
      await seedFilter("销售额", [{ label: "条形图", id: 4152 }]);

      const result = await run(deleteFileTool, { path: filterPath() }, { filterDeleted: true });

      expect(result.success).toBe(true);
      expect(existsSync(filterPath())).toBe(false);
      expect(existsSync(path.join(filterDir, "销售额.js"))).toBe(false);
      const component = JSON.parse(readFileSync(path.join(screenDir, "component", "4152_条形图.json"), "utf8")) as {
        listenArgs: Array<{ filterName: string }>;
      };
      expect(component.listenArgs.map((item) => item.filterName)).not.toContain("销售额");
    });

    it("前端删除失败时文件原样保留", async () => {
      await seedFilter("销售额");

      const result = await run(deleteFileTool, { path: filterPath() }, { filterDeleted: false, error: "解绑失败" });

      expect(result.success).toBe(false);
      expect(existsSync(filterPath())).toBe(true);
    });

    it("用户拒绝时文件原样保留", async () => {
      await seedFilter("销售额");

      const result = await run(deleteFileTool, { path: filterPath() }, { approved: false, filterDeleted: false });

      expect(result.success).toBe(false);
      expect(result.message).toContain("用户取消");
      expect(existsSync(filterPath())).toBe(true);
    });

    it("文件名被净化过时，按 JSON 里的真实名删，不按文件名删", async () => {
      // "获取>18占比" 落盘会被净化成 "获取18占比"，两边名字对不上就会删错或删不掉
      mkdirSync(filterDir, { recursive: true });
      const raw = {
        name: "获取>18占比",
        callBack: [],
        callBackStatus: false,
        dataFormatter: "获取18占比.js",
        bindComponent: [],
        checked: true,
        notSaved: false,
        tempPool: { callBack: [], dataFormatter: "" },
        show: true
      };
      writeFileSync(path.join(filterDir, "获取18占比.json"), JSON.stringify(raw, null, 2), "utf8");
      writeFileSync(path.join(filterDir, "获取18占比.js"), "(data) => data", "utf8");

      const result = await run(
        deleteFileTool,
        { path: path.join(filterDir, "获取18占比.json") },
        { filterDeleted: true }
      );

      expect(result.success).toBe(true);
      expect(existsSync(path.join(filterDir, "获取18占比.json"))).toBe(false);
    });
  });

  describe("delete_file：组件", () => {
    const componentPath = path.join(screenDir, "component", "4156_分组.json");

    it("首次执行只挂起，组件文件与子目录都还在", async () => {
      await run(deleteFileTool, { path: componentPath });

      expect(existsSync(componentPath)).toBe(true);
      expect(existsSync(path.join(screenDir, "component", "4156_分组"))).toBe(true);
    });

    it("前端删除成功后，组件文件与它整棵子树才消失", async () => {
      const result = await run(deleteFileTool, { path: componentPath }, { componentId: 4156 });

      expect(result.success).toBe(true);
      expect(existsSync(componentPath)).toBe(false);
      expect(existsSync(path.join(screenDir, "component", "4156_分组"))).toBe(false);
      expect(createScreenEditor(SCREEN_ID).component.find(4154)).toBeNull();
    });

    it("前端删除失败时组件原样保留", async () => {
      const result = await run(deleteFileTool, { path: componentPath }, { error: "组件被锁定" });

      expect(result.success).toBe(false);
      expect(existsSync(componentPath)).toBe(true);
      expect(createScreenEditor(SCREEN_ID).component.find(4156)).not.toBeNull();
    });
  });
});
