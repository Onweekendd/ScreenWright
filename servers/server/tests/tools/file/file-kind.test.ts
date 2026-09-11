import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

// 纯路径判定，不碰磁盘，所以 workspace 只需要是个路径、不必真存在。
// **故意叫 agent-workspace**：真实部署就是这个名字。
const WORKSPACE = path.resolve("/tmp/fk-test/agent-workspace");
const ORIGINAL = process.env.MASTRA_WORKSPACE_PATH;
process.env.MASTRA_WORKSPACE_PATH = WORKSPACE;

import {
  isAgentArtifactFilePath,
  isComponentFilePath,
  isDataFilterFilePath,
  isScreenInfoFilePath,
  isVuePartFilePath
} from "@/mastra/tools/file/file-kind";

afterAll(() => {
  process.env.MASTRA_WORKSPACE_PATH = ORIGINAL;
});

/** 工作区内的路径，正斜杠形态（与 edit-files 里 normalizedPath 一致） */
const inWorkspace = (rel: string) => path.join(WORKSPACE, rel).split(path.sep).join("/");

describe("file-kind 路径判定", () => {
  describe("大屏范围判定（曾经的死分支）", () => {
    /**
     * 这两条此前写成 includes("/workspace/screen_")，而工作区实际叫 agent-workspace，
     * workspace 前面是 "-" 不是 "/"，真实部署下恒为 false：
     *   - 改 info.json 不推送到前端（AI 改大屏尺寸，画布纹丝不动）
     *   - ASK 模式下 agent 自己的中间产物照样弹审批框
     * 测试当时用的临时目录恰好叫 workspace，把 bug 挡住了。
     */
    it("info.json 在 agent-workspace 下也认得出是大屏配置", () => {
      expect(isScreenInfoFilePath(inWorkspace("screen_75_1/info.json"))).toBe(true);
    });

    it("agent 产物在 agent-workspace 下也认得出", () => {
      expect(isAgentArtifactFilePath(inWorkspace("screen_75_1/_analysis.json"))).toBe(true);
      expect(isAgentArtifactFilePath(inWorkspace("screen_75_1/template-75.json"))).toBe(true);
    });

    it("工作区之外的同名文件不算大屏文件", () => {
      expect(isScreenInfoFilePath("/somewhere/else/info.json")).toBe(false);
      expect(isAgentArtifactFilePath("/somewhere/else/_analysis.json")).toBe(false);
    });

    it("工作区根下但不在 screen_ 目录里的也不算", () => {
      expect(isScreenInfoFilePath(inWorkspace("tasks/info.json"))).toBe(false);
    });
  });

  describe("组件文件与元数据的边界", () => {
    it("component/ 下的 {id}_{name}.json 是组件", () => {
      expect(isComponentFilePath(inWorkspace("screen_75_1/component/4152_条形图.json"))).toBe(true);
      expect(isComponentFilePath(inWorkspace("screen_75_1/component/4156_分组/4155_条形图.json"))).toBe(true);
    });

    /**
     * _layout.json 就落在 component/ 里。此前它同时命中「组件」（先判、且必然校验失败，
     * agent 根本改不动它）与「agent 产物」；现在按 _ 前缀排除，与 ScreenReader.readComponents、
     * collectExistingIds 的忽略规则同口径。
     */
    it("component/ 下 _ 开头的是元数据，不是组件", () => {
      const layout = inWorkspace("screen_75_1/component/4156_分组/_layout.json");
      expect(isComponentFilePath(layout)).toBe(false);
      expect(isAgentArtifactFilePath(layout)).toBe(true);
    });

    it("component/ 下的 .vue 是 vue-part 伴生文件，不是组件 json", () => {
      const sfc = inWorkspace("screen_75_1/component/4166_自定义组件.vue");
      expect(isVuePartFilePath(sfc)).toBe(true);
      expect(isComponentFilePath(sfc)).toBe(false);
    });
  });

  describe("数据过滤器", () => {
    it("dataFilterArr/ 下成对的 json 与 js 都算", () => {
      expect(isDataFilterFilePath(inWorkspace("screen_75_1/dataFilterArr/myFilter.json"))).toBe(true);
      expect(isDataFilterFilePath(inWorkspace("screen_75_1/dataFilterArr/myFilter.js"))).toBe(true);
    });

    it("其他扩展名不算", () => {
      expect(isDataFilterFilePath(inWorkspace("screen_75_1/dataFilterArr/readme.md"))).toBe(false);
    });
  });
});
