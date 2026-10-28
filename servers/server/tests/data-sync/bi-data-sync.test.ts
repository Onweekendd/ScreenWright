import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// 在模块加载前设置 WORKSPACE_PATH，使 getScreenDirPath 指向测试输出目录
const OUTPUT_DIR = path.resolve(__dirname, "output");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

import { readScreenMeta, syncScreenData } from "../../src/mastra/services/bi-data-sync";
import { buildIdNameBase, buildStateDirName } from "../../src/mastra/tools/file/utils";
import testFixture from "./templateSmartSchool.json";

// ----------------------------------------------------------------
// 从 fixture 中提取关键数据，用于断言时不依赖硬编码值
// ----------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parsedInfo = testFixture.result as any;
const screenDir = path.join(OUTPUT_DIR, `screen_${testFixture.id}`);
const componentDir = path.join(screenDir, "component");

/** fixture 中第一个动态面板（layers[0]，prop = ft-panel） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dynamicPanel = testFixture.result.layers[0] as any;
const firstState = dynamicPanel.panelData[0];
const firstStateChild = firstState.config[0];

const dynamicPanelIdName = buildIdNameBase(dynamicPanel.id, dynamicPanel.name ?? dynamicPanel.title ?? "");
const firstStateDirName = buildStateDirName(firstState.id, firstState.name);
const firstStateChildIdName = buildIdNameBase(firstStateChild.id, firstStateChild.name ?? firstStateChild.title ?? "");

// ----------------------------------------------------------------

describe("syncScreenData", () => {
  beforeAll(() => {
    syncScreenData({
      id: testFixture.id,
      cacheTime: testFixture.cacheTime,
      parsedLargeScreenInfo: parsedInfo
    });
  });

  afterAll(() => {
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
  });

  // ── 顶级文件 ──────────────────────────────────────────────────
  describe("顶级文件", () => {
    it.each(["_meta.json", "info.json", "aniFrameSet.json", "statusAnimation.json"])("创建 %s", (filename) => {
      expect(existsSync(path.join(screenDir, filename))).toBe(true);
    });

    it("config 并入 info.json，不再单独落 config.json", () => {
      expect(existsSync(path.join(screenDir, "config.json"))).toBe(false);
      const info = JSON.parse(readFileSync(path.join(screenDir, "info.json"), "utf-8"));
      expect(info.config).toEqual(parsedInfo.config);
    });

    it("创建 dataFilterArr 目录", () => {
      expect(existsSync(path.join(screenDir, "dataFilterArr"))).toBe(true);
    });
  });

  // ── _meta.json ────────────────────────────────────────────────
  it("父组件内的轻量引用均指向实际子文件，不再产生独立布局索引", () => {
    const verify = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          verify(file);
        } else if (entry.name.endsWith(".json") && !entry.name.startsWith("_")) {
          const component = JSON.parse(readFileSync(file, "utf8"));
          const base = path.join(dir, path.basename(file, ".json"));
          const check = (refs: Array<{ id: number; file: string; prop: string }>, childDir: string) => {
            for (const ref of refs) {
              const child = JSON.parse(readFileSync(path.join(childDir, ref.file), "utf8"));
              expect(child.id).toBe(ref.id);
              expect(child.component.prop).toBe(ref.prop);
              expect(ref).not.toHaveProperty("option");
              expect(ref).not.toHaveProperty("children");
            }
          };
          if (component.component?.prop === "sw-folder" && component.children?.length) {
            check(component.children, base);
          }
          if (component.component?.prop === "sw-panel") {
            for (const state of component.panelData ?? []) {
              check(state.config, path.join(base, buildStateDirName(state.id, state.name)));
            }
          }
        }
        expect(entry.name).not.toBe("_layout.json");
      }
    };
    verify(screenDir);
  });

  it("同步时清理旧根目录和状态目录的布局索引", () => {
    const rootIndex = path.join(screenDir, "_layout.json");
    const nestedIndex = path.join(componentDir, dynamicPanelIdName, firstStateDirName, "_layout.json");
    writeFileSync(rootIndex, "{}");
    writeFileSync(nestedIndex, "{}");
    syncScreenData({ id: testFixture.id, cacheTime: testFixture.cacheTime, parsedLargeScreenInfo: parsedInfo });
    expect(existsSync(rootIndex)).toBe(false);
    expect(existsSync(nestedIndex)).toBe(false);
  });

  describe("_meta.json", () => {
    const readMeta = () => JSON.parse(readFileSync(path.join(screenDir, "_meta.json"), "utf-8"));

    it("包含正确的 updatedTime", () => {
      expect(readMeta().updatedTime).toBe(parsedInfo.updatedTime);
    });

    it("包含 updatedTime 和 componentIds 字段", () => {
      expect(Object.keys(readMeta()).sort()).toEqual(["componentIds", "updatedTime"]);
    });
  });

  // ── info.json ─────────────────────────────────────────────────
  describe("info.json", () => {
    const readMeta = () => JSON.parse(readFileSync(path.join(screenDir, "info.json"), "utf-8"));

    it("包含基本信息字段", () => {
      const meta = readMeta();
      expect(meta.id).toBe(parsedInfo.id);
      expect(meta.name).toBe(parsedInfo.name);
      expect(meta.versionCode).toBe(parsedInfo.versionCode);
    });

    it.each(["layers", "dataFilterArr", "aniFrameSet", "statusAnimation"])("不包含重型字段 %s", (field) => {
      expect(readMeta()).not.toHaveProperty(field);
    });
  });

  // ── 动态面板组件 ───────────────────────────────────────────────
  describe("动态面板组件", () => {
    it("创建自身 JSON 文件", () => {
      expect(existsSync(path.join(componentDir, `${dynamicPanelIdName}.json`))).toBe(true);
    });

    it("panelData.config 存储子组件轻量引用而非完整配置", () => {
      const json = JSON.parse(readFileSync(path.join(componentDir, `${dynamicPanelIdName}.json`), "utf-8"));
      const config = json.panelData[0].config;
      expect(Array.isArray(config)).toBe(true);
      expect(config[0]).toMatchObject({ id: firstStateChild.id, prop: firstStateChild.component.prop });
      expect(Object.keys(config[0]).sort()).toEqual(["file", "id", "name", "prop", "type"]);
    });

    it("panelData.config 的 ID 与原始子组件 ID 一致", () => {
      const json = JSON.parse(readFileSync(path.join(componentDir, `${dynamicPanelIdName}.json`), "utf-8"));
      const expectedIdNames = firstState.config.map((c: { id: number; name?: string; title?: string }) =>
        buildIdNameBase(c.id, c.name ?? c.title ?? "")
      );
      expect(json.panelData[0].config.map((ref: { file: string }) => ref.file)).toEqual(
        expectedIdNames.map((name: string) => `${name}.json`)
      );
    });

    it("为每个状态创建子目录", () => {
      expect(existsSync(path.join(componentDir, dynamicPanelIdName, firstStateDirName))).toBe(true);
    });

    it("状态目录内包含子组件 JSON 文件", () => {
      const childPath = path.join(componentDir, dynamicPanelIdName, firstStateDirName, `${firstStateChildIdName}.json`);
      expect(existsSync(childPath)).toBe(true);
    });

    it("状态内的子组件 JSON 包含完整数据", () => {
      const childPath = path.join(componentDir, dynamicPanelIdName, firstStateDirName, `${firstStateChildIdName}.json`);
      const json = JSON.parse(readFileSync(childPath, "utf-8"));
      expect(json.id).toBe(firstStateChild.id);
      expect(json).toHaveProperty("component");
    });
  });

  // ── readScreenMeta ────────────────────────────────────────────
  describe("readScreenMeta", () => {
    it("正确读取已存在的 _meta.json", () => {
      const meta = readScreenMeta(testFixture.id);
      expect(meta).not.toBeNull();
      expect(meta?.updatedTime).toBe(parsedInfo.updatedTime);
    });

    it("不存在时返回 null", () => {
      expect(readScreenMeta("non-existent_99999")).toBeNull();
    });
  });
});
