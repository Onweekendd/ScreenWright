import { describe, expect, it } from "vitest";

import { solveLayout, ZoneTreeError } from "@/mastra/workflows/requirement-to-bi/layout/solve-layout";
import type { ContentItem, Rect, Zone } from "@/mastra/workflows/requirement-to-bi/types";

/**
 * 锁住求解器的两条核心承诺：
 *   1. 子矩形永远落在画布内、两两不相交——「重叠」「出界」在结构上不可能，不是靠事后检查
 *   2. 容器类型完全由内容项的 views 推导，模型没有这个选项
 * 外加分区树的结构校验：span 不平 / 内容项漏放重放，必须在花钱选组件之前就拦下来。
 */

const CANVAS = { canvasWidth: 1920, canvasHeight: 1080 };

/** 电力监控大屏：这份 fixture 与设计讨论里用的例子一致，改动时两边一起改 */
const POWER_CONTENTS: ContentItem[] = [
  { id: "c1", name: "实时总负荷", kind: "kpi", unit: "MW" },
  { id: "c2", name: "电网频率", kind: "kpi", unit: "Hz" },
  { id: "c3", name: "24h 负荷曲线", kind: "trend", dims: ["时间"], measures: ["负荷"] },
  { id: "c4", name: "各厂站出力对比", kind: "rank", dims: ["厂站"], measures: ["出力"], views: ["日", "月", "年"] },
  { id: "c5", name: "装机构成", kind: "share", dims: ["能源类型"] },
  { id: "c6", name: "实时告警", kind: "list", views: ["全部", "紧急"] },
  { id: "c7", name: "标题", kind: "title" }
];

const POWER_TREE: Zone = {
  dir: "col",
  children: [
    { span: 2, zone: { leaf: { role: "header", contentIds: ["c7"] } } },
    {
      span: 10,
      zone: {
        dir: "row",
        children: [
          {
            span: 6,
            zone: {
              dir: "col",
              children: [
                { span: 3, zone: { leaf: { role: "kpi-strip", contentIds: ["c1", "c2"] } } },
                { span: 7, zone: { leaf: { role: "trend", contentIds: ["c3"] } } }
              ]
            }
          },
          { span: 10, zone: { leaf: { role: "main-viz", contentIds: ["c4"] } } },
          {
            span: 8,
            zone: {
              dir: "col",
              children: [
                { span: 5, zone: { leaf: { role: "share", contentIds: ["c5"] } } },
                { span: 5, zone: { leaf: { role: "alarm-list", contentIds: ["c6"] } } }
              ]
            }
          }
        ]
      }
    }
  ]
};

const overlaps = (a: Rect, b: Rect): boolean =>
  a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;

describe("solveLayout · 结构性保证", () => {
  it("所有分区都在画布内", () => {
    const zones = solveLayout(POWER_TREE, POWER_CONTENTS, CANVAS);
    for (const z of zones) {
      expect(z.rect.left).toBeGreaterThanOrEqual(0);
      expect(z.rect.top).toBeGreaterThanOrEqual(0);
      expect(z.rect.left + z.rect.width).toBeLessThanOrEqual(CANVAS.canvasWidth);
      expect(z.rect.top + z.rect.height).toBeLessThanOrEqual(CANVAS.canvasHeight);
      expect(z.rect.width).toBeGreaterThan(0);
      expect(z.rect.height).toBeGreaterThan(0);
    }
  });

  it("分区两两不重叠", () => {
    const zones = solveLayout(POWER_TREE, POWER_CONTENTS, CANVAS);
    for (let i = 0; i < zones.length; i += 1) {
      for (let j = i + 1; j < zones.length; j += 1) {
        expect(overlaps(zones[i].rect, zones[j].rect), `${zones[i].role} 与 ${zones[j].role} 重叠`).toBe(false);
      }
    }
  });

  it("区内组件也不重叠，且都在容器内", () => {
    const zones = solveLayout(POWER_TREE, POWER_CONTENTS, CANVAS);
    for (const z of zones) {
      for (const item of z.items) {
        expect(item.rect.left).toBeGreaterThanOrEqual(z.rect.left);
        expect(item.rect.top).toBeGreaterThanOrEqual(z.rect.top);
        expect(item.rect.left + item.rect.width).toBeLessThanOrEqual(z.rect.left + z.rect.width);
        expect(item.rect.top + item.rect.height).toBeLessThanOrEqual(z.rect.top + z.rect.height);
      }
      for (let i = 0; i < z.items.length; i += 1) {
        for (let j = i + 1; j < z.items.length; j += 1) {
          expect(overlaps(z.items[i].rect, z.items[j].rect)).toBe(false);
        }
      }
    }
  });

  it("末段贴边：同层最后一块的右/下边缘与父矩形齐平，不留舍入缝", () => {
    // 用故意除不尽的 span 组合逼出舍入：7+8+9 = 24
    const tree: Zone = {
      dir: "row",
      children: [
        { span: 7, zone: { leaf: { role: "a", contentIds: ["c1"] } } },
        { span: 8, zone: { leaf: { role: "b", contentIds: ["c2"] } } },
        { span: 9, zone: { leaf: { role: "c", contentIds: ["c3"] } } }
      ]
    };
    const zones = solveLayout(tree, POWER_CONTENTS.slice(0, 3), { ...CANVAS, padding: 24 });
    const last = zones[zones.length - 1];
    expect(last.rect.left + last.rect.width).toBe(CANVAS.canvasWidth - 24);
  });

  it("每个内容项恰好被放置一次", () => {
    const zones = solveLayout(POWER_TREE, POWER_CONTENTS, CANVAS);
    const placed = zones.flatMap((z) => z.items.map((i) => i.contentId));
    expect(placed.sort()).toEqual(POWER_CONTENTS.map((c) => c.id).sort());
  });
});

describe("solveLayout · 容器类型由内容推导", () => {
  it("内容项有多个 views 的区推成 ft-panel，states 来自 views", () => {
    const zones = solveLayout(POWER_TREE, POWER_CONTENTS, CANVAS);
    const main = zones.find((z) => z.role === "main-viz")!;
    expect(main.container).toBe("sw-panel");
    expect(main.states).toEqual(["日", "月", "年"]);

    const alarm = zones.find((z) => z.role === "alarm-list")!;
    expect(alarm.container).toBe("sw-panel");
    expect(alarm.states).toEqual(["全部", "紧急"]);
  });

  it("单视图的区是 ft-folder，且不带 states", () => {
    const zones = solveLayout(POWER_TREE, POWER_CONTENTS, CANVAS);
    const folders = zones.filter((z) => z.container === "sw-folder");
    expect(folders.map((z) => z.role).sort()).toEqual(["header", "kpi-strip", "share", "trend"]);
    for (const f of folders) {
      expect(f.states).toBeUndefined();
    }
  });

  it("views 只有一项时仍是 ft-folder——单元素的切换没有意义", () => {
    const contents: ContentItem[] = [{ id: "c1", name: "只有一个视图", kind: "rank", views: ["日"] }];
    const tree: Zone = { leaf: { role: "solo", contentIds: ["c1"] } };
    expect(solveLayout(tree, contents, CANVAS)[0].container).toBe("sw-folder");
  });
});

describe("solveLayout · 分区树校验", () => {
  const expectIssue = (tree: Zone, contents: ContentItem[], match: RegExp): void => {
    try {
      solveLayout(tree, contents, CANVAS);
      throw new Error("本应抛 ZoneTreeError");
    } catch (err) {
      expect(err).toBeInstanceOf(ZoneTreeError);
      expect((err as ZoneTreeError).issues.join("\n")).toMatch(match);
    }
  };

  it("span 之和不等于父可分配格数时报出是哪一层", () => {
    const tree: Zone = {
      dir: "col",
      children: [
        { span: 2, zone: { leaf: { role: "a", contentIds: ["c1"] } } },
        { span: 9, zone: { leaf: { role: "b", contentIds: ["c2"] } } } // 2+9=11 ≠ 12
      ]
    };
    expectIssue(tree, POWER_CONTENTS.slice(0, 2), /span 之和为 11,应为 12/u);
  });

  it("内容项漏放时点名", () => {
    const tree: Zone = {
      dir: "col",
      children: [
        { span: 6, zone: { leaf: { role: "a", contentIds: ["c1"] } } },
        { span: 6, zone: { leaf: { role: "b", contentIds: ["c2"] } } }
      ]
    };
    expectIssue(tree, POWER_CONTENTS.slice(0, 3), /内容项未被放置：c3/u);
  });

  it("内容项重复放置时点名", () => {
    const tree: Zone = {
      dir: "col",
      children: [
        { span: 6, zone: { leaf: { role: "a", contentIds: ["c1"] } } },
        { span: 6, zone: { leaf: { role: "b", contentIds: ["c1", "c2"] } } }
      ]
    };
    expectIssue(tree, POWER_CONTENTS.slice(0, 2), /内容项被重复放置：c1（2 次）/u);
  });

  it("引用不存在的内容 id 时点名", () => {
    const tree: Zone = {
      dir: "col",
      children: [
        { span: 6, zone: { leaf: { role: "a", contentIds: ["c1"] } } },
        { span: 6, zone: { leaf: { role: "b", contentIds: ["c2", "ghost"] } } }
      ]
    };
    expectIssue(tree, POWER_CONTENTS.slice(0, 2), /不存在的 id：ghost/u);
  });

  it("一次抛出全部问题，而不是遇到第一个就停", () => {
    // 这条是刻意保留的：错误会被喂回模型重生成，一轮只修一个问题最贵
    const tree: Zone = {
      dir: "col",
      children: [
        { span: 2, zone: { leaf: { role: "a", contentIds: ["c1"] } } },
        { span: 9, zone: { leaf: { role: "b", contentIds: ["c1"] } } }
      ]
    };
    try {
      solveLayout(tree, POWER_CONTENTS.slice(0, 3), CANVAS);
      throw new Error("本应抛 ZoneTreeError");
    } catch (err) {
      // span 不平 + c1 重复 + c2/c3 漏放，三类问题应该一次报齐
      expect((err as ZoneTreeError).issues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("嵌套过深时拦下", () => {
    // 每一层的 span 都是配平的，唯一的问题就是深度——否则会被 span 报错掩盖，测不到深度这条
    const deep: Zone = {
      dir: "col", // {24,12} 切行
      children: [
        {
          span: 6,
          zone: {
            dir: "row", // {24,6} 切列
            children: [
              {
                span: 12,
                zone: {
                  dir: "col", // {12,6} 切行
                  children: [
                    {
                      span: 3,
                      zone: {
                        dir: "row", // {12,3} 切列——它的子节点在第 5 层
                        children: [
                          { span: 6, zone: { leaf: { role: "too-deep-a", contentIds: ["c4"] } } },
                          { span: 6, zone: { leaf: { role: "too-deep-b", contentIds: ["c5"] } } }
                        ]
                      }
                    },
                    { span: 3, zone: { leaf: { role: "d3", contentIds: ["c3"] } } }
                  ]
                }
              },
              { span: 12, zone: { leaf: { role: "d2", contentIds: ["c2"] } } }
            ]
          }
        },
        { span: 6, zone: { leaf: { role: "d1", contentIds: ["c1"] } } }
      ]
    };
    try {
      solveLayout(deep, POWER_CONTENTS.slice(0, 5), CANVAS);
      throw new Error("本应抛 ZoneTreeError");
    } catch (err) {
      expect((err as ZoneTreeError).issues.join("\n")).toMatch(/嵌套超过 4 层/u);
    }
  });
});

describe("solveLayout · 长宽比体检", () => {
  it("严重偏离时给 warning 而不是失败", () => {
    // share 理想 1:1，这里给它一条 24×1 的横条
    const contents: ContentItem[] = [
      { id: "c1", name: "装机构成", kind: "share" },
      { id: "c2", name: "别的", kind: "trend" }
    ];
    const tree: Zone = {
      dir: "col",
      children: [
        { span: 1, zone: { leaf: { role: "squeezed", contentIds: ["c1"] } } },
        { span: 11, zone: { leaf: { role: "rest", contentIds: ["c2"] } } }
      ]
    };
    const zones = solveLayout(tree, contents, CANVAS);
    const squeezed = zones.find((z) => z.role === "squeezed")!;
    expect(squeezed.aspectWarnings).toHaveLength(1);
    expect(squeezed.aspectWarnings[0]).toMatch(/装机构成/u);
  });

  it("比例合适时没有 warning", () => {
    const zones = solveLayout(POWER_TREE, POWER_CONTENTS, CANVAS);
    const share = zones.find((z) => z.role === "share")!;
    expect(share.aspectWarnings).toEqual([]);
  });

  it("多项区按每一项自己的矩形比，不是拿整区去比", () => {
    // 回归实测事故：一条 1872×83 的 KPI 条里放 4 个 KPI，每项实际约 453×59（比 7.7），
    // 但当时拿整区的 22.55 去比每一项，报出「偏离 9.4 倍」——虚高三倍多，
    // 上游 agent 据此判定布局坏了，推翻了一份其实可用的产出去手工返工。
    const contents: ContentItem[] = [
      { id: "k1", name: "总负荷", kind: "kpi" },
      { id: "k2", name: "频率", kind: "kpi" },
      { id: "k3", name: "发电量", kind: "kpi" },
      { id: "k4", name: "告警数", kind: "kpi" },
      { id: "rest", name: "主图", kind: "rank" }
    ];
    const tree: Zone = {
      dir: "col",
      children: [
        { span: 1, zone: { leaf: { role: "kpi-strip", contentIds: ["k1", "k2", "k3", "k4"] } } },
        { span: 11, zone: { leaf: { role: "main", contentIds: ["rest"] } } }
      ]
    };
    const strip = solveLayout(tree, contents, CANVAS).find((z) => z.role === "kpi-strip")!;

    // 整区是极扁的横条，但每一项只占四分之一宽——两者必须显著不同，
    // 具体倍数不写死（容器内边距也吃高度，实测约 2.96 倍，卡死 3 倍会脆）
    const zoneRatio = strip.rect.width / strip.rect.height;
    const itemRatio = strip.items[0].rect.width / strip.items[0].rect.height;
    expect(zoneRatio).toBeGreaterThan(itemRatio * 2);

    // warning 里报的必须是单项的实得尺寸，不是整区的
    const reported = strip.aspectWarnings.join(" ");
    expect(reported).toContain(`${strip.items[0].rect.width}×${strip.items[0].rect.height}`);
    expect(reported).not.toContain(`${strip.rect.width}×${strip.rect.height}`);
  });
});
