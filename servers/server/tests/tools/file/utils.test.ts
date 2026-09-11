import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildIdNameBase,
  buildStateDirName,
  extractIdFromIdName,
  extractStateIdFromDirName,
  findComponentFileInWorkspace,
  isAmbiguousMatch,
  normalizeChildRefs,
  parsePlacementFromDir,
  parsePlacementFromPath,
  parseScopedComponentId,
  validateComponentContent
} from "../../../src/mastra/tools/file/utils";

// 组件文件/目录命名与路径解析的单元测试。
// 命名规则：`{id}_{name}`（name 为空时退回组件类型），状态目录 `{stateId}_{stateName}`，
// 兼容旧格式 `{id}_{name}_{title}` 与纯 `{id}`。create/copy/delete/edit/push/event-template/scope 共用这套规则。

describe("extractIdFromIdName", () => {
  it("从 {id}_{name} 提取 id", () => {
    expect(extractIdFromIdName("3288025_指标")).toBe(3288025);
  });

  it("从带扩展名的文件名提取 id", () => {
    expect(extractIdFromIdName("3288025_指标.json")).toBe(3288025);
  });

  it("兼容旧格式 {id}_{name}_{title}（多下划线取首段）", () => {
    expect(extractIdFromIdName("3288025_指标_分组")).toBe(3288025);
  });

  it("兼容纯 {id}", () => {
    expect(extractIdFromIdName("3288025")).toBe(3288025);
  });

  it("兼容纯 {id}.json", () => {
    expect(extractIdFromIdName("3288025.json")).toBe(3288025);
  });

  it("非数字开头（如 state uuid）返回 null", () => {
    expect(extractIdFromIdName("7aVbpy5n-xxx_一级")).toBeNull();
    expect(extractIdFromIdName("state-1")).toBeNull();
  });

  it("空串返回 null", () => {
    expect(extractIdFromIdName("")).toBeNull();
  });
});

describe("buildIdNameBase", () => {
  it("生成 {id}_{name}", () => {
    expect(buildIdNameBase(3288025, "指标")).toBe("3288025_指标");
  });

  it("name 为空（净化后为空）时退化为纯 id", () => {
    expect(buildIdNameBase(3288025, "")).toBe("3288025");
  });

  it("白名单净化：只保留文字/数字/连字符，剔除标点空格下划线", () => {
    // 斜杠、竖线、引号、中文顿号、空格全部剔除
    expect(buildIdNameBase(1, 'a/b|c"d、e')).toBe("1_abcde");
  });

  it("name 截断到 10 字（与 MAX_NAME_LEN 一致）", () => {
    expect(buildIdNameBase(1, "一二三四五六七八九十十一十二")).toBe("1_一二三四五六七八九十");
  });
});

describe("buildStateDirName / extractStateIdFromDirName", () => {
  it("生成 {stateId}_{stateName}", () => {
    expect(buildStateDirName("7aVbpy5n-xxx", "一级")).toBe("7aVbpy5n-xxx_一级");
  });

  it("stateName 缺省时退化为纯 stateId", () => {
    expect(buildStateDirName("7aVbpy5n-xxx", undefined)).toBe("7aVbpy5n-xxx");
  });

  it("从 {stateId}_{stateName} 取首个下划线之前作为 stateId", () => {
    expect(extractStateIdFromDirName("7aVbpy5n-xxx_一级")).toBe("7aVbpy5n-xxx");
  });

  it("无下划线时原样返回（兼容旧数据）", () => {
    expect(extractStateIdFromDirName("7aVbpy5n-xxx")).toBe("7aVbpy5n-xxx");
  });
});

describe("parsePlacementFromPath", () => {
  it("顶层组件（component 直下）无 placement", () => {
    expect(parsePlacementFromPath("screen_30729_1/component/3288026_底图_图片.json")).toBeNull();
  });

  it("分组子组件 → group", () => {
    expect(parsePlacementFromPath("screen_1/component/3288022_分组_x/3290001_x_柱状图.json")).toEqual({
      parentId: 3288022,
      parentType: "group"
    });
  });

  it("动态面板状态内子组件 → dynamicPanel + stateId", () => {
    expect(
      parsePlacementFromPath("screen_1/component/3288021_左面板_动态面板/7aVbpy5n-xxx_一级/3288025_指标_分组.json")
    ).toEqual({
      parentId: 3288021,
      parentType: "dynamicPanel",
      stateId: "7aVbpy5n-xxx"
    });
  });

  it("兼容旧命名 {id}_{name}", () => {
    expect(parsePlacementFromPath("screen_1/component/100_分组/200_子组件.json")).toEqual({
      parentId: 100,
      parentType: "group"
    });
  });

  it("兼容纯 id 旧命名", () => {
    expect(parsePlacementFromPath("screen_1/component/100/200.json")).toEqual({
      parentId: 100,
      parentType: "group"
    });
  });

  it("Windows 反斜杠路径同样解析", () => {
    expect(parsePlacementFromPath("screen_1\\component\\100_分组\\200_子.json")).toEqual({
      parentId: 100,
      parentType: "group"
    });
  });

  it("无 component 段返回 null", () => {
    expect(parsePlacementFromPath("screen_1/3288026_底图_图片.json")).toBeNull();
  });
});

describe("normalizeChildRefs", () => {
  it("children 字符串数组 → 数字 id 数组", () => {
    const parsed: Record<string, unknown> = {
      children: ["3303598_开机设备_翻牌器", "3303599_指标_数字翻牌"]
    };
    normalizeChildRefs(parsed);
    expect(parsed.children).toEqual([3303598, 3303599]);
  });

  it("children 已是数字时原样保留", () => {
    const parsed: Record<string, unknown> = { children: [3303598, 3303599] };
    normalizeChildRefs(parsed);
    expect(parsed.children).toEqual([3303598, 3303599]);
  });

  it("children 混合类型：字符串转数字，数字原样", () => {
    const parsed: Record<string, unknown> = { children: ["3303598_开机_翻牌器", 3303599] };
    normalizeChildRefs(parsed);
    expect(parsed.children).toEqual([3303598, 3303599]);
  });

  it("panelData[i].config 字符串数组 → 数字 id 数组", () => {
    const parsed: Record<string, unknown> = {
      panelData: [
        { id: "state-1", config: ["3303598_开机设备_翻牌器", "3303600_图表_折线图"] },
        { id: "state-2", config: ["3303601_底图_图片"] }
      ]
    };
    normalizeChildRefs(parsed);
    const states = parsed.panelData as Array<{ id: string; config: unknown[] }>;
    expect(states[0].config).toEqual([3303598, 3303600]);
    expect(states[1].config).toEqual([3303601]);
  });

  it("无法解析 id 的字符串原样保留（兼容降级）", () => {
    const parsed: Record<string, unknown> = { children: ["state-uuid-xxx", "3303598_指标_数字"] };
    normalizeChildRefs(parsed);
    expect(parsed.children).toEqual(["state-uuid-xxx", 3303598]);
  });

  it("无 children / panelData 时无副作用", () => {
    const parsed: Record<string, unknown> = { id: 1, name: "test" };
    normalizeChildRefs(parsed);
    expect(parsed).toEqual({ id: 1, name: "test" });
  });
});

describe("parsePlacementFromDir", () => {
  it("分组目录 → group", () => {
    expect(parsePlacementFromDir("screen_1/component/100_分组")).toEqual({
      parentId: 100,
      parentType: "group"
    });
  });

  it("动态面板状态目录 → dynamicPanel + stateId", () => {
    expect(parsePlacementFromDir("screen_1/component/100_面板/7aVbpy5n-xxx_状态")).toEqual({
      parentId: 100,
      parentType: "dynamicPanel",
      stateId: "7aVbpy5n-xxx"
    });
  });

  it("component 直下的目录无 placement", () => {
    expect(parsePlacementFromDir("screen_1/component")).toBeNull();
  });
});

describe("parseScopedComponentId", () => {
  // 组件 id 单独拿出来不足以定位组件：工作区里多块屏并存，同一个 id 可能在好几块屏上都有。
  // 所以入参形态是 "{screenId}_{versionCode}/{componentId}"。

  it("拆出屏与组件 id", () => {
    expect(parseScopedComponentId("29445_1/4177")).toEqual({ screenKey: "29445_1", componentId: 4177 });
  });

  it("容忍把目录名整个抄进来的写法", () => {
    expect(parseScopedComponentId("screen_29445_1/4177")).toEqual({ screenKey: "29445_1", componentId: 4177 });
  });

  it("组件段带文件名后缀也认", () => {
    expect(parseScopedComponentId("29445_1/4177_分组.json")).toEqual({ screenKey: "29445_1", componentId: 4177 });
  });

  it("没有屏前缀时 screenKey 为 null——退化成全区搜，由调用方处理歧义", () => {
    expect(parseScopedComponentId("4177")).toEqual({ screenKey: null, componentId: 4177 });
  });

  it("数字入参按裸 id 处理", () => {
    expect(parseScopedComponentId(4177)).toEqual({ screenKey: null, componentId: 4177 });
  });

  it("解不出组件 id 时返回 null，不抛", () => {
    expect(parseScopedComponentId("29445_1/不是数字").componentId).toBeNull();
    expect(parseScopedComponentId("").componentId).toBeNull();
  });
});

describe("findComponentFileInWorkspace", () => {
  // 两块屏各有一个 id 4177 的组件——这正是把别的屏的分组解散掉的那个现场。
  const makeWorkspace = (): string => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "screenwright-scope-"));
    for (const screen of ["screen_9007_1", "screen_9012_1"]) {
      const dir = path.join(root, screen, "component");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "4177_分组.json"), "{}", "utf-8");
    }
    // 只有 9012 有这个组件，用来验证「给了屏也能正常找到」
    fs.writeFileSync(path.join(root, "screen_9012_1", "component", "4175_条形图.json"), "{}", "utf-8");
    return root;
  };

  it("给了屏前缀时只在那块屏下找", async () => {
    const root = makeWorkspace();
    const found = await findComponentFileInWorkspace(root, "9012_1/4177");

    expect(isAmbiguousMatch(found)).toBe(false);
    expect((found as { file: string }).file).toContain("screen_9012_1");
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("没给屏且多块屏都命中时报歧义，而不是静默取第一个", async () => {
    const root = makeWorkspace();
    const found = await findComponentFileInWorkspace(root, "4177");

    expect(isAmbiguousMatch(found)).toBe(true);
    expect((found as { ambiguous: string[] }).ambiguous).toHaveLength(2);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("没给屏但只有一处命中时照常返回", async () => {
    const root = makeWorkspace();
    const found = await findComponentFileInWorkspace(root, "4175");

    expect(isAmbiguousMatch(found)).toBe(false);
    expect((found as { base: string }).base).toBe("4175_条形图");
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("找不到返回 null", async () => {
    const root = makeWorkspace();
    expect(await findComponentFileInWorkspace(root, "9012_1/999999")).toBeNull();
    fs.rmSync(root, { recursive: true, force: true });
  });
});

describe("validateComponentContent 的两层校验", () => {
  // 结构层（ComponentFlatSchema）是硬闸门，属性层（per-prop 的 option/data）只警告。
  // 原因见函数注释：per-prop schema 比真实数据严，硬拦会让组件被历史脏数据永久锁死——
  // 实测从产品接口导出的 9 个组件里有 3 个过不了属性层，却在画布上跑得好好的。

  /** 一个结构完整的折线柱形图；option 故意缺 yAxisIndex（真实导出数据就是这样） */
  const lineAndBar = (over: Record<string, unknown> = {}) =>
    JSON.stringify({
      id: 4181,
      name: "折线柱形图",
      title: "折线柱形图",
      component: { prop: "echartlineAndBar", name: "echart-lineAndBar", width: 600, height: 300 },
      left: 0,
      top: 0,
      zIndex: 1,
      display: true,
      option: {},
      data: [],
      ...over
    });

  it("结构层坏了就拒绝——宽度是字符串", () => {
    const result = validateComponentContent(
      lineAndBar({ component: { prop: "echartlineAndBar", name: "x", width: "很宽", height: 300 } })
    );

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : (result.validationErrors ?? []).join()).toContain("component.width");
  });

  it("只有属性层不匹配时放行，并把问题记进 warnings", () => {
    const result = validateComponentContent(lineAndBar());

    expect(result.ok).toBe(true);
    // 放行是重点：改这个组件的宽度不该被它 option 里的旧账拦住
    expect(result.ok && result.warnings?.join()).toContain("yAxisIndex");
  });

  it("属性层放行时交出的仍是结构层的产物，不是半截的 parse 结果", () => {
    const result = validateComponentContent(lineAndBar());

    expect(result.ok && result.data.id).toBe(4181);
    expect(result.ok && result.data.component.width).toBe(600);
  });

  it("两层都过时没有 warnings", () => {
    const result = validateComponentContent(
      JSON.stringify({
        id: 4177,
        name: "分组",
        title: "分组",
        component: { prop: "sw-folder", name: "sw-folder", width: 100, height: 100 },
        left: 0,
        top: 0,
        zIndex: 1,
        display: true,
        option: {}
      })
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.warnings).toBeUndefined();
  });

  it("不是 JSON 直接拒绝", () => {
    expect(validateComponentContent("{ 这不是 JSON").ok).toBe(false);
  });

  // 顶层多余键默认被 zod 静默丢弃，不报错也不警告——写的人以为生效了，实际这个键从落盘
  // 那一刻起就是死的。真实案例：cbArgs（组件抛回调参数的字段）写成了 callbackArgs，两个
  // 词在 skill 文档里挨着出现、含义却不同，写错后 editFilesTool 照样返回成功，但组件的
  // 回调链路永远不会触发——比结构校验直接报错更难查，所以放行的同时必须警告。
  it("顶层多余键放行但要警告——cbArgs 写成 callbackArgs 的真实案例", () => {
    const result = validateComponentContent(
      lineAndBar({
        callbackArgs: [
          { id: "callback_1", name: "点击类目", value: { origin: { value: "name" }, target: { value: "clickedName" } } }
        ]
      })
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.warnings?.join()).toContain("callbackArgs");
    // 没被当成 cbArgs 用：结构层产物里 cbArgs 仍是默认空数组，这正是「写了没生效」的根源
    expect(result.ok && (result.data as { cbArgs?: unknown[] }).cbArgs).toEqual([]);
  });

  it("顶层多余键 + 属性层不匹配，两类警告都要出现", () => {
    const result = validateComponentContent(lineAndBar({ notARealField: 1 }));

    expect(result.ok).toBe(true);
    const warnings = (result.ok && result.warnings?.join()) || "";
    expect(warnings).toContain("yAxisIndex");
    expect(warnings).toContain("notARealField");
  });

  it("没有多余键时不产生这条警告", () => {
    const result = validateComponentContent(lineAndBar());

    expect(result.ok && result.warnings?.some((w) => w.includes("不认识的键"))).toBe(false);
  });
});
